import { Grid } from "../App";
import Node from "./Node";

class Maze {
  // rowCount: number = 0;
  // colCount: number = 0;
  // grid: Node[][] = [];

  // constructor(size: number) {
  //     this.rowCount = size;
  //     this.colCount = size;
  //     for (let i=0; i < this.rowCount; i++) {
  //         this.grid.push([]);
  //         for (let j=0; j <this.colCount) {
  //             this.grid[i].push(new Node(i,j));
  //         }
  //     }
  // }

  constructor(size: number, rows: number, columns: number) {
    this.size = size;
    this.rows = rows;
    this.columns = columns;
    this.grid = [];
    this.maze = [];
  }
}
