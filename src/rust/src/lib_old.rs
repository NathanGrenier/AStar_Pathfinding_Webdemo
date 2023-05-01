pub mod grid;
pub mod node;

use std::{
    borrow::Borrow,
    cell::{Cell, RefCell},
    collections::{HashMap, HashSet},
    rc::Rc,
};

use grid::{BaseGrid, Grid};
use node::{BaseNode, Node};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
pub struct a_star_result {
    path: Vec<BaseNode>,
    pub time_taken: f32,
    pub nodes_explored: u32,
    open_list: Vec<BaseNode>,
    closed_set: HashSet<BaseNode>,
}

#[wasm_bindgen]
pub fn a_star_wasm(grid_json: JsValue) -> Result<JsValue, JsValue> {
    let base_grid = serde_wasm_bindgen::from_value::<BaseGrid>(grid_json)?;

    let grid = Grid::from_base(base_grid);

    let mut start = grid.get_start().as_ref().unwrap().borrow().clone();
    // let open_list: Rc<RefCell<Vec<Rc<&mut Node>>>> =
    //     Rc::new(RefCell::new(vec![Rc::new(&mut start)]));
    let open_list: Rc<RefCell<Vec<Rc<RefCell<&mut Node>>>>> =
        Rc::new(RefCell::new(vec![Rc::new(RefCell::new(&mut start))]));
    // let mut open_list = Cell::new(vec![Rc::new(grid.get_start().unwrap().into_inner())]);
    let ol_clone = open_list.clone();
    let open_list_ref_cell = ol_clone.as_ref();
    // let mut open_list: Vec<Rc<Node>> = vec![Rc::new((*grid.get_start()).unwrap().clone())];
    // let mut closed_set: HashSet<Rc<&mut Node>> = HashSet::new();
    let mut closed_list: Vec<&Node> = vec![];
    let mut nodes_explored = 0;

    // start timer
    // let start = std::time::Instant::now();
    // let mut current_node = open_list_mut[0];

    let mut open_list_mut = open_list_ref_cell.borrow_mut();

    while open_list_mut.len() > 0 {
        let _current_node = open_list_mut[0].clone();
        let mut current_node = _current_node;
        let current_node_borrow = current_node.borrow_mut();

        for i in 1..open_list_mut.len() {
            let node = open_list_mut[i].clone();
            let node_borrow = node.as_ref().borrow();
            if node_borrow.f_cost() < current_node_borrow.f_cost()
                || (node_borrow.f_cost() == current_node_borrow.f_cost()
                    && node_borrow.hCost < current_node_borrow.hCost)
            {
                current_node = node;
            }
        }

        // open_list_mut.retain(|node| !node.eq(&current_node));
        // // closed_set.insert(current_node.clone());
        // closed_list.push(&current_node);

        // if current_node.end {
        //     let start = &grid.get_start().as_ref().unwrap().borrow().clone();
        //     let end = &grid.get_end().as_ref().unwrap().borrow().clone();

        //     let res = a_star_result {
        //         path: retrace_path(start, end),
        //         time_taken: 0.0,
        //         nodes_explored,
        //         open_list: open_list_mut.iter().map(|node| node.to_base()).collect(),
        //         closed_set: HashSet::new(),
        //     };

        //     return Ok(serde_wasm_bindgen::to_value(&res)?);
        // }

        // let neighbors = get_neighbors(&current_node, &grid);

        // for _neighbor in neighbors {
        //     let neighbor = &_neighbor.as_ref().borrow().clone();

        //     // if closed_set.contains(&Rc::new(neighbor)) {
        //     if closed_list.contains(&&neighbor) {
        //         continue;
        //     }

        //     let new_movement_cost_to_neighbor =
        //         current_node.gCost + get_distance(&current_node, &neighbor);
        // }
    }

    Ok(serde_wasm_bindgen::to_value(&())?)
}

fn get_distance(a: &Node, b: &Node) -> f32 {
    let dy = (a.row as f32 - b.row as f32).abs();
    let dx = (a.col as f32 - b.col as f32).abs();

    if dx > dy {
        a.diagonal * dy + a.length as f32 * (dx - dy)
    } else {
        a.diagonal * dx + a.length as f32 * (dy - dx)
    }
}

type Neighbors<'a> = Vec<Rc<RefCell<Node<'a>>>>;
fn get_neighbors<'a>(node: &'a Node<'a>, grid: &'a Grid<'a>) -> Neighbors<'a> {
    let mut neighbors: Neighbors<'a> = vec![];

    let row = node.row;
    let col = node.col;

    for i in -1..2i64 {
        for j in -1..2i64 {
            if i == 0 && j == 0 {
                // ignore self node
                continue;
            }

            let new_row = row as i64 + i;
            let new_col = col as i64 + j;

            if new_row < 0
                || new_row >= grid.nodes.len() as i64
                || new_col < 0
                || new_col >= grid.nodes.len() as i64
            {
                continue;
            }

            let neighbor = grid.nodes[new_row as usize][new_col as usize].borrow();

            if !neighbor.walkable {
                continue;
            }

            neighbors.push(Rc::new(RefCell::new(neighbor.clone())));
        }
    }

    neighbors
}

fn return_vec() -> Vec<i32> {
    let mut v = vec![1, 2, 3];

    v.push(4);

    v
}

fn retrace_path(start_node: &Node, end_node: &Node) -> Vec<BaseNode> {
    let mut current_node = end_node;
    let mut path: Vec<BaseNode> = vec![];

    // // while !std::ptr::eq(current_node, start_node) {
    while current_node != start_node {
        path.push(current_node.to_base());
        current_node = current_node.parent.unwrap();
    }

    path.reverse();
    path
}

#[cfg(test)]
mod tests {
    use std::{
        cell::{Cell, RefCell, RefMut},
        mem::transmute,
        ops::{Deref, DerefMut},
    };

    use super::*;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn a_star_wasm_test() {
        let mut node = Node::new(0, 0);

        let mut grid = RefCell::new(Grid::new(vec![vec![RefCell::new(&mut node)]]));

        /* {
            // let mut grid_mut = grid.borrow_mut();
            let mut grid_mut: RefMut<Grid<'static>> = unsafe { transmute(grid.borrow_mut()) };
            grid_mut.set_start(0, 0);
            grid_mut.set_end(0, 0);
        } */

        let mut start = Node::new(0, 0);
        grid.borrow_mut().set_start_node(RefCell::new(&mut start));

        let is_start = grid.borrow().get_start().as_ref().unwrap().borrow().start;
        assert_eq!(is_start, true);

        let grid_json = serde_wasm_bindgen::to_value(&grid.borrow().to_base()).unwrap();

        let result = a_star_wasm(grid_json).unwrap();

        let result: a_star_result = serde_wasm_bindgen::from_value(result).unwrap();

        assert_eq!(result.path.len(), 1);
    }
}
