mod a_star;
pub mod grid;
pub mod node;

use a_star::a_star;

use grid::{BaseGrid, Grid};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn a_star_wasm(grid_json: JsValue) -> Result<JsValue, JsValue> {
    let base_grid = serde_wasm_bindgen::from_value::<BaseGrid>(grid_json)?;

    let grid = Grid::from_base(base_grid);

    let res = a_star(grid);

    Ok(serde_wasm_bindgen::to_value(&res)?)
}

#[cfg(test)]
mod tests {
    use std::{cell::RefCell, rc::Rc};

    use crate::{a_star::AStarResult, node::Node};

    use super::*;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn a_star_wasm_test() {
        let node1 = Rc::new(RefCell::new(Node::new(0, 0)));
        let node2 = Rc::new(RefCell::new(Node::new(0, 1)));
        let node3 = Rc::new(RefCell::new(Node::new(0, 2)));

        let grid = RefCell::new(Grid::new(vec![vec![
            node1.clone(),
            node2.clone(),
            node3.clone(),
        ]]));

        assert_eq!(node1.clone().borrow().start, false);

        grid.borrow_mut().set_start_node(node1.clone());

        let is_start = grid.borrow().get_start().unwrap().borrow().start;
        assert_eq!(is_start, true);
        assert_eq!(node1.clone().borrow().start, true);

        assert_eq!(node3.clone().borrow().end, false);

        grid.borrow_mut().set_end_node(node3.clone());

        let is_end = grid.borrow().get_end().unwrap().borrow().end;
        assert_eq!(is_end, true);
        assert_eq!(node3.clone().borrow().end, true);
        let is_start = grid.borrow().get_start().unwrap().borrow().start;
        assert_eq!(is_start, true);
        assert_eq!(node3.clone().borrow().start, false);

        //

        let grid_json = serde_wasm_bindgen::to_value(&grid.borrow().to_base()).unwrap();

        let result = a_star_wasm(grid_json).unwrap();

        let result: AStarResult = serde_wasm_bindgen::from_value(result).unwrap();

        println!("{:?}", result.path);
        assert_eq!(result.path.len(), 2);
    }
}
