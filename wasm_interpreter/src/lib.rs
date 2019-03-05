
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
    cached_cell_value: CellValue,
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
    fn add_edge_by_ids(&mut self, from_node_id: &i32, to_node_id: &i32) -> ();
    fn edge_exists(&self, from_node_id: &i32, to_node_id: &i32) -> bool;
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

    fn add_edge_by_ids(&mut self, from_node_id: &i32, to_node_id: &i32) -> () {
        let mut from_node = self.nodes.get(from_node_id).unwrap().borrow_mut();
        let to_node = self.nodes.get(to_node_id).unwrap();
        from_node.edges.push(to_node.clone())
    }

    fn edge_exists(&self, from_node_id: &i32, to_node_id: &i32) -> bool {
        let looking_for_vertex_id = self.nodes.get(to_node_id).unwrap().borrow().datum.get_vertex_id();
        let target_nodes = &self.nodes.get(from_node_id).unwrap().borrow().edges;
        // return true
        for target_node in target_nodes {
            if target_node.borrow().datum.get_vertex_id() == looking_for_vertex_id {
                return true
            }
        };
        false
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

    #[test]
    fn it_works2() {
        let mut graph = Graph::build();
        let node1 = Box::new(ValueCellVertex { color: 0, vertex_id: 1, cell_value: CellValue::Number(42) });
        let node2 = Box::new(ValueCellVertex { color: 0, vertex_id: 2, cell_value: CellValue::Number(13) });
        let node3 = Box::new(ValueCellVertex { color: 0, vertex_id: 3, cell_value: CellValue::Number(13) });
        graph.add_node(node1);
        graph.add_node(node2);
        graph.add_node(node3);
        graph.add_edge_by_ids(&1, &2);
        assert_eq!(graph.edge_exists(&1, &2), true);
        assert_eq!(graph.edge_exists(&1, &3), false);
        // let graph_node1 = &graph.nodes.get(&1).unwrap().borrow();
        // assert_eq!(graph_node1.datum.get_vertex_id(), 1)
    }
}
