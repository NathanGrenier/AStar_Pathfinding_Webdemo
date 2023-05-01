use std::{
    cell::{Cell, RefCell},
    rc::Rc,
};

use crate::node::{BaseNode, Node};
use serde::{Deserialize, Serialize};
use wasm_bindgen_test::console_log;

#[derive(Serialize, Deserialize, Debug)]
pub struct BaseGrid {
    pub nodes: Vec<Vec<BaseNode>>,
    pub length: u32,
    pub start: Option<BaseNode>,
    pub end: Option<BaseNode>,
}

// type InnerNodeRef<'a> = &'a mut Node<'a>;
type InnerNodePtr<'a> = *mut Node<'a>;
type NodeRef<'a> = Rc<RefCell<InnerNodePtr<'a>>>;

#[derive(Debug)]
pub struct Grid<'a> {
    pub nodes: Vec<Vec<NodeRef<'a>>>,
    pub length: u32,
    start: Option<NodeRef<'a>>,
    end: Option<NodeRef<'a>>,
    // pub start: Option<&'a mut Node>,
    // pub end: Option<&'a mut Node>,
}

// impl<'a> From<BaseGrid> for Grid<'a> {
impl<'a> Grid<'a> {
    pub fn from_base<'b>(base_grid: BaseGrid) -> Grid<'b>
    where
        'a: 'b,
        'b: 'a,
    {
        let mut nodes: Vec<Vec<NodeRef<'a>>> = Vec::with_capacity(base_grid.nodes.len());
        for row in base_grid.nodes {
            let mut new_row: Vec<NodeRef<'a>> = Vec::with_capacity(row.len());
            for node in row {
                // let new_node = &mut Node::from_base(node) as *mut Node<'b>;
                let new_node = Box::into_raw(Box::new(Node::from_base(node)));
                // ! I think new_node is dropped after every for loop iteration, making each element in the vec have the same pointer value
                new_row.push(Rc::new(RefCell::new(new_node)));
            }

            nodes.push(new_row);
        }

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
}

impl<'a> Grid<'a> {
    pub fn new(nodes: Vec<Vec<NodeRef<'a>>>) -> Self {
        let length = (nodes.len() * nodes[0].len()) as u32;
        Self {
            nodes,
            length,
            start: None,
            end: None,
        }
    }

    pub fn to_base(&self) -> BaseGrid {
        let base_nodes = self
            .nodes
            .iter()
            .map(|row| {
                row.iter()
                    .map(|node| unsafe { node.borrow().as_ref() }.unwrap().to_base())
                    .collect::<Vec<BaseNode>>()
            })
            .collect::<Vec<Vec<BaseNode>>>();

        let mut start = None;

        if let Some(ref start_node) = self.start {
            start = Some(unsafe { start_node.borrow().as_ref() }.unwrap().to_base());
        }

        BaseGrid {
            nodes: base_nodes,
            length: self.length,
            start,
            end: self
                .end
                .as_ref()
                .map(|node| unsafe { node.borrow().as_ref() }.unwrap().to_base()),
        }
    }

    pub fn get_start(&self) -> &Option<NodeRef<'a>> {
        &self.start
    }

    // pub fn get_start_mut(&mut self) -> Option<&mut Node> {
    //     self.start.as_mut()
    // }

    pub fn set_start_node(&mut self, node: NodeRef<'a>) {
        unsafe { node.borrow_mut().as_mut() }.unwrap().start = true;
        if let Some(ref start) = self.start {
            let start_mut = unsafe { start.borrow_mut().as_mut() }.unwrap();
            start_mut.start = false;
        }
        self.start = Some(node.clone());
    }

    // pub fn set_start(&'a mut self, row: usize, col: usize) {
    //     let node = self.nodes[row][col].get_mut();
    //     node.start = true;
    //     if let Some(ref mut start) = self.start {
    //         start.get_mut().start = false;
    //     }
    //     self.start = Some(Rc::new(RefCell::new(node)));
    // }

    pub fn get_end(&self) -> &Option<NodeRef<'a>> {
        &self.end
    }

    // pub fn get_end_mut(&mut self) -> Option<&mut Node> {
    //     self.end.as_mut()
    // }

    pub fn set_end_node(&mut self, node: NodeRef<'a>) {
        unsafe { node.borrow_mut().as_mut() }.unwrap().end = true;
        if let Some(ref end) = self.end {
            let end_mut = unsafe { end.borrow_mut().as_mut() }.unwrap();
            end_mut.end = false;
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
