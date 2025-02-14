import { useEffect, useMemo, useRef, useState } from "react";
import { generateMaze } from "./lib/maze";
import NodeDiv from "./components/NodeDiv";
import Modal from "./components/Modal/Modal";
import { aStar } from "./lib/aStar";
import { dijkstra } from "./lib/dijkstra";
import { benchmarkAlgorithm } from "./lib/benchmark";
import Node from "./lib/Node";
import "./node.css";
import { PathfindingResult } from "./lib/types";
import React from "react";

// Grid class (unchanged from before)
export class Grid {
  public length = 0;
  private _start!: Node;
  private _end!: Node;
  constructor(public nodes: Node[][]) {
    this.length = nodes[0].length * nodes.length;
  }
  clone() {
    const clone = new Grid(this.nodes);
    clone._end = this._end;
    clone._start = this._start;
    clone.length = this.length;
    return clone;
  }
  get start() {
    return this._start;
  }
  get end() {
    return this._end;
  }
  set start(node: Node) {
    node.start = true;
    if (this._start) this._start.start = false;
    this._start = node;
  }
  set end(node: Node) {
    node.end = true;
    if (this._end) this._end.end = false;
    this._end = node;
  }
}

const algos = ["aStar", "Dijkstra"] as const;

function App() {
  return (
    <div>
      <RenderGrid />
    </div>
  );
}

function resizeForMaze(size: number) {
  return size * 2 + 1;
}

function RenderGrid() {
  // Local state for maze size, selected algorithm, and benchmark results
  const [size, setSize] = useState(10);
  const [selectedAlgo, setSelectedAlgo] = useState<(typeof algos)[number]>("aStar");
  const [benchmarkResult, setBenchmarkResult] = useState<{
    averageTime: number;
    bestTime: number;
    worstTime: number;
    runs: number[];
  } | null>(null);
  const [gridVersion, setGridVersion] = useState(0);

  const resized = resizeForMaze(size);

  // Build the grid and generate a maze using our custom generator.
  const grid = useMemo(() => {
    const grid = new Grid(
      Array(resized)
        .fill(null)
        .map((_, i) =>
          Array(resized)
            .fill(null)
            .map((_, j) => new Node(i, j))
        )
    );
    const maze = generateMaze(size, size);
    for (let i = 1; i < grid.nodes.length; i += 2) {
      for (let j = 1; j < grid.nodes.length; j += 2) {
        const mazeRow = Math.floor((i - 1) / 2);
        const mazeCol = Math.floor((j - 1) / 2);
        // Set walls based on the MazeCell data.
        if (maze[mazeRow][mazeCol].top) {
          grid.nodes[i - 1][j].walkable = false;
        }
        if (maze[mazeRow][mazeCol].bottom) {
          grid.nodes[i + 1][j].walkable = false;
        }
        if (maze[mazeRow][mazeCol].left) {
          grid.nodes[i][j - 1].walkable = false;
        }
        if (maze[mazeRow][mazeCol].right) {
          grid.nodes[i][j + 1].walkable = false;
        }
      }
    }

    // Enforce a solid border around the entire grid:
    const rows = grid.nodes.length;
    const cols = grid.nodes[0].length;
    for (let i = 0; i < rows; i++) {
      grid.nodes[i][0].walkable = false;
      grid.nodes[i][cols - 1].walkable = false;
    }
    for (let j = 0; j < cols; j++) {
      grid.nodes[0][j].walkable = false;
      grid.nodes[rows - 1][j].walkable = false;
    }

    return grid;
  }, [size, resized, gridVersion]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        runPathFinder(selectedAlgo);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedAlgo, grid]);

  const gridWrapperRef = useRef<HTMLDivElement>(null);
  const [res, setRes] = useState<ReturnType<typeof aStar>>();

  // --- Event Handlers for modifying the grid (adding walls, setting start/end) ---
  const mouseMoveHandler = (e: MouseEvent) => {
    document.removeEventListener("mouseup", mouseUpHandler);
    if (!(e.target instanceof HTMLDivElement)) return;
    const { row, col } = e.target.dataset;
    const node = grid.nodes[Number(row)][Number(col)];
    if (node && !node.start && !node.end) {
      if (e.shiftKey) {
        if (e.buttons === 1) {
          node.walkable = false;
          e.target.classList.remove("path", "open", "closed");
          e.target.classList.add("wall");
        } else if (e.buttons === 2) {
          node.walkable = true;
          e.target.classList.remove("wall");
        }
      }
    }
  };
  const mouseUpHandler = () => {
    gridWrapperRef.current?.removeEventListener("mousemove", mouseMoveHandler);
  };

  // --- Algorithm Functions ---
  function runAStar(grid: Grid): PathfindingResult | undefined {
    // Reset previous visualization
    grid.nodes.forEach((row) =>
      row.forEach((node) => {
        node.open = false;
        node.closed = false;
        node.visited = false;
      })
    );

    const result = aStar(grid);
    if (result) {
      // Visualize open and closed sets
      result.openList.forEach((node) => {
        node.open = true;
      });
      result.closedSet.forEach((node) => {
        node.closed = true;
      });
      // Visualize final path
      result.path.forEach((node) => {
        node.visited = true;
      });
    }
    setRes(result);
    return result;
  }

  function runDijkstra(grid: Grid): PathfindingResult | undefined {
    // Reset previous visualization
    grid.nodes.forEach((row) =>
      row.forEach((node) => {
        node.open = false;
        node.closed = false;
        node.visited = false;
      })
    );

    const result = dijkstra(grid);
    if (result) {
      // Visualize open and closed sets
      result.openList.forEach((node) => {
        node.open = true;
      });
      result.closedSet.forEach((node) => {
        node.closed = true;
      });
      // Visualize final path
      result.path.forEach((node) => {
        node.visited = true;
      });
    }
    setRes(result);
    return result;
  }

  // Mapping algorithm name to corresponding function.
  const funcs: Record<(typeof algos)[number], (grid: Grid) => PathfindingResult | undefined> = {
    aStar: runAStar,
    Dijkstra: runDijkstra,
  };

  // Runs the selected algorithm (if start and end nodes are set)
  const runPathFinder = (algo: (typeof algos)[number]) => {
    if (!grid.start || !grid.end) return;
    funcs[algo](grid);
  };

  // --- UI Rendering ---
  return (
    <>
      <div className="control-panel" style={{ margin: "1em", textAlign: "center" }}>
        <label style={{ marginRight: "1em" }}>
          Select Algorithm:{" "}
          <select
            value={selectedAlgo}
            onChange={(e) => {
              const newAlgo = e.target.value as (typeof algos)[number];
              setSelectedAlgo(newAlgo);
              runPathFinder(newAlgo);
            }}
          >
            <option value="aStar">A*</option>
            <option value="Dijkstra">Dijkstra</option>
          </select>
        </label>
        <button onClick={() => runPathFinder(selectedAlgo)} style={{ marginRight: "1em" }}>
          Start {selectedAlgo}
        </button>
        <button
          onClick={() => {
            const bench = benchmarkAlgorithm(funcs[selectedAlgo], grid, 10);
            setBenchmarkResult(bench);
          }}
          style={{ marginRight: "1em" }}
        >
          Benchmark {selectedAlgo}
        </button>
        <button
          onClick={() => {
            // Reset all nodes
            grid.nodes.forEach((row) =>
              row.forEach((node) => {
                node.walkable = true;
                node.start = false;
                node.end = false;
                node.open = false;
                node.closed = false;
                node.visited = false;
                node.parent = undefined;
                node.gCost = 0;
                node.hCost = 0;
              })
            );
            // Clear start/end references
            grid._start = undefined as any;
            grid._end = undefined as any;
            // Generate new maze
            const maze = generateMaze(size, size);
            // Apply new maze walls
            for (let i = 1; i < grid.nodes.length; i += 2) {
              for (let j = 1; j < grid.nodes.length; j += 2) {
                const mazeRow = Math.floor((i - 1) / 2);
                const mazeCol = Math.floor((j - 1) / 2);
                if (maze[mazeRow][mazeCol].top) grid.nodes[i - 1][j].walkable = false;
                if (maze[mazeRow][mazeCol].bottom) grid.nodes[i + 1][j].walkable = false;
                if (maze[mazeRow][mazeCol].left) grid.nodes[i][j - 1].walkable = false;
                if (maze[mazeRow][mazeCol].right) grid.nodes[i][j + 1].walkable = false;
              }
            }
            // Re-enforce border
            const rows = grid.nodes.length;
            const cols = grid.nodes[0].length;
            for (let i = 0; i < rows; i++) {
              grid.nodes[i][0].walkable = false;
              grid.nodes[i][cols - 1].walkable = false;
            }
            for (let j = 0; j < cols; j++) {
              grid.nodes[0][j].walkable = false;
              grid.nodes[rows - 1][j].walkable = false;
            }
            setGridVersion((prev) => prev + 1);
            // Reset results
            setRes(undefined);
            setBenchmarkResult(null);
          }}
        >
          Regenerate Maze
        </button>
      </div>
      {benchmarkResult && (
        <div className="benchmark-results" style={{ textAlign: "center", marginBottom: "1em" }}>
          <h3>Benchmark Results</h3>
          <p>Average Time: {benchmarkResult.averageTime.toFixed(2)} ms</p>
          <p>Best Time: {benchmarkResult.bestTime.toFixed(2)} ms</p>
          <p>Worst Time: {benchmarkResult.worstTime.toFixed(2)} ms</p>
        </div>
      )}
      <div
        ref={gridWrapperRef}
        id="grid-wrapper"
        onClick={(e) => {
          if (e.target === e.currentTarget || e.shiftKey || e.ctrlKey) return;
          const divNode = e.target as HTMLDivElement;
          const { row, col } = divNode.dataset;
          grid.start = grid.nodes[Number(row)][Number(col)];
          if (gridWrapperRef.current) {
            gridWrapperRef.current.querySelector(".start")?.classList.remove("start");
          }
          divNode.classList.add("start");
          divNode.classList.remove("wall", "path", "end");
          runPathFinder(selectedAlgo);
        }}
        onContextMenu={(e) => {
          if (e.shiftKey) {
            e.preventDefault();
            return;
          }
          if (e.target === e.currentTarget || e.ctrlKey) return;
          e.preventDefault();
          const divNode = e.target as HTMLDivElement;
          const { row, col } = divNode.dataset;
          grid.end = grid.nodes[Number(row)][Number(col)];
          if (gridWrapperRef.current) {
            gridWrapperRef.current.querySelector(".end")?.classList.remove("end");
          }
          divNode.classList.add("end");
          divNode.classList.remove("wall", "path", "start");
          runPathFinder(selectedAlgo);
        }}
        onMouseDown={(e) => {
          document.addEventListener("mouseup", mouseUpHandler, { once: true, capture: true });
          if (gridWrapperRef.current) {
            gridWrapperRef.current.addEventListener("mousemove", mouseMoveHandler);
          }
        }}
        style={{ margin: "1em" }}
      >
        {grid.nodes.map((nodeRows, i) => (
          <div key={i} className="row">
            {nodeRows.map((node, j) => (
              <NodeDiv key={j} node={node} />
            ))}
          </div>
        ))}
      </div>
      {res && (
        <div style={{ textAlign: "center", margin: "1em" }}>
          <div>Time Taken: {res.timeTaken} ms</div>
          <div>Nodes Explored: {res.nodesExplored}</div>
        </div>
      )}
      <div
        style={{
          textAlign: "center",
          marginBottom: "1em",
          width: "fit-content",
          justifySelf: "center",
        }}
      >
        <Modal />
      </div>
    </>
  );
}

export default App;
