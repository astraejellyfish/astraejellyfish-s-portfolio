// Decorative bar pattern, rather than an encoded or scannable identifier.
const bars = [
  [0, 2], [4, 1], [7, 3], [12, 1], [15, 2], [19, 4],
  [25, 1], [28, 2], [32, 1], [35, 4], [41, 2], [45, 1],
  [48, 3], [53, 1], [56, 2], [60, 4], [66, 1], [69, 3],
  [74, 1], [77, 2], [81, 4], [87, 1], [89, 1],
]

export default function BarcodeDecoration({ className = '' }) {
  return (
    <svg
      className={`barcode-decoration ${className}`}
      width="90"
      height="44"
      viewBox="0 0 90 44"
      fill="#04F601"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {bars.map(([x, width]) => <rect key={x} x={x} y="0" width={width} height="44" />)}
    </svg>
  )
}
