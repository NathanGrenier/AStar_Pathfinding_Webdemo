import Node from "../lib/Node";

export default function NodeDiv({
  node,
  ...props
}: { node: Node } & React.HTMLAttributes<HTMLDivElement>) {
  let type = node.start
    ? " start"
    : node.end
    ? " end"
    : node.visited
    ? " path"
    : !node.walkable
    ? " wall"
    : node.open
    ? " open"
    : node.closed
    ? " closed"
    : "";
  return (
    <div
      className={"node" + type}
      data-row={String(node.row)}
      data-col={String(node.col)}
      onMouseDown={props.onMouseDown}
    ></div>
  );
}
