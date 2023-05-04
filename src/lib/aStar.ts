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

function getNeighbors(node: Node, grid: Grid) {
  const neighbors: Node[] = [];
  const { row, col } = node;

  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      if (i === 0 && j === 0) continue; // ignore self node
      // check bounds
      if (
        row + i < 0 ||
        row + i >= grid.nodes.length ||
        col + j < 0 ||
        col + j >= grid.nodes[0].length
      ) {
        continue;
      }
      if (!grid.nodes[row + i][col + j].walkable) continue; // ignore non-walkable nodes
      neighbors.push(grid.nodes[row + i][col + j]);
    }
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
