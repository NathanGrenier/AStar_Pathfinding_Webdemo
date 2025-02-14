import Node from "./Node";
export type PathfindingResult = {
  path: Node[];
  timeTaken: number;
  nodesExplored: number;
  openList: Node[];
  closedSet: Set<Node>;
};
