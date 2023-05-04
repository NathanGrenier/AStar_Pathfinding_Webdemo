import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import generateMaze from "generate-maze";

import NodeDiv from "./components/NodeDiv";
import Modal from "./components/Modal/Modal";
import { aStar } from "./lib/aStar";
// import DFSPathfinder from "./lib/DFS";
import Node from "./lib/Node";

import "./node.css";

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

const algos = ["aStar", "DFS"] as const;

function App() {
  return (
    <>
      <RenderGrid type={"aStar"} />
      {/* <RenderGrid type={"DFS"} /> */}
    </>
  );
}

function resizeForMaze(size: number) {
  return size * 2 + 1;
}

function RenderGrid({ type }: { type: typeof algos[number] }) {
  const [size, setSize] = useState(10);

  const resized = resizeForMaze(size);

  const grid = useMemo(() => {
    const grid = new Grid(
      Array(resized).fill([]).map((_, i) => Array(resized).fill(0).map((_, j) => new Node(i, j))
      )
    );

    // generate maze
    const maze = generateMaze(size, size, undefined, Math.trunc(Math.random() * 1000));

    for (let i = 1; i < grid.nodes.length; i += 2) {
      for (let j = 1; j < grid.nodes.length; j += 2) {
        let mazeRow = Math.trunc((i - 1) / 2);
        let mazeCol = Math.trunc((j - 1) / 2);
        if (maze[mazeRow][mazeCol].top) {
          for (let k = -1; k < 2; k++) {
            grid.nodes[i - 1][j + k].walkable = false;
          }
        }

        if (maze[mazeRow][mazeCol].left) {
          for (let k = -1; k < 2; k++) {
            grid.nodes[i + k][j - 1].walkable = false;
          }
        }

        if (maze[mazeRow][mazeCol].right) {
          for (let k = -1; k < 2; k++) {
            grid.nodes[i + k][j + 1].walkable = false;
          }
        }

        if (maze[mazeRow][mazeCol].bottom) {
          for (let k = -1; k < 2; k++) {
            grid.nodes[i + 1][j + k].walkable = false;
          }
        }
      }
    }
    return grid;
  }, [size]);

  const gridWrapperRef = useRef<HTMLDivElement>(null!);

  const [res, setRes] = useState<ReturnType<typeof aStar>>();
  let timeout: number;

  useEffect(() => {
    if (!res) return;

    const classesToRemove = ["path", "closed", "open"];

    const pathClassesToRemove = gridWrapperRef.current.querySelectorAll(
      classesToRemove.map((s) => "." + s).join(", ")
    );

    for (const pathClass of pathClassesToRemove) {
      pathClass.classList.remove(...classesToRemove);
      classesToRemove.forEach((className) =>
        (pathClass as HTMLElement).style.removeProperty(`--${className}-delay`)
      );
    }

    setTimeout(() => {
      if (res) {
        const { path, closedSet, openList } = res;
        const delayTime = (75 * size) / 100;

        function closedSetAnimation(node: Node, i: number, animationScale: number) {
          const divNode = document.querySelector(
            `.node[data-row='${node.row}'][data-col='${node.col}']`
          ) as HTMLElement;

          const animationTime = i * delayTime * animationScale;
          divNode.style.setProperty("--closed-delay", `${animationTime}ms`);
          divNode.classList.add("closed");
          return animationTime;
        }

        function pathAnimation(node: Node, i: number) {
          const divNode = document.querySelector(
            `.node[data-row='${node.row}'][data-col='${node.col}']`
          ) as HTMLElement;

          const animationTime = i * delayTime;
          divNode.style.setProperty("--path-delay", `${animationTime}ms`);
          divNode.classList.add("path");
          return animationTime;
        }

        function openListAnimation(node: Node, i: number) {
          const divNode = document.querySelector(
            `.node[data-row='${node.row}'][data-col='${node.col}']`
          ) as HTMLElement;

          const animationTime = i * delayTime;
          divNode.style.setProperty("--open-delay", `${animationTime}ms`);
          divNode.classList.add("open");
          return animationTime;
        }

        let animationScale = 1;
        if (closedSet.size > openList.length) {
          // scale the closed set animation time
          animationScale = openList.length / closedSet.size;
        }

        let pathAnimationTimeout = 0;
        for (let i = 0; i < openList.length; i++) {
          const node = openList[i];
          pathAnimationTimeout = Math.max(pathAnimationTimeout, openListAnimation(node, i));
        }

        let i = 0;
        for (const node of closedSet) {
          pathAnimationTimeout = Math.max(
            pathAnimationTimeout,
            closedSetAnimation(node, i, animationScale)
          );
          i++;
        }

        // animate after the other animations are done
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          for (let i = 0; i < path.length; i++) {
            const node = path[i];
            pathAnimation(node, i);
          }
        }, pathAnimationTimeout);
      }
    }, 10);
  });

  function runAStar(grid: Grid) {
    setRes(aStar(grid));
  }

  // const dfs = useMemo(() => {
  //   return new DFSPathfinder(grid);
  // }, []);

  function runDFS(grid: Grid) {
    // const res = dfs.search();
  }

  type algoFunc = (grid: Grid) => void;
  const funcs: Record<typeof algos[number], algoFunc> = {
    aStar: runAStar,
    DFS: runDFS,
  };
  const runPathFinder: algoFunc = () => {
    if (!grid.start || !grid.end) return;
    funcs[type](grid);
  };

  // add walls
  const mouseMoveHandler = (e: MouseEvent) => {
    document.removeEventListener("mouseup", mouseUpHandler);
    if (!(e.target instanceof HTMLDivElement)) return;

    const { row, col } = e.target.dataset;
    const node = grid.nodes[Number(row)][Number(col)];
    if (node && !node.start && !node.end) {
      if (e.shiftKey) {
        if (e.buttons === 1) {
          node.walkable = false;
          e.target.classList.remove("path");
          e.target.classList.remove("open");
          e.target.classList.remove("closed");
          e.target.classList.add("wall");
        } else if (e.buttons === 2) {          
          node.walkable = true;
          e.target.classList.remove("wall");
        }
      }
    }
  };

  const mouseUpHandler = () => {
    gridWrapperRef.current.removeEventListener("mousemove", mouseMoveHandler);
  };

  const sliderMin = 3;
  const sliderMax = 30;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
        <label
          style={{
            textAlign: "center",
          }}
        >
          Maze Size
          <div
            style={{
              display: "flex",
            }}
          >
            <div className="value left">{sliderMin}</div>
            <input
              id="size_slider"
              type="range"
              min={sliderMin}
              max={sliderMax}
              defaultValue={size}
              onChange={(e) => {
                setSize(Number(e.currentTarget.value));
                // Clear res so nothing from before renders
                setRes({
                  closedSet: new Set(),
                  nodesExplored: 0,
                  openList: [],
                  path: [],
                  timeTaken: 0,
                });
              }}
            ></input>
            <div className="value right">{sliderMax}</div>
          </div>
        </label>

        <div
          ref={gridWrapperRef}
          id="grid-wrapper"
          onClick={(e) => {
            if (e.target === e.currentTarget || e.shiftKey || e.ctrlKey) return;

            const divNode = e.target as HTMLDivElement;
            const { row, col } = divNode.dataset;

            grid.start = grid.nodes[Number(row)][Number(col)];
            // setRenderGrid(grid.clone());
            gridWrapperRef.current.querySelector(".start")?.classList.remove("start");
            divNode.classList.add("start");
            divNode.classList.remove("wall", "path", "end");
            
            runPathFinder(grid);
          }}
          onContextMenu={(e) => {
            if (e.target === e.currentTarget || e.ctrlKey) return;
            e.preventDefault();
            
            if (e.shiftKey) {
              return;
            }

            const divNode = e.target as HTMLDivElement;
            const { row, col } = divNode.dataset;

            grid.end = grid.nodes[Number(row)][Number(col)];
            // setRenderGrid(grid.clone());
            gridWrapperRef.current.querySelector(".end")?.classList.remove("end");
            divNode.classList.add("end");
            divNode.classList.remove("wall", "path", "start");
            
            runPathFinder(grid);
          }}
          onMouseDown={(e) => {
            document.addEventListener("mouseup", mouseUpHandler, { once: true, capture: true });
            gridWrapperRef.current.addEventListener("mousemove", mouseMoveHandler);
          }}
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
          <div style={{ display: "flex", flexDirection: "column", margin: 10 }}>
            <div>Time Taken: {res.timeTaken} ms</div>
            <div>Nodes Explored: {res.nodesExplored}</div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", flexDirection: "row" }}>
        <button
          className="btn-modal"
          type="button"
          onClick={() => {
            runPathFinder(grid);
          }}
        >
          Start A*
        </button>
        <Modal></Modal>
      </div>
    </>
  );
}

export default App;
