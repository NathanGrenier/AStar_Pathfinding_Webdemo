import { Grid } from "../App";
import Node from "./Node";

grid: Grid;
const closedNodes: Node[] = [];
const path: Node[] = [];

function isValid(node: Node, grid: Grid, closedNode: Node[]) {
  // If cell is out of bounds
  if (
    node.row < 0 ||
    node.col < 0 ||
    node.row >= grid.nodes.length ||
    node.col >= grid.nodes[0].length
  )
    return false;

  // If the cell is already visited
  if (closedNodes.includes(node)) return false;

  // Otherwise, it can be visited
  return true;
}

export function DFS(grid: Grid) {
  const stack: Node[] = [grid.start];
  while (stack.length > 0) {
    let currentNode: Node = stack[stack.length - 1];
    stack.pop();

    // If the node we're evaluating is invalid, skip it
    if (!isValid(currentNode, grid, closedNodes)) {
      continue;
    }

    closedNodes.push(currentNode);
  }
}

//start at grid.start
//we check all walkable adjacent squares direction
//(0,0) < (0,1),(0,2) CHECK X'S FOR ROWS,,, IF X'S R SMALLER ALWAYS FRST
//(0,0) < (1,0),(2,0) CHECK Y'S FOR COLUMNS,,, IF Y'S R SMALLER ALWAYS FIRST
//PUT INITIAL STARTING POINT
//TRAVERSE

//dict {key: total_distance: Array[paths]}
// export default class DFS {
//   start: Node;
//   end: Node;
//   queue: Array<[[number, number], number]>; //[[[2,3],6],[[2,3],8]]
//   visited: Set<number[]>;
//   dictionary_vis: { [key: number]: [[number, number]] } = {};
//   directions: readonly [
//     readonly [-1, -1],
//     readonly [0, -1],
//     readonly [1, -1],
//     readonly [-1, 0],
//     readonly [1, 0],
//     readonly [-1, 1],
//     readonly [0, 1],
//     readonly [1, 1]
//   ];
//   constructor(public grid: Grid) {
//     this.start = grid.start;
//     this.end = grid.end;
//     this.queue = [[[this.start.row, this.start.col], 0]];

//     this.visited = new Set([[grid.start.row, grid.start.col]]);
//     this.dictionary_vis = {};

//     this.directions = [
//       [-1, -1],
//       [0, -1],
//       [1, -1],
//       [-1, 0],
//       [1, 0],
//       [-1, 1],
//       [0, 1],
//       [1, 1],
//     ] as const;
//   }

//   search(queue = this.queue) {

//     for (let [[x, y], _] of queue) {
//       if (x === this.grid.end.row && y === this.grid.end.col) {
//         let tot_distance = 0;
//         for (let [_, dist] of queue) {
//           tot_distance += dist;
//         }
//         // dictionary_vis[tot_distance] = queue[-1][::-1];
//         //might not work need to only get the coordinates [x,y]
//         this.dictionary_vis[tot_distance] = queue.at(-1)?.reverse()[0] as any;
//       }

//       for (let [dir_x, dir_y] of this.directions) {
//         let new_x = x;
//         let new_y = y;
//         if (
//           new_x + dir_x < 0 ||
//           this.grid.nodes.length <= new_x + dir_x ||
//           new_y + dir_y < 0 ||
//           this.grid.nodes[0].length <= new_y + dir_y ||
//           !this.grid.nodes[new_x + dir_x][new_y + dir_y].walkable
//         ) {
//           continue;
//         } else {
//           new_x += dir_x;
//           new_y += dir_y;
//         }
//         if (this.visited.has([new_x, new_y])) continue;
//         this.visited.add([new_x, new_y]);

//         if (Math.abs(x + dir_x) + Math.abs(y + dir_y) == 2) {
//           queue.push([[new_x, new_y], 0.5]);
//         } else {
//           queue.push([[new_x, new_y], 1]);
//         }
//       }
//     }
//     queue.pop();
//     this.search(queue);

//     return true;
//   }

//   efficient() {
//     let lowest = 10000;

//     for (let key in this.dictionary_vis) {
//       if (parseInt(key) < lowest) {
//         lowest = parseInt(key);
//       }
//     }
//     return this.dictionary_vis[lowest];
//   }
// }
