use std::{cell::RefCell, rc::Rc};

use crate::node::{BaseNode, Node};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct BaseGrid {
    pub nodes: Vec<Vec<BaseNode>>,
    pub length: u32,
    pub start: Option<BaseNode>,
    pub end: Option<BaseNode>,
}

type NodeCell = Rc<RefCell<Node>>;

#[derive(Debug)]
pub struct Grid {
    pub nodes: Vec<Vec<NodeCell>>,
    pub length: u32,
    pub start: Option<NodeCell>,
    pub end: Option<NodeCell>,
    // pub start: Option<&'a mut Node>,
    // pub end: Option<&'a mut Node>,
}

impl From<serde_json::Value> for Grid {
    fn from(value: serde_json::Value) -> Self {
        let nodes = value["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .map(|row| {
                row.as_array()
                    .unwrap()
                    .iter()
                    .map(|node| Rc::new(RefCell::new(Node::from(node))))
                    .collect::<Vec<NodeCell>>()
            })
            .collect::<Vec<Vec<NodeCell>>>();

        let mut start = None;
        if let Some(start_node) = value.get("_start") {
            start = Some(Rc::new(RefCell::new(Node::from(start_node))));
        }

        let mut end = None;
        if let Some(end_node) = value.get("_end") {
            end = Some(Rc::new(RefCell::new(Node::from(end_node))));
        }

        Self {
            nodes,
            length: value["length"].as_u64().unwrap() as u32,
            start,
            end,
        }
    }
}

impl Grid {
    pub fn new(nodes: Vec<Vec<NodeCell>>) -> Self {
        let length = (nodes.len() * nodes[0].len()) as u32;
        Self {
            nodes,
            length,
            start: None,
            end: None,
        }
    }

    pub fn from_base(base_grid: BaseGrid) -> Grid {
        // let mut nodes: Vec<Vec<NodeCell>> = Vec::with_capacity(base_grid.nodes.len());
        // for row in base_grid.nodes {
        //     let mut new_row: Vec<NodeCell> = Vec::with_capacity(row.len());
        //     for node in row {
        //         let new_node = Node::from_base(node);
        //         new_row.push(Rc::new(RefCell::new(new_node)));
        //     }

        //     nodes.push(new_row);
        // }

        let nodes: Vec<Vec<NodeCell>> = base_grid
            .nodes
            .iter()
            .map(|row| {
                row.iter()
                    .map(|node| Rc::new(RefCell::new(Node::from(node))))
                    .collect::<Vec<NodeCell>>()
            })
            .collect();

        let mut grid = Grid::new(nodes);

        if let Some(base_start) = base_grid.start {
            // grid.set_start(base_start.row as usize, base_start.col as usize);
            grid.set_start_node(
                grid.nodes[base_start.row as usize][base_start.col as usize].clone(),
            );
        }

        if let Some(base_end) = base_grid.end {
            // grid.set_end(base_end.row as usize, base_end.col as usize);
            grid.set_end_node(grid.nodes[base_end.row as usize][base_end.col as usize].clone());
        }

        grid
    }

    pub fn to_base(&self) -> BaseGrid {
        let base_nodes = self
            .nodes
            .iter()
            .map(|row| {
                row.iter()
                    .map(|node| node.borrow().to_base())
                    .collect::<Vec<BaseNode>>()
            })
            .collect::<Vec<Vec<BaseNode>>>();

        let mut start = None;
        if let Some(ref start_node) = self.start {
            let start_node = start_node.borrow();
            start = Some(base_nodes[start_node.row as usize][start_node.col as usize]);
        }

        let mut end = None;
        if let Some(ref end_node) = self.end {
            let end_node = end_node.borrow();
            end = Some(base_nodes[end_node.row as usize][end_node.col as usize]);
        }

        BaseGrid {
            nodes: base_nodes,
            length: self.length,
            start,
            end,
        }
    }

    pub fn get_start(&self) -> Option<NodeCell> {
        self.start.clone()
    }

    // pub fn get_start_mut(&mut self) -> Option<&mut Node> {
    //     self.start.as_mut()
    // }

    pub fn set_start_node(&mut self, node: NodeCell) {
        node.borrow_mut().start = true;
        if let Some(start) = self.start.clone() {
            start.borrow_mut().start = false;
        }
        self.start = Some(node);
    }

    // pub fn set_start(&'a mut self, row: usize, col: usize) {
    //     let node = self.nodes[row][col].get_mut();
    //     node.start = true;
    //     if let Some(ref mut start) = self.start {
    //         start.get_mut().start = false;
    //     }
    //     self.start = Some(Rc::new(RefCell::new(node)));
    // }

    pub fn get_end(&self) -> Option<NodeCell> {
        self.end.clone()
    }

    // pub fn get_end_mut(&mut self) -> Option<&mut Node> {
    //     self.end.as_mut()
    // }

    pub fn set_end_node(&mut self, node: NodeCell) {
        node.borrow_mut().end = true;
        if let Some(end) = self.end.clone() {
            end.borrow_mut().end = false;
        }
        self.end = Some(node);
    }

    // pub fn set_end(&'a mut self, row: usize, col: usize) {
    //     let node = self.nodes[row][col].get_mut();
    //     node.end = true;
    //     if let Some(ref mut end) = self.end {
    //         end.get_mut().end = false;
    //     }
    //     self.end = Some(Rc::new(RefCell::new(node)));
    // }
}
