import React, { useState } from "react";
import "./Modal.css";
import "../../node.css";
import NodeDiv from "../NodeDiv";
import Node from "../../lib/Node";

export default function Modal() {
  const [modal, setModal] = useState(true);

  const toggleModal = () => {
    setModal(!modal);
  };

  if (modal) {
    document.body.classList.add("active-modal");
  } else {
    document.body.classList.remove("active-modal");
  }

  const nodeWall = new Node(0, 0);
  nodeWall.walkable = false;

  const nodePath = new Node(0, 0);
  nodePath.visited = true;

  const nodeStart = new Node(0, 0);
  nodeStart.start = true;

  const nodeEnd = new Node(0, 0);
  nodeEnd.end = true;

  const nodeOpened = new Node(0, 0);
  nodeOpened.open = true;

  const nodeClosed = new Node(0, 0);
  nodeClosed.closed = true;

  return (
    <>
      <button onClick={toggleModal} className="btn-modal">
        Info
      </button>

      {modal && (
        <div className="modal">
          <div onClick={toggleModal} className="overlay"></div>
          <div className="modal-content">
            <div className="container">
              <div className="header">
                <h2>Controlls:</h2>
              </div>
              <div className="item">
                <div className="bold">Left Click:</div>
                <div>Place start node</div>
              </div>
              <div className="item">
                <div className="bold">Right Click:</div>
                <div>Place end node</div>
              </div>
              <div className="item">
                <div className="bold">
                  <span className="material-symbols-outlined">Shift</span> + Left Mouse Drag:
                </div>
                <div>Place walls</div>
              </div>
              <div className="item">
                <div className="bold">
                  <span className="material-symbols-outlined">Shift</span> + Right Mouse Drag:
                </div>
                <div>Remove walls</div>
              </div>
              <div className="item">
                <div className="bold">
                  <span className="material-symbols-outlined">Keyboard_Return</span> (Enter Key):
                </div>
                <div>Runs the selected algorithm</div>
              </div>
            </div>

            <div className="container">
              <div className="header">
                <h2>Legend:</h2>
              </div>
              <div className="item">
                <div className="bold">Walkable Node</div>
                <NodeDiv node={new Node(0, 0)}></NodeDiv>
              </div>
              <div className="item">
                <div className="bold">Wall Node</div>
                <NodeDiv node={nodeWall}></NodeDiv>
              </div>
              <div className="item">
                <div className="bold">Start Node</div>
                <NodeDiv node={nodeStart}></NodeDiv>
              </div>
              <div className="item">
                <div className="bold">End Node</div>
                <NodeDiv node={nodeEnd}></NodeDiv>
              </div>
              <div className="item">
                <div className="bold">Shortest Path Node</div>
                <NodeDiv node={nodePath}></NodeDiv>
              </div>
              <div className="item">
                <div className="bold">Opened Node (Can still be explored)</div>
                <NodeDiv node={nodeOpened}></NodeDiv>
              </div>
              <div className="item">
                <div className="bold">Closed Node (Already Explored)</div>
                <NodeDiv node={nodeClosed}></NodeDiv>
              </div>
            </div>
            <a href="#" className="close-modal" onClick={toggleModal}></a>
          </div>
        </div>
      )}
    </>
  );
}
