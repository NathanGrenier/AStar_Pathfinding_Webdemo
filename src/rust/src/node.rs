use serde::{Deserialize, Serialize};
use std::{
    cell::RefCell,
    hash::{Hash, Hasher},
    rc::Rc,
};

#[derive(Serialize, Deserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub struct BaseNode {
    pub walkable: bool,
    pub start: bool,
    pub end: bool,
    pub row: u32,
    pub col: u32,
}

impl Hash for BaseNode {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.row.hash(state);
        self.col.hash(state);
    }
}

impl BaseNode {
    pub fn new(row: u32, col: u32) -> Self {
        Self {
            walkable: true,
            start: false,
            end: false,
            row,
            col,
        }
    }
}

#[derive(Debug)]
#[allow(non_snake_case)]
pub struct Node {
    pub walkable: bool,
    pub start: bool,
    pub end: bool,
    pub parent: Option<Rc<RefCell<Node>>>,
    pub length: u32,
    pub diagonal: f32,
    // Used for aStar
    pub gCost: f32,
    pub hCost: f32,
    // coords
    pub row: u32,
    pub col: u32,
    pub visited: bool,
}

impl From<&serde_json::Value> for Node {
    fn from(value: &serde_json::Value) -> Self {
        let walkable = value["walkable"].as_bool().unwrap();
        let start = value["start"].as_bool().unwrap();
        let end = value["end"].as_bool().unwrap();
        let row = value["row"].as_u64().unwrap() as u32;
        let col = value["col"].as_u64().unwrap() as u32;
        let length = 10;
        let diagonal = (length as f32 * 2f32.sqrt()) as f32;
        Self {
            walkable,
            start,
            end,
            parent: None,
            length,
            diagonal,
            gCost: 0.0,
            hCost: 0.0,
            row,
            col,
            visited: false,
        }
    }
}

impl Hash for Node {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.row.hash(state);
        self.col.hash(state);
    }
}

impl PartialEq for Node {
    fn eq(&self, other: &Self) -> bool {
        return self.row == other.row && self.col == other.col;
        // std::ptr::eq(self, other)
    }

    fn ne(&self, other: &Self) -> bool {
        return self.row != other.row || self.col != other.col;
        // !std::ptr::eq(self, other)
    }
}

impl Eq for Node {}

impl Clone for Node {
    fn clone(&self) -> Self {
        Self {
            walkable: self.walkable,
            start: self.start,
            end: self.end,
            parent: self.parent.clone(),
            length: self.length,
            diagonal: self.diagonal,
            gCost: self.gCost,
            hCost: self.hCost,
            row: self.row,
            col: self.col,
            visited: self.visited,
        }
    }
}

impl Into<BaseNode> for Node {
    fn into(self) -> BaseNode {
        BaseNode {
            walkable: self.walkable,
            start: self.start,
            end: self.end,
            row: self.row,
            col: self.col,
        }
    }
}

impl From<&BaseNode> for Node {
    fn from(base: &BaseNode) -> Node {
        let length = 10;
        Self {
            walkable: base.walkable,
            start: base.start,
            end: base.end,
            parent: None,
            length,
            diagonal: ((length.pow(2) * 2) as f32).sqrt(),
            gCost: 0.,
            hCost: 0.,
            row: base.row,
            col: base.col,
            visited: false,
        }
    }
}

impl Node {
    pub fn new(row: u32, col: u32) -> Self {
        let length = 10;
        Self {
            walkable: true,
            start: false,
            end: false,
            parent: None,
            length,
            diagonal: ((length.pow(2) * 2) as f32).sqrt(),
            // For aStar
            gCost: 0.,
            hCost: 0.,
            // coords
            row,
            col,
            visited: false,
        }
    }

    pub fn f_cost(&self) -> f32 {
        self.gCost + self.hCost
    }

    pub fn to_base(&self) -> BaseNode {
        BaseNode {
            walkable: self.walkable,
            start: self.start,
            end: self.end,
            row: self.row,
            col: self.col,
        }
    }

    pub fn from_ref(base: &BaseNode) -> Self {
        let length = 10;
        Self {
            walkable: base.walkable,
            start: base.start,
            end: base.end,
            parent: None,
            length,
            diagonal: ((length.pow(2) * 2) as f32).sqrt(),
            gCost: 0.,
            hCost: 0.,
            row: base.row,
            col: base.col,
            visited: false,
        }
    }
}
