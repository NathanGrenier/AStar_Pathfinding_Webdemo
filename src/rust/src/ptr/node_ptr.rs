use serde::{Deserialize, Serialize};

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
pub struct Node<'a> {
    pub walkable: bool,
    pub start: bool,
    pub end: bool,
    // pub parent: Option<Box<Node>>, // this doesn't need to be sent to JS, so it should be taken out of the struct since it can't be used with wasm_bindgen
    // pub parent: Option<&'a Node<'a>>, // this doesn't need to be sent to JS, so it should be taken out of the struct since it can't be used with wasm_bindgen
    pub parent: Option<*mut Node<'a>>, // this doesn't need to be sent to JS, so it should be taken out of the struct since it can't be used with wasm_bindgen
    pub length: u32,
    pub diagonal: f32,
    // Used for aStar
    pub gCost: f32,
    pub hCost: f32,
    // coords
    pub row: u32,
    pub col: u32,
    pub visited: bool, // part of the final path
}

use std::hash::{Hash, Hasher};

impl Hash for Node<'_> {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.row.hash(state);
        self.col.hash(state);
    }
}

impl PartialEq for Node<'_> {
    fn eq(&self, other: &Self) -> bool {
        return self.row == other.row && self.col == other.col;
        // std::ptr::eq(self, other)
    }

    fn ne(&self, other: &Self) -> bool {
        return self.row != other.row || self.col != other.col;
        // !std::ptr::eq(self, other)
    }
}

impl Eq for Node<'_> {}

impl Clone for Node<'_> {
    fn clone(&self) -> Self {
        Self {
            walkable: self.walkable,
            start: self.start,
            end: self.end,
            parent: None,
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

impl Into<BaseNode> for Node<'_> {
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

// impl<'a> From<BaseNode> for Node<'a> {
//     fn from<'b>(base: BaseNode) -> Node<'b> {
//         let length = 10;
//         Self {
//             walkable: base.walkable,
//             start: base.start,
//             end: base.end,
//             parent: None,
//             length,
//             diagonal: ((length.pow(2) * 2) as f32).sqrt(),
//             gCost: 0,
//             hCost: 0,
//             row: base.row,
//             col: base.col,
//             visited: false,
//         }
//     }
// }

impl<'a> Node<'a> {
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

    pub fn from_base<'b>(base: BaseNode) -> Node<'b>
    where
        'a: 'b,
        'b: 'a,
    {
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
