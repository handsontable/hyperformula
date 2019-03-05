
// WASM part
extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(&format!("Hello, {}!", name));
}


// interpreter part
use std::collections::HashMap;
use std::cell::RefCell;
use std::rc::Rc;
use std::vec::Vec;

#[derive(Clone)]
enum CellValue {
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
}

struct ValueCellVertex {
    color: i8,
    vertex_id: i32,
    cell_value: CellValue,
}

struct FormulaCellVertex {
    color: i8,
    vertex_id: i32,
    cached_cell_value: CellValue,
    formula: Ast,
    address: SimpleCellAddress,
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
        self.cached_cell_value.clone()
    }

    fn set_cell_value(&mut self, new_cell_value: CellValue) -> () {
        self.cached_cell_value = new_cell_value
    }
}


struct GraphNode {
    datum: Box<IVertex>,
    edges: Vec<Rc<RefCell<GraphNode>>>,
}

struct Graph {
    nodes: HashMap<i32, Rc<RefCell<GraphNode>>>,
}

trait IGraph {
    fn build() -> Graph;
    // fn get_node_reference(&self, vertex_id: &i32) -> &GraphNode;
    fn add_node(&mut self, boxed_node: Box<IVertex>) -> ();
    fn add_edge(&mut self, from_node: &mut GraphNode, to_node: Rc<RefCell<GraphNode>>) -> ();
}
impl IGraph for Graph {
    fn build() -> Graph {
        Graph {
            nodes: HashMap::new()
        }
    }

    fn add_node(&mut self, boxed_node: Box<IVertex>) -> () {
        self.nodes.insert(
            boxed_node.get_vertex_id(),
            Rc::new(RefCell::new(
                GraphNode {
                    datum: boxed_node,
                    edges: Vec::new()
                }
            ))
        );
    }

    // fn get_node_reference(&self, vertex_id: &i32) -> &GraphNode {
    //     self.nodes.get(vertex_id).unwrap().clone()
    // }

    fn add_edge(&mut self, from_node: &mut GraphNode, to_node: Rc<RefCell<GraphNode>>) -> () {
        from_node.edges.push(to_node.clone());
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
        let node1 = Box::new(ValueCellVertex { color: 0, vertex_id: 1, cell_value: CellValue::Number(42) });
        let node2 = Box::new(ValueCellVertex { color: 0, vertex_id: 2, cell_value: CellValue::Number(13) });
        graph.add_node(node1);
        graph.add_node(node2);
        let graph_node1 = &graph.nodes.get(&1).unwrap().borrow();
        assert_eq!(graph_node1.datum.get_vertex_id(), 1)
    }
}
