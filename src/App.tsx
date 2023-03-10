import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import generateMaze from "generate-maze";

import NodeDiv from "./components/NodeDiv";
import { aStar } from "./lib/aStar";
// import DFSPathfinder from "./lib/DFS";
import Node from "./lib/Node";

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

function getNodeSize() {
  // const rowNum = 10;
  // const colNum = 10;
  // const rowLegnth = wrapper.width;
  // const rowHeight = wrapper.height / rowNum;
  // const colLegnth = wrapper.width / colNum;
  // const colHeight = wrapper.height;
  // const area = rowLength * colHeight;
  // const nodeSideLength = Math.sqrt(area / 100);
}

/* function Controls() {
  return (
    <>
      <label>
        Columns
        <input
          type="range"
          defaultValue={width}
          onChange={(e) => {
            setWidth(Number(e.target.value));
          }}
          step="2"
          min="2"
          max={size}
        />
      </label>
      <label>
        Rows
        <input
          type="range"
          defaultValue={height}
          onChange={(e) => {
            setHeight(Number(e.target.value));
          }}
          step="2"
          min="2"
          max={size}
        />
      </label>
    </>
  );
} */

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
      Array(resized)
        .fill([])
        .map((_, i) =>
          Array(resized)
            .fill(0)
            .map((_, j) => new Node(i, j))
        )
    );
    // Set the bottom left and top right nodes to start and end respectfully
    // grid.nodes[grid.nodes.length - 1][0].start = true;
    // grid.nodes[0][grid.nodes[0].length - 1].end = true;

    // grid.start = grid.nodes[grid.nodes.length - 1][0];
    // grid.end = grid.nodes[0][grid.nodes[0].length - 1];

    // generate maze
    const maze = generateMaze(size, size, undefined, Math.trunc(Math.random() * 1000));

    // console.log(maze);

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

  // const [height, setHeight] = useState(size);
  // const [width, setWidth] = useState(size);

  // const [start, setStart] = useState<Node>(grid.start);

  const gridWrapperRef = useRef<HTMLDivElement>(null!);

  // useLayoutEffect(() => {
  //   const wrapper = gridWrapperRef.current;

  //   const area = wrapper.clientWidth * wrapper.clientHeight;
  //   const nodeSideLength = Math.sqrt(area / (height * width));

  //   // const nodeHeight = window.innerHeight / height;
  //   // const nodeWidth = window.innerWidth / width;

  //   document.documentElement.style.setProperty(
  //     "--node-size",
  //     `${nodeSideLength}px`
  //   );
  // }, [height, width]);

  /* useLayoutEffect(() => {
    const wrapper = gridWrapperRef.current;
    const nodeWidth = wrapper.clientWidth / width;
    document.documentElement.style.setProperty("--node-size", `${nodeWidth}px`);

    const widthToAdd = (wrapper.clientWidth % width) / width;

    // const currentNodeSize = parseFloat(
    //   getComputedStyle(document.documentElement).getPropertyValue("--node-size")
    // );

    // document.documentElement.style.setProperty(
    //   "--node-size",
    //   `${currentNodeSize + widthToAdd}px`
    // );
  }, []); */

  //let res: ReturnType<typeof aStar>;
  const [res, setRes] = useState<ReturnType<typeof aStar>>();
  let timeout: number;

  useEffect(() => {
    if (!res) return;
    console.log(res.timeTaken);

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

  // useEffect(() => {
  //   runAStar(grid);
  // });

  // const [dragging, setDragging] = useState(false);

  // const selectedNodeRef = useRef<Node | null>(null);

  /* useEffect(() => {
    let start = gridWrapperRef.current.querySelector(".start") as HTMLDivElement;
    let end = gridWrapperRef.current.querySelector(".end") as HTMLDivElement;

    const mousedownHandler = (e: MouseEvent) => {
      // if (selectedNodeRef.current) return;
      let currentTarget = e.currentTarget as HTMLDivElement;
      // setDragging(true);
      // selectedNodeRef.current = node;
      const mouseMoveHandler = (e: MouseEvent) => {
        if (e.target instanceof HTMLDivElement) {
          // @ts-ignore
          const node = start.node as Node;
          const { row, col } = e.target.dataset;
          const newNode = grid.nodes[Number(row)][Number(col)];

          if (newNode && !newNode.start && !newNode.end) {
            const startOrEnd = node.start ? "start" : "end";
            grid[startOrEnd] = newNode;
            // setRenderGrid(grid.clone()); // TODO cloning may not be necessary
            currentTarget.classList.remove(startOrEnd);
            // @ts-ignore
            e.target.node = newNode;
            currentTarget = e.target;
            start = e.target;
            e.target.classList.add(startOrEnd);
          }
        }
      };
      gridWrapperRef.current.addEventListener("mousemove", mouseMoveHandler);
      const mouseUpHandler = () => {
        gridWrapperRef.current.removeEventListener("mousemove", mouseMoveHandler);
        // setDragging(false);
        // selectedNodeRef.current = null;
      };
      document.addEventListener("mouseup", mouseUpHandler, {
        once: true,
      });
    };

    start.addEventListener("mousedown", mousedownHandler);
  }, []); */

  /* useEffect(() => {
    // click to set start node
    const clickHandler = (e: MouseEvent) => {
      const divNode = e.target as HTMLDivElement;
      const { row, col } = divNode.dataset;

      grid.start = grid.nodes[Number(row)][Number(col)];
      // setRenderGrid(grid.clone());
      gridWrapperRef.current.querySelector(".start")?.classList.remove("start");
      gridWrapperRef.current
        .querySelector(`.node[data-row='${row}'][data-col='${col}']`)
        ?.classList.add("start");
      runPathFinder(grid);
    };
    gridWrapperRef.current.addEventListener("click", clickHandler);

    // click to set end node
    const rightClickHandler = (e: MouseEvent) => {
      e.preventDefault();
      const divNode = e.target as HTMLDivElement;
      const { row, col } = divNode.dataset;

      grid.end = grid.nodes[Number(row)][Number(col)];
      // setRenderGrid(grid.clone());
      gridWrapperRef.current.querySelector(".end")?.classList.remove("end");
      gridWrapperRef.current
        .querySelector(`.node[data-row='${row}'][data-col='${col}']`)
        ?.classList.add("end");
      runPathFinder(grid);
    };
    gridWrapperRef.current.addEventListener("contextmenu", rightClickHandler);

    return () => {
      gridWrapperRef.current.removeEventListener("click", clickHandler);
      gridWrapperRef.current.removeEventListener("contextmenu", rightClickHandler);
    };
  }, []); */

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
          e.target.classList.add("wall");
          e.target.classList.remove("path");
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
            if (e.target === e.currentTarget || e.shiftKey || e.ctrlKey) return;
            e.preventDefault();

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
            <div>Time Taken: {res.timeTaken.toFixed(2)} ms</div>
            <div>Nodes Explored: {res.nodesExplored}</div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          runPathFinder(grid);
        }}
      >
        Start A*
      </button>
    </>
  );
}

export default App;
