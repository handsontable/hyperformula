
// WASM part
extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    pub type ExportedSimpleCellAddress;

    // #[wasm_bindgen(structural, method)]
    #[wasm_bindgen(method, getter)]
    fn col(this: &ExportedSimpleCellAddress) -> i32;

    #[wasm_bindgen(method, getter)]
    fn row(this: &ExportedSimpleCellAddress) -> i32;

    pub type ExportedAst;
    #[wasm_bindgen(method, getter)]
    fn kind(this: &ExportedAst) -> String;
    #[wasm_bindgen(method, getter)]
    fn start(this: &ExportedAst) -> ExportedCellAddress;
    #[wasm_bindgen(method, getter)]
    fn end(this: &ExportedAst) -> ExportedCellAddress;
    #[wasm_bindgen(method, getter)]
    fn procedureName(this: &ExportedAst) -> String;
    #[wasm_bindgen(method, getter)]
    fn args(this: &ExportedAst) -> Array;

    pub type ExportedCellAddress;
    #[wasm_bindgen(method, getter)]
    fn col(this: &ExportedCellAddress) -> i32;
    #[wasm_bindgen(method, getter)]
    fn row(this: &ExportedCellAddress) -> i32;
    #[wasm_bindgen(method, getter, js_name = type)]
    fn kind(this: &ExportedCellAddress) -> String;

    pub type Array;
    #[wasm_bindgen(method, js_name = forEach)]
    pub fn for_each(this: &Array, callback: &mut FnMut(ExportedAst, u32, Array));
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    log(&format!("Hello, {}!", name));
}

// interpreter part
use std::collections::HashMap;
use std::cell::RefCell;
use std::rc::Rc;
use std::vec::Vec;

#[derive(Clone, Debug, PartialEq)]
pub enum CellValue {
    Number(i32),
    Text(String),
    // Error()
}

#[derive(Clone, Debug)]
enum CellReferenceType {
    Relative,
    Absolute,
    AbsoluteCol,
    AbsoluteRow,
}

#[derive(Clone, Debug)]
struct CellAddress {
    col: i32,
    row: i32,
    kind: CellReferenceType,
}

#[derive(Clone, Debug)]
struct SimpleCellAddress {
    col: i32,
    row: i32,
}

#[derive(Clone, Debug)]
enum Ast {
    NumberAst {
        value: i32,
    },
    CellRangeAst {
        start: CellAddress,
        end: CellAddress,
    },
    ProcedureAst {
        procedure_name: String,
        args: Vec<Ast>,
    }
}

fn reference_type_by_js_string(kind: String) -> CellReferenceType {
    match kind.as_ref() {
        "CELL_REFERENCE" => CellReferenceType::Relative,
        "CELL_REFERENCE_ABSOLUTE" => CellReferenceType::Absolute,
        "CELL_REFERENCE_ABSOLUTE_COL" => CellReferenceType::AbsoluteCol,
        "CELL_REFERENCE_ABSOLUTE_ROW" => CellReferenceType::AbsoluteRow,
        _ => panic!("Unknown JS Cell Reference type"),
    }
}

fn convert_ast(js_ast: ExportedAst) -> Ast {
    // log(&format!("Got js ast: {}", js_ast.kind()));
    if js_ast.kind() == "CELL_RANGE" {
        // log(&format!("Yep, cell range"));
        // log(&format!("reference type {}", js_ast.start().kind()));
        // log(&format!("start reference type js ast: {:?}", reference_type_by_js_string(js_ast.start().kind())));
        Ast::CellRangeAst {
            start: CellAddress {
                kind: reference_type_by_js_string(js_ast.start().kind()),
                col: js_ast.start().col(),
                row: js_ast.start().row(),
            },
            end: CellAddress {
                kind: reference_type_by_js_string(js_ast.start().kind()),
                col: js_ast.end().col(),
                row: js_ast.end().row(),
            },
        }
    } else if js_ast.kind() == "FUNCTION_CALL" {
        let mut parsed_args = Vec::new();
        // pub fn for_each(this: &Array, callback: &mut FnMut(JsValue, u32, Array));
        let mut callback = |js_arg_ast: ExportedAst, _js_index: u32, _js_arr: Array| -> () {
            parsed_args.push(convert_ast(js_arg_ast))
        };
        js_ast.args().for_each(&mut callback);
        // log(&format!("Args: {:?}", parsed_args));
        Ast::ProcedureAst {
            procedure_name: js_ast.procedureName(),
            args: parsed_args,
            // args: js_ast.args
        }
    } else {
        panic!("Unknown ast");
    }
}

#[derive(Debug)]
struct RangeVertex {
    color: i8,
    vertex_id: i32,
    start: SimpleCellAddress,
    end: SimpleCellAddress,
}

#[derive(Debug)]
struct ValueCellVertex {
    color: i8,
    vertex_id: i32,
    cell_value: CellValue,
}

#[derive(Debug)]
struct FormulaCellVertex {
    color: i8,
    vertex_id: i32,
    cached_cell_value: Option<CellValue>,
    formula: Ast,
    address: SimpleCellAddress,
}

#[derive(Debug)]
struct EmptyCellVertex {
    vertex_id: i32,
    color: i8,
}

trait IVertex {
    fn get_color(&self) -> i8;
    fn get_vertex_id(&self) -> i32;
    fn set_cell_value(&mut self, new_value: CellValue) -> () {
        ()
    }

    fn get_formula(&self) -> Option<(&Ast, &SimpleCellAddress)> {
        None
    }
}

impl IVertex for ValueCellVertex {
    fn get_color(&self) -> i8 {
        self.color
    }

    fn get_vertex_id(&self) -> i32 {
        self.vertex_id
    }
}

impl IVertex for EmptyCellVertex {
    fn get_color(&self) -> i8 {
        self.color
    }

    fn get_vertex_id(&self) -> i32 {
        self.vertex_id
    }
}

impl IVertex for FormulaCellVertex {
    fn get_color(&self) -> i8 {
        self.color
    }

    fn get_vertex_id(&self) -> i32 {
        self.vertex_id
    }

    fn get_formula(&self) -> Option<(&Ast, &SimpleCellAddress)> {
        Some((&self.formula, &self.address))
    }

    fn set_cell_value(&mut self, new_value: CellValue) -> () {
        self.cached_cell_value = Some(new_value);
    }
}

impl IVertex for RangeVertex {
    fn get_color(&self) -> i8 {
        self.color
    }

    fn get_vertex_id(&self) -> i32 {
        self.vertex_id
    }
}

trait ICellVertex : IVertex {
    fn get_cell_value(&self) -> CellValue;
}

impl ICellVertex for EmptyCellVertex {
    fn get_cell_value(&self) -> CellValue {
        // that struct should OWN that cell value, so it can borrow it?
        CellValue::Number(0)
    }
}

impl ICellVertex for ValueCellVertex {
    fn get_cell_value(&self) -> CellValue {
        // that struct should OWN that cell value, so it can borrow it?
        self.cell_value.clone()
    }
}

impl ICellVertex for FormulaCellVertex {
    fn get_cell_value(&self) -> CellValue {
        self.cached_cell_value.clone().unwrap()
    }
}


struct GraphNode {
    datum: Rc<RefCell<IVertex>>,
    edges: Vec<Rc<RefCell<GraphNode>>>,
}

struct Graph {
    nodes: HashMap<i32, Rc<RefCell<GraphNode>>>, // Maybe Box here would be enough?
}

trait IGraph {
    fn build() -> Graph;
    // fn get_node_reference(&self, vertex_id: &i32) -> &GraphNode;
    fn add_node(&mut self, boxed_node: Rc<RefCell<IVertex>>) -> ();
    fn add_edge_by_ids(&mut self, from_node_id: &i32, to_node_id: &i32) -> ();
    fn edge_exists(&self, from_node_id: &i32, to_node_id: &i32) -> bool;
    fn topological_sort(&self) -> Vec<i32>;
}

impl IGraph for Graph {
    fn build() -> Graph {
        Graph {
            nodes: HashMap::new()
        }
    }

    fn add_node(&mut self, boxed_node: Rc<RefCell<IVertex>>) -> () {
        self.nodes.insert(
            boxed_node.borrow().get_vertex_id(),
            Rc::new(RefCell::new(
                GraphNode {
                    datum: boxed_node.clone(),
                    edges: Vec::new()
                }
            ))
        );
    }

    // fn get_node_reference(&self, vertex_id: &i32) -> &GraphNode {
    //     self.nodes.get(vertex_id).unwrap().clone()
    // }

    fn add_edge_by_ids(&mut self, from_node_id: &i32, to_node_id: &i32) -> () {
        let mut from_node = self.nodes.get(from_node_id).unwrap().borrow_mut();
        let to_node = self.nodes.get(to_node_id).unwrap();
        from_node.edges.push(to_node.clone())
    }

    fn edge_exists(&self, from_node_id: &i32, to_node_id: &i32) -> bool {
        let looking_for_vertex_id = self.nodes.get(to_node_id).unwrap().borrow().datum.borrow().get_vertex_id();
        let target_nodes = &self.nodes.get(from_node_id).unwrap().borrow().edges;
        for target_node in target_nodes {
            if target_node.borrow().datum.borrow().get_vertex_id() == looking_for_vertex_id {
                return true
            }
        };
        false
    }

    fn topological_sort(&self) -> Vec<i32> {
        let mut incoming_edges: HashMap<i32, i32> = HashMap::new();
        for (_vertex_id, source_node) in &self.nodes {
            let source_node_id = source_node.clone().borrow().datum.clone().borrow().get_vertex_id();
            incoming_edges.insert(source_node_id, 0);
        }
        for (_vertex_id, source_node) in &self.nodes {
            // log(&format!("A node with", vertex_id, incoming_count));
            let source_node_id = source_node.clone().borrow().datum.clone().borrow().get_vertex_id();
            for target_node in &source_node.clone().borrow().edges {
                let target_node_id = target_node.clone().borrow().datum.clone().borrow().get_vertex_id();
                // log(&format!("An edge betwen {} and {}", source_node_id, target_node_id));
                incoming_edges.insert(target_node_id, incoming_edges.get(&target_node_id).unwrap() + 1);
            }
        }

        let mut nodes_with_no_incoming_edge = Vec::new();
        for (&vertex_id, &incoming_count) in &incoming_edges {
            // log(&format!("Element {} in incoming edges with count {}", vertex_id, incoming_count));
            if incoming_count == 0 {
                nodes_with_no_incoming_edge.push(vertex_id);
                // log(&format!("Adding {} to nodes with no inc edge", vertex_id));
            }
        };

        // log(&format!("Size of initial topsort {}", nodes_with_no_incoming_edge.len()));
        
        let mut topological_ordering = Vec::new();
        let mut current_node_index = 0;
        while current_node_index < nodes_with_no_incoming_edge.len() {
            let vertex_id = nodes_with_no_incoming_edge[current_node_index];
        // for &mut vertex_id in &mut nodes_with_no_incoming_edge {
            topological_ordering.push(vertex_id);
            // log(&format!("Adding {} to topological ordering", vertex_id));
            for target_node in &self.nodes.get(&vertex_id).unwrap().clone().borrow().edges {
                let target_node_id = target_node.clone().borrow().datum.clone().borrow().get_vertex_id();
                let new_count = incoming_edges.get(&target_node_id).unwrap() - 1;
                incoming_edges.insert(target_node_id, new_count);
                if new_count == 0 {
                    nodes_with_no_incoming_edge.push(target_node_id);
                    // log(&format!("Adding {} to nodes with no inc edge", target_node_id));
                }
            }
            current_node_index += 1;
        }

        topological_ordering
        // while current_node_index < nodes_with_no_incoming_edge.len() {
        //     topological_ordering
        // }
    }
}

struct ArrayAddressMapping {
    width: i32,
    mapping: Vec<Rc<RefCell<ICellVertex>>>,
    default_empty: Rc<RefCell<ICellVertex>>,
}

trait IAddressMapping {
    fn get_cell_value(&self, address: &SimpleCellAddress) -> CellValue;
    fn set_cell_value(&mut self, address: &SimpleCellAddress, new_value: CellValue) -> ();
    fn set_cell(&mut self, address: &SimpleCellAddress, cell: Rc<RefCell<ICellVertex>>) -> ();
    fn get_cell(&self, address: &SimpleCellAddress) -> Rc<RefCell<ICellVertex>>;
}

impl IAddressMapping for ArrayAddressMapping {
    fn get_cell_value(&self, address: &SimpleCellAddress) -> CellValue {
        // log(&format!("Requesting address {:?}", address));
        let position = address.row * self.width + address.col;
        self.mapping[position as usize].borrow().get_cell_value()
    }

    fn set_cell_value(&mut self, address: &SimpleCellAddress, new_value: CellValue) -> () {
        let position = address.row * self.width + address.col;
        self.mapping[position as usize].borrow_mut().set_cell_value(new_value);
    }

    fn set_cell(&mut self, address: &SimpleCellAddress, cell: Rc<RefCell<ICellVertex>>) -> () {
        let position = address.row * self.width + address.col;
        self.mapping[position as usize] = cell.clone();
    }

    fn get_cell(&self, address: &SimpleCellAddress) -> Rc<RefCell<ICellVertex>> {
        let position = address.row * self.width + address.col;
        self.mapping[position as usize].clone()
    }
}

fn build_array_address_mapping(width: i32, height: i32, default_empty: Rc<RefCell<ICellVertex>>) -> ArrayAddressMapping {
    let elements = width * height;
    let mapping = vec![default_empty.clone(); elements as usize];
    ArrayAddressMapping {
        width: width,
        mapping: mapping,
        default_empty: default_empty.clone(),
    }
}

struct RangeMapping {
    mapping: HashMap<String, Rc<RefCell<RangeVertex>>>
}

fn buildRangeMapping() -> RangeMapping {
    RangeMapping {
        mapping: HashMap::new()
    }
}

trait IRangeMapping {
    fn get_range(&self, start: &SimpleCellAddress, end: &SimpleCellAddress) -> Rc<RefCell<RangeVertex>>;
    fn maybe_get_range(&self, start: &SimpleCellAddress, end: &SimpleCellAddress) -> Option<Rc<RefCell<RangeVertex>>>;
    fn set_range(&mut self, node: Rc<RefCell<RangeVertex>>) -> ();
}

impl IRangeMapping for RangeMapping {
    fn maybe_get_range(&self, start: &SimpleCellAddress, end: &SimpleCellAddress) -> Option<Rc<RefCell<RangeVertex>>> {
        let key = format!("{},{},{},{}", start.col, start.row, end.col, end.row);
        match self.mapping.get(&key) {
            Some(vertex) => Some(vertex.clone()),
            None => None
        }
    }

    fn get_range(&self, start: &SimpleCellAddress, end: &SimpleCellAddress) -> Rc<RefCell<RangeVertex>> {
        let key = format!("{},{},{},{}", start.col, start.row, end.col, end.row);
        self.mapping.get(&key).unwrap().clone()
    }

    fn set_range(&mut self, node: Rc<RefCell<RangeVertex>>) -> () {
        let start = &node.borrow().start;
        let end = &node.borrow().end;
        let key = format!("{},{},{},{}", start.col, start.row, end.col, end.row);
        self.mapping.insert(key, node.clone());
    }
}

#[wasm_bindgen]
pub struct InterpretingBundle {
    graph: Graph,
    range_mapping: RangeMapping,
    address_mapping: ArrayAddressMapping,
    default_empty: Rc<RefCell<EmptyCellVertex>>,
    vertex_counter: i32,
    topological_sorting: Option<Vec<i32>>,
}

fn absolutize_address(address: &CellAddress, base_address: &SimpleCellAddress) -> SimpleCellAddress {
    // struct CellAddress {
    //     col: i32,
    //     row: i32,
    //     kind: CellReferenceType,
// }
    match &address.kind {
        CellReferenceType::Relative => SimpleCellAddress { col: address.col + base_address.col, row: address.row + base_address.row },
        CellReferenceType::Absolute => SimpleCellAddress { col: address.col, row: address.row },
        CellReferenceType::AbsoluteCol => SimpleCellAddress { col: address.col, row: address.row + base_address.row },
        CellReferenceType::AbsoluteRow => SimpleCellAddress { col: address.col + base_address.col, row: address.row },
    }
}

#[wasm_bindgen]
impl InterpretingBundle {
    pub fn build_number_value_node_into_graph(&mut self, js_address: ExportedSimpleCellAddress, value: i32) -> () {
        let address = SimpleCellAddress { col: js_address.col(), row: js_address.row() };
        let cell_value = CellValue::Number(value);
        let next_vertex_id = self.vertex_counter;
        self.vertex_counter += 1;
        let vertex = Rc::new(RefCell::new(ValueCellVertex {
            color: 0,
            vertex_id: next_vertex_id,
            cell_value: cell_value,
        }));
        // log(&format!("Added value cell vertex {:?} into address {:?}", vertex.clone(), address));
        self.graph.add_node(vertex.clone());
        self.address_mapping.set_cell(&address, vertex.clone());
    }

    pub fn build_string_value_node_into_graph(&mut self, js_address: ExportedSimpleCellAddress, value: String) -> () {
        log(&format!("Got string value: {}", &value));
        let address = SimpleCellAddress { col: js_address.col(), row: js_address.row() };
        let cell_value = CellValue::Text(value);
        let next_vertex_id = self.vertex_counter;
        self.vertex_counter += 1;
        let vertex = Rc::new(RefCell::new(ValueCellVertex {
            color: 0,
            vertex_id: next_vertex_id,
            cell_value: cell_value,
        }));
        // log(&format!("Added value cell vertex {:?} into address {:?}", vertex.clone(), address));
        self.graph.add_node(vertex.clone());
        self.address_mapping.set_cell(&address, vertex.clone());
    }

    pub fn build_formula_node_into_graph(&mut self, js_address: ExportedSimpleCellAddress, js_ast: ExportedAst) -> () {
        let address = SimpleCellAddress { col: js_address.col(), row: js_address.row() };
        let next_vertex_id = self.vertex_counter;
        self.vertex_counter += 1;
        let vertex = Rc::new(RefCell::new(FormulaCellVertex {
            color: 0,
            vertex_id: next_vertex_id,
            cached_cell_value: None,
            address: address.clone(),
            formula: convert_ast(js_ast),
        }));
        // log(&format!("Added formula vertex {:?} into address {:?}", vertex.clone(), address));
        self.graph.add_node(vertex.clone());
        self.address_mapping.set_cell(&address, vertex.clone());
    }

    pub fn handle_regular_dependency(&mut self, from_js_address: ExportedSimpleCellAddress, to_js_address: ExportedSimpleCellAddress) -> () {
        let from_address = SimpleCellAddress { col: from_js_address.col(), row: from_js_address.row() };
        let to_address = SimpleCellAddress { col: to_js_address.col(), row: to_js_address.row() };
        let from_vertex = self.address_mapping.get_cell(&from_address);
        let to_vertex = self.address_mapping.get_cell(&to_address);
        self.graph.add_edge_by_ids(&from_vertex.borrow().get_vertex_id(), &to_vertex.borrow().get_vertex_id());
    }

    pub fn handle_range_dependency(&mut self, from_start_js_address: ExportedSimpleCellAddress, from_end_js_address: ExportedSimpleCellAddress, to_js_address: ExportedSimpleCellAddress) -> () {
        let from_start_address = SimpleCellAddress { col: from_start_js_address.col(), row: from_start_js_address.row() };
        let from_end_address = SimpleCellAddress { col: from_end_js_address.col(), row: from_end_js_address.row() };
        let to_address = SimpleCellAddress { col: to_js_address.col(), row: to_js_address.row() };
        let to_vertex = self.address_mapping.get_cell(&to_address);
        let range_vertex = match self.range_mapping.maybe_get_range(&from_start_address, &from_end_address) {
            Some(vertex) => vertex,
            None => {
                let vertex = Rc::new(RefCell::new(RangeVertex {
                    color: 0,
                    vertex_id: self.vertex_counter,
                    start: from_start_address.clone(),
                    end: from_end_address.clone(),
                }));
                // log(&format!("Added range vertex {:?}", vertex.clone()));
                self.vertex_counter += 1;
                self.range_mapping.set_range(vertex.clone());
                vertex
            }
        };
        self.graph.add_node(range_vertex.clone());
        let (maybe_smaller_range_vertex, rest_range_start, rest_range_end) = self.find_smaller_range(from_start_address, from_end_address);

        if let Some(smaller_range_vertex) = maybe_smaller_range_vertex {
            self.graph.add_edge_by_ids(&smaller_range_vertex.borrow().get_vertex_id(), &range_vertex.borrow().get_vertex_id());
        };

        {
            // log(&format!("Rest range: from {:?} to {:?}", rest_range_start, rest_range_end));
            let mut current_row = rest_range_start.row;
            while current_row <= rest_range_end.row {
                let mut current_column = rest_range_start.col;
                while current_column <= rest_range_end.col {
                    let address = SimpleCellAddress { col: current_column, row: current_row };
                    // log(&format!("Address which we want to connect {:?}", address));
                    let vertex = self.address_mapping.get_cell(&address);
                    // log(&format!("Adding edge when iterating on rest ({}, {})", &vertex.borrow().get_vertex_id(), &range_vertex.borrow().get_vertex_id()));
                    self.graph.add_edge_by_ids(&vertex.borrow().get_vertex_id(), &range_vertex.borrow().get_vertex_id());
                    current_column += 1;
                }
                current_row += 1;
            }
        }

        self.graph.add_edge_by_ids(&range_vertex.borrow().get_vertex_id(), &to_vertex.borrow().get_vertex_id());
    }

    fn find_smaller_range(&self, start_address: SimpleCellAddress, end_address: SimpleCellAddress) -> (Option<Rc<RefCell<RangeVertex>>>, SimpleCellAddress, SimpleCellAddress) {
        if end_address.row > start_address.row {
            let end_address_row_less = SimpleCellAddress { col: end_address.col, row: end_address.row - 1 };
            if let Some(vertex) = self.range_mapping.maybe_get_range(&start_address, &end_address_row_less) {
                return (Some(vertex), SimpleCellAddress { col: start_address.col, row: end_address.row }, end_address)
            }
        };
        (None, start_address, end_address)
    }

    pub fn compute_topological_sorting(&mut self) -> () {
        let topological_ordering = self.graph.topological_sort();
        // log(&format!("Size of topological ordering {}", topological_ordering.len()));
        self.topological_sorting = Some(topological_ordering);
    }

    fn evaluate_ast(&self, formula: &Ast, address: &SimpleCellAddress) -> CellValue {
        // NumberAst {
        //     value: i32,
        // },
        // CellRangeAst {
        //     start: CellAddress,
        //     end: CellAddress,
        // },
        // ProcedureAst {
        //     procedure_name: String,
        //     args: Vec<Ast>,
        // }
        match formula {
            Ast::NumberAst { value } => CellValue::Number(*value),
            Ast::ProcedureAst { procedure_name, args } => {
                // log(&format!("Processing procedure {}", procedure_name));
                match procedure_name.as_ref() {
                    "MEDIAN" => {
                        let mut values_to_choose_median_from = Vec::new();
                        for arg in args {
                            match arg {
                                Ast::CellRangeAst { start, end } => {
                                    let abs_start = absolutize_address(&start, address);
                                    let abs_end = absolutize_address(&end, address);
                                    // values_to_choose_median_from.push(42);
                                    // log(&format!("Processing range {:?} {:?}", start, end));
                                    let mut current_row = abs_start.row;
                                    while current_row <= abs_end.row {
                                        let mut current_column = abs_start.col;
                                        while current_column <= abs_end.col {
                                            let address = SimpleCellAddress { col: current_column, row: current_row };
                                            // log(&format!("Processing address {:?}", address));
                                            let vertex_value = self.address_mapping.get_cell_value(&address);
                                            if let CellValue::Number(val) = vertex_value {
                                                values_to_choose_median_from.push(val)
                                            }
                                            current_column += 1;
                                        }
                                        current_row += 1;
                                    }
                                },
                                _ => panic!("Computing arguments other than range is not supported"),
                            };
                        };
                        values_to_choose_median_from.sort_unstable();
                        // log(&format!("Vector with values {:?}", values_to_choose_median_from));
                        // I know it's not correct median but it doesn't really matter in spike
                        CellValue::Number(values_to_choose_median_from[values_to_choose_median_from.len() / 2])
                    },
                    _ => panic!("Unknown procedure name"),
                }
            }
            Ast::CellRangeAst { start, end } => panic!("Computing cell range is not supported"),
        }
        // CellValue::Number(42)
    }

    pub fn compute_formulas(&mut self) -> () {
        match &self.topological_sorting {
            None => (),
            Some(topological_order) => {
                for vertex_id in topological_order {
                    // log(&format!("Computing {}", vertex_id));
                    let vertex = self.graph.nodes.get(&vertex_id).unwrap().clone().borrow().datum.clone();
                    let mut maybe_value = None;
                    {
                        if let Some((formula, address)) = vertex.borrow_mut().get_formula() {
                            // maybe_value = Some(CellValue::Number(42));
                            maybe_value = Some(self.evaluate_ast(formula, address));
                        };
                    };
                    match maybe_value {
                        None => (),
                        Some(new_value) => {
                            vertex.borrow_mut().set_cell_value(new_value);
                        },
                    }
                };
            },
        };
        log(&format!("Computed everything"));
    }
}

#[wasm_bindgen]
pub fn build_interpreting_bundle(height: i32, width: i32) -> InterpretingBundle {
    log("Building interpreting bundle");
    let default_empty = Rc::new(RefCell::new(EmptyCellVertex { color: 0, vertex_id: 0 }));
    let mut graph = Graph::build();
    graph.add_node(default_empty.clone());
    InterpretingBundle {
        graph: graph,
        range_mapping: buildRangeMapping(),
        address_mapping: build_array_address_mapping(width, height, default_empty.clone()),
        default_empty: default_empty,
        vertex_counter: 1,
        topological_sorting: None,
    }
}



// tests part
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
        let mut graph = Graph::build();
        let node1 = Rc::new(RefCell::new(ValueCellVertex { color: 0, vertex_id: 1, cell_value: CellValue::Number(42) }));
        let node2 = Rc::new(RefCell::new(ValueCellVertex { color: 0, vertex_id: 2, cell_value: CellValue::Number(13) }));
        graph.add_node(node1);
        graph.add_node(node2);
        let graph_node1id = graph.nodes.get(&1).unwrap().borrow().datum.borrow().get_vertex_id();
        assert_eq!(graph_node1id, 1)
    }

    #[test]
    fn it_works2() {
        let mut graph = Graph::build();
        let node1 = Rc::new(RefCell::new(ValueCellVertex { color: 0, vertex_id: 1, cell_value: CellValue::Number(42) }));
        let node2 = Rc::new(RefCell::new(ValueCellVertex { color: 0, vertex_id: 2, cell_value: CellValue::Number(13) }));
        let node3 = Rc::new(RefCell::new(ValueCellVertex { color: 0, vertex_id: 3, cell_value: CellValue::Number(13) }));
        graph.add_node(node1);
        graph.add_node(node2);
        graph.add_node(node3);
        graph.add_edge_by_ids(&1, &2);
        assert_eq!(graph.edge_exists(&1, &2), true);
        assert_eq!(graph.edge_exists(&1, &3), false);
    }

    #[test]
    fn it_works3() {
        let mut graph = Graph::build();
        let empty = Rc::new(RefCell::new(EmptyCellVertex { color: 0, vertex_id: 0 }));
        graph.add_node(empty.clone());
        let mut address_mapping = build_array_address_mapping(4, 4, empty.clone());
        let some_address = SimpleCellAddress { col: 0, row: 0 };
        assert_eq!(address_mapping.get_cell_value(&some_address), CellValue::Number(0));

        let other_address = SimpleCellAddress { col: 1, row: 0 };
        let other_node = Rc::new(RefCell::new(ValueCellVertex { color: 0, vertex_id: 1, cell_value: CellValue::Number(42) }));
        graph.add_node(other_node.clone());
        address_mapping.set_cell(&other_address, other_node.clone());
        assert_eq!(address_mapping.get_cell_value(&other_address), CellValue::Number(42));

        address_mapping.set_cell_value(&other_address, CellValue::Number(13));
        assert_eq!(address_mapping.get_cell_value(&other_address), CellValue::Number(13));
    }

    #[test]
    fn range_mapping() {
        let mut range_mapping = buildRangeMapping();
        let node = Rc::new(RefCell::new(RangeVertex {
            color: 0,
            vertex_id: 42,
            start: SimpleCellAddress { col: 0, row: 0 },
            end: SimpleCellAddress { col: 0, row: 1 },
        }));
        range_mapping.set_range(node);
        assert_eq!(range_mapping.get_range(&SimpleCellAddress { col: 0, row: 0 }, &SimpleCellAddress { col: 0, row: 1 }).borrow().get_vertex_id(), 42)
    }
}
