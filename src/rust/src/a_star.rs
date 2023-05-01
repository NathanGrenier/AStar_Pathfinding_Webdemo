use std::{
    cell::{RefCell, UnsafeCell},
    rc::Rc,
};

use serde::{Deserialize, Serialize};

use crate::{
    grid::Grid,
    node::{BaseNode, Node},
};

use std::collections::HashSet;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AStarResult {
    pub path: Vec<BaseNode>,
    pub time_taken: f32,
    pub nodes_explored: u32,
    pub open_list: Vec<BaseNode>,
    pub closed_set: HashSet<BaseNode>,
    pub closed_list: Vec<BaseNode>,
}

pub fn a_star(grid: Grid) -> Option<AStarResult> {
    let start: Rc<RefCell<Node>>;

    if let Some(start_rc) = grid.get_start() {
        start = start_rc;
    } else {
        panic!("No start node found");
    }
    if let None = grid.get_end() {
        panic!("No end node found");
    }

    let open_list: UnsafeCell<Vec<Rc<RefCell<Node>>>> = UnsafeCell::new(vec![start]);
    // let open_list: Rc<UnsafeCell<Vec<Rc<RefCell<Node>>>>> = Rc::new(UnsafeCell::new(vec![start]));
    // let open_list: Rc<Vec<Rc<RefCell<Node>>>> = Rc::new(vec![start]);
    // let open_list: Vec<Rc<RefCell<Node>>> = vec![start];
    // let mut closed_set: HashSet<Rc<&mut Node>> = HashSet::new();
    let mut closed_list: Vec<Rc<RefCell<Node>>> = vec![];

    // start timer
    // let start = std::time::Instant::now();
    // let mut current_node = open_list_mut[0];

    let open_list_mut = open_list.get();

    let get_open_list = || unsafe { open_list_mut.as_ref().unwrap() };
    let get_open_list_mut = || unsafe { open_list_mut.as_mut().unwrap() };
    let get_length = || get_open_list().len();

    while get_length() > 0 {
        let current_node_rc = get_open_list()[0].clone();
        let mut current_node = current_node_rc.borrow();

        for i in 1..get_length() {
            let node = get_open_list()[i].borrow();
            if node.f_cost() < current_node.f_cost()
                || (node.f_cost() == current_node.f_cost() && node.hCost < current_node.hCost)
            {
                current_node = node;
            }
        }

        let current_node_row = current_node.row;
        let current_node_col = current_node.col;

        // open_list_mut.retain(|node| node.borrow().clone() != current_node.clone());
        {
            get_open_list_mut().retain(|node| {
                let node = node.borrow();
                return node.row != current_node_row || node.col != current_node_col;
            });
        }

        // // closed_set.insert(current_node.clone());
        closed_list.push(current_node_rc.clone());

        if current_node.end {
            // let start = grid.get_start().unwrap();
            // let end = grid.get_end().unwrap();
            let start = grid.start.unwrap();
            let end = grid.end.unwrap();

            if let None = end.borrow().parent {
                panic!("End has no parent.");
            }

            let nodes_explored = (get_length() + closed_list.len()) as u32;

            let res = AStarResult {
                path: retrace_path(start, end),
                time_taken: 0.0,
                nodes_explored,
                open_list: get_open_list()
                    .iter()
                    .map(|node| node.borrow().to_base())
                    .collect(),
                closed_list: closed_list
                    .iter()
                    .map(|node| node.borrow().to_base())
                    .collect(),
                closed_set: HashSet::new(),
            };

            return Some(res);
        }

        let neighbors = get_neighbors(&*current_node, &grid);

        for neighbor in neighbors {
            if closed_list.contains(&neighbor) {
                continue;
            }

            let mut push_neighbor = None;

            {
                let ol_contains_neighbor;
                {
                    // the contains method borrows here, so it needs to be dropped as soon as possible.
                    ol_contains_neighbor = get_open_list().contains(&neighbor);
                }

                let mut neighbor_node = neighbor.borrow_mut();

                let cost_to_neighbor =
                    (*current_node).gCost + get_distance(&*current_node, &*neighbor_node);

                if cost_to_neighbor < neighbor_node.gCost || !ol_contains_neighbor {
                    neighbor_node.gCost = cost_to_neighbor;
                    // check if the neighbor (which is already borrowed mutably) is the end node so a borrow doesn't happen twice.
                    if neighbor_node.end {
                        neighbor_node.hCost = 0.0;
                    } else {
                        let end = grid.get_end().unwrap();
                        neighbor_node.hCost = get_distance(&*neighbor_node, &*end.borrow());
                    }

                    neighbor_node.parent = Some(current_node_rc.clone());

                    if !ol_contains_neighbor {
                        // neighbor is borrowed into neighbor_node, so it needs to be dropped before it can be pushed (moved) into the open list.
                        // drop(neighbor_node);
                        // get_open_list_mut().push(neighbor);
                        push_neighbor = Some(neighbor_node.clone()); // must be cloned because it's borrowed above and is used below.
                    }
                }
            }

            if let Some(neighbor_to_push) = push_neighbor {
                if neighbor_to_push.end {
                    // ! when the parent is set above, it doesn't update the end node on the grid.
                    // it's as if the Rc's are pointing to different places.
                    // end node is updated manually here.
                    let end = grid.get_end().unwrap();
                    end.replace(neighbor_to_push.clone());
                }
                get_open_list_mut().push(neighbor);
            }
        }
    }

    println!("No path found");
    None
    // console_log!("open list strong count: {:?}", Rc::strong_count(&open_list));
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

type Neighbors = Vec<Rc<RefCell<Node>>>;
fn get_neighbors(node: &Node, grid: &Grid) -> Neighbors {
    let mut neighbors: Neighbors = vec![];

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
                || new_col >= grid.nodes[0].len() as i64
            {
                continue;
            }

            let neighbor = grid.nodes[new_row as usize][new_col as usize].clone();

            if !neighbor.borrow().walkable {
                continue;
            }

            neighbors.push(neighbor);
        }
    }

    neighbors
}

fn retrace_path(start_node: Rc<RefCell<Node>>, end_node: Rc<RefCell<Node>>) -> Vec<BaseNode> {
    let mut current_node = end_node;
    let mut path: Vec<BaseNode> = vec![];

    while current_node != start_node {
        // while current_node != start_node {
        // let c = current_node.borrow_mut();
        let curr = current_node.clone();
        let curr = curr.borrow();
        path.push(curr.to_base());
        if let Some(parent) = curr.parent.clone() {
            current_node = parent;
            println!("current node: {:?}", current_node);
        }
    }

    path.reverse();
    path
}

#[cfg(test)]
mod tests {
    use std::{
        cell::{RefCell, UnsafeCell},
        fs::File,
        io::BufReader,
        rc::Rc,
    };

    use serde_json::Value;

    use crate::{a_star::a_star, grid::Grid, node::Node};

    #[test]
    fn temp2() {
        let start = Rc::new(RefCell::new(Node::new(0, 0)));

        let open_list: UnsafeCell<Vec<Rc<RefCell<Node>>>> = UnsafeCell::new(vec![start]);

        let open_list_mut = open_list.get();

        let get_open_list = || unsafe { open_list_mut.as_ref().unwrap() };
        let get_open_list_mut = || unsafe { open_list_mut.as_mut().unwrap() };
        let get_length = || get_open_list().len();

        while get_length() > 0 {
            {
                let mut current_node = get_open_list()[0].borrow_mut();
                current_node.walkable = false;
            }

            assert_eq!(get_open_list()[0].borrow().walkable, false);

            get_open_list_mut().remove(0);
        }

        assert_eq!(get_length(), 0);
    }

    #[test]
    fn grid_from_file() {
        let file =
            File::open("E:\\1Repos\\AStar_Pathfinding_Webdemo\\src\\rust\\src\\test_grid.json")
                .unwrap();
        let reader = BufReader::new(file);
        let grid_json: Value = serde_json::from_reader(reader).unwrap();

        // dbg!(Grid::from(grid_json));

        let grid = Grid::from(grid_json);

        let start = grid.get_start().unwrap();
        let end = grid.get_end().unwrap();

        println!("start: {:?}", start.borrow());
        println!("end: {:?}", end.borrow());

        let res = a_star(grid).unwrap();

        println!("path: {:?}", res.path);

        // let result = a_star_wasm(grid_json).unwrap();

        // let result: AStarResult = serde_wasm_bindgen::from_value(result).unwrap();
    }

    #[test]
    fn a_star_test() {
        let node1 = Rc::new(RefCell::new(Node::new(0, 0)));
        let node2 = Rc::new(RefCell::new(Node::new(0, 1)));
        let node3 = Rc::new(RefCell::new(Node::new(0, 2)));

        // let grid = RefCell::new(Grid::new(vec![vec![
        //     node1.clone(),
        //     node2.clone(),
        //     node3.clone(),
        // ]]));
        let mut grid = Grid::new(vec![vec![node1.clone(), node2.clone(), node3.clone()]]);

        grid.set_start_node(node1);
        grid.set_end_node(node3);

        // assert_eq!(node1.clone().borrow().start, false);

        // grid.borrow_mut().set_start_node(node1.clone());

        // let is_start = grid.borrow().get_start().unwrap().borrow().start;
        // assert_eq!(is_start, true);
        // assert_eq!(node1.clone().borrow().start, true);

        // assert_eq!(node3.clone().borrow().end, false);

        // grid.borrow_mut().set_end_node(node3.clone());

        // let is_end = grid.borrow().get_end().unwrap().borrow().end;
        // assert_eq!(is_end, true);
        // assert_eq!(node3.clone().borrow().end, true);
        // let is_start = grid.borrow().get_start().unwrap().borrow().start;
        // assert_eq!(is_start, true);
        // assert_eq!(node3.clone().borrow().start, false);

        //

        let path = a_star(grid).unwrap().path;

        println!("path: {:?}", path);

        assert_eq!(path.len(), 2);
    }
}
