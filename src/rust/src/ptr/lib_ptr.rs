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
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}

macro_rules! console_log {
    // Note that this is using the `log` function imported above during
    // `bare_bones`
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct a_star_result {
    path: Vec<BaseNode>,
    pub time_taken: f32,
    pub nodes_explored: u32,
    open_list: Vec<BaseNode>,
    closed_set: HashSet<BaseNode>,
}

#[wasm_bindgen]
pub unsafe fn a_star_wasm(grid_json: JsValue) -> Result<JsValue, JsValue> {
    let base_grid = serde_wasm_bindgen::from_value::<BaseGrid>(grid_json)?;

    let grid = Grid::from_base(base_grid);

    console_log!("grid: {:?}", grid);

    let start_ptr: *mut Node;

    if let Some(start_rc) = grid.get_start().as_ref() {
        // start_ptr = start_rc.borrow_mut().as_mut().unwrap().clone();
        start_ptr = start_rc.borrow_mut().as_mut().unwrap();
        let start = start_ptr.as_mut().unwrap();
        console_log!("start {:?}: {:?}", start_ptr, start);
    } else {
        panic!("No start node found");
    }
    if let None = grid.get_end().as_ref() {
        panic!("No end node found");
    }

    let end_ptr: *mut Node;
    if let Some(end_rc) = grid.get_end().as_ref() {
        // end = end_rc.borrow_mut().as_mut().unwrap().clone();
        end_ptr = end_rc.borrow_mut().as_mut().unwrap();
        let end = end_ptr.as_mut().unwrap();
        console_log!("end {:?}: {:?}", end_ptr, end);
    } else {
        panic!("No end node found");
    }

    let res = a_star_result {
        path: retrace_path(start_ptr, end_ptr),
        time_taken: 0.0,
        nodes_explored: 123,
        open_list: vec![],
        closed_set: HashSet::new(),
    };

    console_log!("test path: {:?}", res.path);

    return Ok(serde_wasm_bindgen::to_value(&res)?);

    // let open_list: Rc<RefCell<Vec<Rc<&mut Node>>>> =
    //     Rc::new(RefCell::new(vec![Rc::new(&mut start)]));
    // let open_list: Rc<RefCell<Vec<Rc<RefCell<&mut Node>>>>> =
    //     Rc::new(RefCell::new(vec![Rc::new(RefCell::new(&mut start))]));
    let open_list: Rc<RefCell<Vec<Rc<RefCell<*mut Node>>>>> =
        Rc::new(RefCell::new(vec![Rc::new(RefCell::new(start_ptr))]));
    let ol_clone = open_list.clone();
    let open_list_ref_cell = ol_clone.as_ref();
    // let mut open_list: Vec<Rc<Node>> = vec![Rc::new((*grid.get_start()).unwrap().clone())];
    // let mut closed_set: HashSet<Rc<&mut Node>> = HashSet::new();
    let mut closed_list: Vec<*mut Node> = vec![];

    // start timer
    // let start = std::time::Instant::now();
    // let mut current_node = open_list_mut[0];

    let mut open_list_mut = open_list_ref_cell.borrow_mut();

    while open_list_mut.len() > 0 {
        let _current_node = open_list_mut[0].clone();
        let mut current_node = *_current_node.as_ptr();
        let current_node_borrow = &**_current_node.borrow_mut();

        for i in 1..open_list_mut.len() {
            let node_rc = open_list_mut[i].clone();
            let node = &mut **node_rc.as_ref().borrow();
            if node.f_cost() < current_node_borrow.f_cost()
                || (node.f_cost() == current_node_borrow.f_cost()
                    && node.hCost < current_node_borrow.hCost)
            {
                current_node = node;
            }
        }

        open_list_mut.retain(|node| *node.as_ptr() != current_node);
        // // closed_set.insert(current_node.clone());
        closed_list.push(current_node);

        if current_node_borrow.end {
            let start = grid.get_start().as_ref().unwrap().borrow_mut().clone();
            // let start_ptr = &mut start as *mut Node;
            // let end = &grid.get_end().as_ref().unwrap().borrow().clone();
            let end = grid.get_end().as_ref().unwrap().borrow_mut().clone();

            let nodes_explored = (open_list_mut.len() + closed_list.len()) as u32;

            let res = a_star_result {
                path: retrace_path(start, end),
                time_taken: 0.0,
                nodes_explored,
                open_list: open_list_mut
                    .iter()
                    .map(|node| {
                        let node = *node.as_ptr();
                        node.as_ref().unwrap().to_base()
                    })
                    .collect(),
                closed_set: HashSet::new(),
            };

            return Ok(serde_wasm_bindgen::to_value(&res)?);
        }

        let neighbors = get_neighbors(current_node.as_ref().unwrap(), &grid);

        for _neighbor in neighbors {
            // let neighbor = &_neighbor.as_ref().borrow().clone();
            let neighbor_ptr = _neighbor.as_ptr();
            let neighbor = neighbor_ptr.as_mut().unwrap();

            // if closed_set.contains(&Rc::new(neighbor)) {
            if closed_list.contains(&neighbor_ptr) {
                continue;
            }

            let cost_to_neighbor = (*current_node).gCost
                + get_distance(
                    current_node.as_ref().unwrap(),
                    neighbor_ptr.as_ref().unwrap(),
                );

            let neighbor_ptr_rc = Rc::new(RefCell::new(neighbor_ptr));
            let ol_contains_current = open_list_mut.contains(&neighbor_ptr_rc);

            if cost_to_neighbor < neighbor.gCost || !ol_contains_current {
                let end = &*grid
                    .get_end()
                    .as_ref()
                    .unwrap()
                    .as_ptr()
                    .as_ref()
                    .unwrap()
                    .clone();

                neighbor.gCost = cost_to_neighbor;
                neighbor.hCost = get_distance(
                    neighbor_ptr.as_ref().unwrap(),
                    // grid.get_end().as_ref().unwrap().as_ptr().as_ref().unwrap(),
                    end,
                );
                neighbor.parent = Some(current_node);

                if !ol_contains_current {
                    open_list_mut.push(neighbor_ptr_rc);
                }
            }
        }
    }

    console_log!("returned nothing");
    console_log!("open list strong count: {:?}", Rc::strong_count(&open_list));
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
fn get_neighbors<'a>(node: &Node<'a>, grid: &'a Grid<'a>) -> Neighbors<'a> {
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

            let neighbor = unsafe {
                grid.nodes[new_row as usize][new_col as usize]
                    .borrow_mut()
                    .as_ref()
            }
            .unwrap();

            if !neighbor.walkable {
                continue;
            }

            neighbors.push(Rc::new(RefCell::new(neighbor.clone())));
        }
    }

    neighbors
}

fn retrace_path<'a>(start_node: *mut Node<'a>, end_node: *mut Node<'a>) -> Vec<BaseNode> {
    let mut current_node = end_node;
    let mut path: Vec<BaseNode> = vec![];

    // // while !std::ptr::eq(current_node, start_node) {
    while current_node != start_node {
        let c_node = unsafe { current_node.as_ref() }.unwrap();
        path.push(c_node.to_base());
        if let Some(parent) = c_node.parent {
            current_node = parent;
        }
    }

    path.reverse();
    path
}

#[cfg(test)]
mod tests {
    use std::cell::{Cell, RefCell, RefMut};

    use super::*;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn a_star_wasm_test() {
        let node1 = &mut Node::new(0, 0) as *mut Node;
        let node2 = &mut Node::new(0, 1) as *mut Node;
        let node3 = &mut Node::new(0, 2) as *mut Node;

        let grid = RefCell::new(Grid::new(vec![vec![
            Rc::new(RefCell::new(node1)),
            Rc::new(RefCell::new(node2)),
            Rc::new(RefCell::new(node3)),
        ]]));

        /* {
            // let mut grid_mut = grid.borrow_mut();
            let mut grid_mut: RefMut<Grid<'static>> = unsafe { transmute(grid.borrow_mut()) };
            grid_mut.set_start(0, 0);
            grid_mut.set_end(0, 0);
        } */

        assert_eq!(unsafe { node1.as_ref() }.borrow().unwrap().start, false);

        let mut start = Node::new(0, 0);
        grid.borrow_mut()
            .set_start_node(Rc::new(RefCell::new(&mut start)));

        let mut end = Node::new(0, 0);
        grid.borrow_mut()
            .set_end_node(Rc::new(RefCell::new(&mut end)));

        // let is_start = grid.borrow().get_start().as_ref().unwrap().borrow().start;
        let is_start = unsafe {
            grid.borrow()
                .get_start()
                .as_ref()
                .unwrap()
                .borrow_mut()
                .as_ref()
        }
        .unwrap()
        .start;
        assert_eq!(is_start, true);

        let grid_json = serde_wasm_bindgen::to_value(&grid.borrow().to_base()).unwrap();

        let result = unsafe { a_star_wasm(grid_json) }.unwrap();

        let result: a_star_result = serde_wasm_bindgen::from_value(result).unwrap();

        // panic!("{:?}", result.path);
        assert_eq!(result.path.len(), 1);
    }
}
