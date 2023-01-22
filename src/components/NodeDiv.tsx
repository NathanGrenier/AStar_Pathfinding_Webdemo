import Node from "../lib/Node";

export default function NodeDiv({
  node,
  ...props
}: { node: Node } & React.HTMLAttributes<HTMLDivElement>) {
  const type = node.start
    ? " start"
    : node.end
    ? " end"
    : node.visited
    ? " path"
    : !node.walkable
    ? " wall"
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
