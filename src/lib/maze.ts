export interface MazeCell {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
  visited: boolean;
}

/**
 * Generates a maze of given dimensions using recursive backtracking.
 * Each cell starts with all walls intact; walls are removed as passages are carved.
 * After carving, the border of the maze is re‑enforced as solid walls.
 */
export function generateMaze(width: number, height: number): MazeCell[][] {
  // Create grid of MazeCells (all walls present)
  const maze: MazeCell[][] = [];
  for (let y = 0; y < height; y++) {
    maze[y] = [];
    for (let x = 0; x < width; x++) {
      maze[y][x] = { top: true, right: true, bottom: true, left: true, visited: false };
    }
  }

  // Helper: Fisher–Yates shuffle
  function shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length;
    while (currentIndex !== 0) {
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  // Recursive backtracking to carve passages.
  function carve(x: number, y: number) {
    maze[y][x].visited = true;
    const directions = shuffle([
      { dx: 0, dy: -1, wall: "top", opposite: "bottom" },
      { dx: 1, dy: 0, wall: "right", opposite: "left" },
      { dx: 0, dy: 1, wall: "bottom", opposite: "top" },
      { dx: -1, dy: 0, wall: "left", opposite: "right" },
    ]);
    for (const { dx, dy, wall, opposite } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (!maze[ny][nx].visited) {
        // Remove the wall between the current cell and its neighbor.
        maze[y][x][wall as keyof MazeCell] = false;
        maze[ny][nx][opposite as keyof MazeCell] = false;
        carve(nx, ny);
      }
    }
  }

  carve(0, 0);

  // Enforce a solid border on all sides.
  for (let x = 0; x < width; x++) {
    maze[0][x].top = true;
    maze[height - 1][x].bottom = true;
  }
  for (let y = 0; y < height; y++) {
    maze[y][0].left = true;
    maze[y][width - 1].right = true;
  }

  return maze;
}
