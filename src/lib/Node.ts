export default class Node {
  walkable: boolean;
  start: boolean;
  end: boolean;
  parent: Node | undefined;
  length: number;
  diagonal: number;
  // Used for aStar
  gCost: number;
  hCost: number;
  // coords
  row: number;
  col: number;
  right!: null;
  left!: null;

  visited = false; // part of the final path

  constructor(row: number, col: number) {
    this.walkable = true;
    this.start = false;
    this.end = false;
    this.length = 10;
    this.diagonal = Math.sqrt(Math.pow(this.length, 2) * 2);
    // For aStar
    this.gCost = 0;
    this.hCost = 0;
    // coords
    this.row = row;
    this.col = col;
  }

  get fCost() {
    return this.gCost + this.hCost;
  }
}
