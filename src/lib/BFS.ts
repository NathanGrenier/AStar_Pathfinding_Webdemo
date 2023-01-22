import { Grid } from "../App";

// Basically copied :)
class BFS {
  public bfs(G: Grid, startVert: number) {
    let visited: boolean[] = Array<boolean>();

    for (let i = 0; i < 10; i++) {
      visited.push(false);
    }

    // Use an array as our queue representation:
    let q: number[] = new Array<number>();

    visited[startVert] = true;

    q.push(startVert);

    while (q.length > 0) {
      const v = q.shift();
      for (let adjV of G.adj[v]) {
        if (!visited[adjV]) {
          visited[adjV] = true;
          q.push(adjV);
        }
      }
    }
  }
}
