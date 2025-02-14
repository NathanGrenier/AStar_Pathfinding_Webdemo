import { Grid } from "../App";
import Node from "./Node";

type aStarReturn = {
  path: Node[];
  timeTaken: number;
  nodesExplored: number;
  openList: Node[];
  closedSet: Set<Node>;
};

export function aStar(grid: Grid): aStarReturn | undefined {
  const openList: Node[] = [grid.start];
  const closedSet: Set<Node> = new Set();
  let nodesExplored: number = 0;

  // Start timer
  let startTime = performance.now();

  while (openList.length > 0) {
    let currentNode = openList[0];

    // TODO optimize
    for (let i = 1; i < openList.length; i++) {
      if (
        openList[i].fCost < currentNode.fCost ||
        (openList[i].fCost === currentNode.fCost && openList[i].hCost < currentNode.hCost)
      ) {
        currentNode = openList[i];
      }
    }

    openList.splice(openList.indexOf(currentNode), 1);
    closedSet.add(currentNode);

    // TODO update the color of the new node in closedList

    if (currentNode === grid.end) {
      let endTime = performance.now();
      let timeTaken = endTime - startTime; // In milliseconds
      console.log(timeTaken);
      nodesExplored = openList.length + closedSet.size;
      return {
        path: retracePath(grid.start, grid.end),
        timeTaken,
        nodesExplored,
        openList,
        closedSet,
      };
    }

    // TODO instead of callback, return the openList, closedList and path. These values will be used for the visualization (iterate through the arrays with a delay)
    // cbCurrentNode(currentNode);

    const neighbors = getNeighbors(currentNode, grid);

    for (const neighbor of neighbors) {
      // TODO update the colors of the nodes added to openedList
      if (closedSet.has(neighbor)) continue;

      const costToNeighbor = currentNode.gCost + getDistance(currentNode, neighbor);
      if (costToNeighbor < neighbor.gCost || !openList.includes(neighbor)) {
        neighbor.gCost = costToNeighbor;
        neighbor.hCost = getDistance(neighbor, grid.end);
        neighbor.parent = currentNode;

        if (!openList.includes(neighbor)) {
          openList.push(neighbor);
        }
      }
    }
  }
}

function getNeighbors(node: Node, grid: Grid): Node[] {
  const neighbors: Node[] = [];
  const { row, col } = node;
  // Only use cardinal directions
  const directions = [
    [-1, 0], // up
    [1, 0], // down
    [0, -1], // left
    [0, 1], // right
  ];
  for (const [dx, dy] of directions) {
    const newRow = row + dx;
    const newCol = col + dy;
    if (newRow < 0 || newRow >= grid.nodes.length || newCol < 0 || newCol >= grid.nodes[0].length)
      continue;
    if (!grid.nodes[newRow][newCol].walkable) continue;
    neighbors.push(grid.nodes[newRow][newCol]);
  }
  return neighbors;
}

function getDistance(a: Node, b: Node) {
  const dy = Math.abs(a.row - b.row);
  const dx = Math.abs(a.col - b.col);

  if (dx > dy) return a.diagonal * dy + a.length * (dx - dy);

  return a.diagonal * dx + a.length * (dy - dx);
}

function retracePath(startNode: Node, endNode: Node) {
  const path: Node[] = [];
  let currentNode = endNode;

  while (currentNode !== startNode) {
    path.push(currentNode);
    currentNode = currentNode.parent!;
  }

  return path.reverse();
}
