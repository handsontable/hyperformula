
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

#[derive(Clone)]
enum CellReferenceType {
    Relative,
    Absolute,
    AbsoluteCol,
    AbsoluteRow,
}

#[derive(Clone)]
struct CellAddress {
    col: i32,
    row: i32,
    kind: CellReferenceType,
}

#[derive(Clone)]
struct SimpleCellAddress {
    col: i32,
    row: i32,
}

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
        args: Box<[Ast]>,
    }
}

struct RangeVertex {
    color: i8,
    vertex_id: i32,
    start: SimpleCellAddress,
    end: SimpleCellAddress,
}

struct ValueCellVertex {
    color: i8,
    vertex_id: i32,
    cell_value: CellValue,
}

struct FormulaCellVertex {
    color: i8,
    vertex_id: i32,
    cached_cell_value: Option<CellValue>,
    formula: Ast,
    address: SimpleCellAddress,
}

struct EmptyCellVertex {
    vertex_id: i32,
    color: i8,
}

trait IVertex {
    fn get_color(&self) -> i8;
    fn get_vertex_id(&self) -> i32;
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
    fn set_cell_value(&mut self, new_cell_value: CellValue) -> ();
}

impl ICellVertex for EmptyCellVertex {
    fn get_cell_value(&self) -> CellValue {
        // that struct should OWN that cell value, so it can borrow it?
        CellValue::Number(0)
    }

    // a cheat.
    fn set_cell_value(&mut self, _new_cell_value: CellValue) -> () {
        ()
    }
}

impl ICellVertex for ValueCellVertex {
    fn get_cell_value(&self) -> CellValue {
        // that struct should OWN that cell value, so it can borrow it?
        self.cell_value.clone()
    }

    fn set_cell_value(&mut self, new_cell_value: CellValue) -> () {
        self.cell_value = new_cell_value
    }
}

impl ICellVertex for FormulaCellVertex {
    fn get_cell_value(&self) -> CellValue {
        self.cached_cell_value.clone().unwrap()
    }

    fn set_cell_value(&mut self, new_cell_value: CellValue) -> () {
        self.cached_cell_value = Some(new_cell_value)
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
}

struct ArrayAddressMapping {
    mapping: Vec<Rc<RefCell<ICellVertex>>>,
    default_empty: Rc<RefCell<ICellVertex>>,
}

trait IAddressMapping {
    fn get_cell_value(&self, address: &SimpleCellAddress) -> CellValue;
    fn set_cell_value(&mut self, address: &SimpleCellAddress, new_value: CellValue) -> ();
    fn set_cell(&mut self, address: &SimpleCellAddress, cell: Rc<RefCell<ICellVertex>>) -> ();
}

impl IAddressMapping for ArrayAddressMapping {
    fn get_cell_value(&self, address: &SimpleCellAddress) -> CellValue {
        let position = address.col * address.row;
        self.mapping[position as usize].borrow().get_cell_value()
    }

    fn set_cell_value(&mut self, address: &SimpleCellAddress, new_value: CellValue) -> () {
        let position = address.col * address.row;
        self.mapping[position as usize].borrow_mut().set_cell_value(new_value);
    }

    fn set_cell(&mut self, address: &SimpleCellAddress, cell: Rc<RefCell<ICellVertex>>) -> () {
        let position = address.col * address.row;
        self.mapping[position as usize] = cell.clone();
    }
}

fn build_array_address_mapping(width: i32, height: i32, default_empty: Rc<RefCell<ICellVertex>>) -> ArrayAddressMapping {
    let elements = width * height;
    let mapping = vec![default_empty.clone(); elements as usize];
    ArrayAddressMapping {
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
    fn set_range(&mut self, node: Rc<RefCell<RangeVertex>>) -> ();
}

impl IRangeMapping for RangeMapping {
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
        self.graph.add_node(vertex.clone());
        self.address_mapping.set_cell(&address, vertex.clone());
    }

    // pub fn build_formula_node_into_graph(&mut self, address: SimpleCellAddress, ast: JavascriptAst) {
    //     let next_vertex_id = self.vertex_counter++
    //     let vertex = Rc::new(RefCell::new(FormulaCellVertex {
    //         color: 0,
    //         vertex_id: next_vertex_id,
    //         cached_cell_value: None,
    //         formula: 
    //     }))

    //         color: i8,
    //         vertex_id: i32,
    //         cached_cell_value: CellValue,
    //         formula: Ast,
    //         address: SimpleCellAddress,
    //     // vertex = new FormulaCellVertex(parseResult.ast, cellAddress)
    //     //     dependencies.set(cellAddress, parseResult.dependencies)
    //     //     this.graph.addNode(vertex)
    //     //     this.addressMapping.setCell(cellAddress, vertex)
    // }
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
