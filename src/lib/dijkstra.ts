import { Grid } from "../App";
import Node from "./Node";
import type { PathfindingResult } from "./types";

export function dijkstra(grid: Grid): PathfindingResult | undefined {
  const openList: Node[] = [grid.start];
  const closedSet: Set<Node> = new Set();
  // For Dijkstra, we initialize start with 0 cost.
  grid.start.gCost = 0;
  let nodesExplored = 0;
  const startTime = performance.now();

  while (openList.length > 0) {
    // Select the node with the lowest gCost.
    let currentNode = openList[0];
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].gCost < currentNode.gCost) {
        currentNode = openList[i];
      }
    }
    openList.splice(openList.indexOf(currentNode), 1);
    closedSet.add(currentNode);

    if (currentNode === grid.end) {
      const endTime = performance.now();
      nodesExplored = openList.length + closedSet.size;
      return {
        path: retracePath(grid.start, grid.end),
        timeTaken: endTime - startTime,
        nodesExplored,
        openList,
        closedSet,
      };
    }

    const neighbors = getNeighbors(currentNode, grid);
    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor)) continue;
      const costToNeighbor = currentNode.gCost + getDistance(currentNode, neighbor);
      if (costToNeighbor < neighbor.gCost || !openList.includes(neighbor)) {
        neighbor.gCost = costToNeighbor;
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

function getDistance(a: Node, b: Node): number {
  const dy = Math.abs(a.row - b.row);
  const dx = Math.abs(a.col - b.col);
  // This cost function supports diagonal movement.
  if (dx > dy) return a.diagonal * dy + a.length * (dx - dy);
  return a.diagonal * dx + a.length * (dy - dx);
}

function retracePath(startNode: Node, endNode: Node): Node[] {
  const path: Node[] = [];
  let currentNode = endNode;
  while (currentNode !== startNode) {
    path.push(currentNode);
    currentNode = currentNode.parent!;
  }
  return path.reverse();
}
