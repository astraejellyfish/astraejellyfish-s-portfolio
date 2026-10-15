import { useId } from 'react'
import { NYAN_FRAMES, NYAN_FRAME_MS } from './nyanFrames'
import './NyanCat.css'

export default function NyanCat() {
  const patternId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return (
    <div className="nyan-cat" aria-hidden="true">
      <svg
        className="nyan-cat-art"
        viewBox="0 0 112 32"
        preserveAspectRatio="xMaxYMid meet"
        fill="none"
        shapeRendering="crispEdges"
        focusable="false"
        style={{ '--nyan-cycle': `${NYAN_FRAMES.length * NYAN_FRAME_MS}ms` }}
      >
        <defs>
          {NYAN_FRAMES.map((paths, frame) => (
            <pattern
              key={frame}
              id={`nyan-extended-trail-${patternId}-${frame}`}
              x="8" y="0" width="16" height="32"
              patternUnits="userSpaceOnUse"
              viewBox="8 0 16 32"
              overflow="hidden"
            >
              {paths.filter(({ fill }) => fill.startsWith('#04F601')).map(({ fill, d }) => <path key={fill} fill={fill} d={d} />)}
            </pattern>
          ))}
        </defs>
        {/* Original right-facing frames, shifted without changing their scale. */}
        <g transform="translate(12 0)">
          {NYAN_FRAMES.map((paths, frame) => (
            <g key={frame} className="nyan-animation-frame" style={{ animationDelay: `${frame * NYAN_FRAME_MS}ms` }}>
              {/* Repeat this frame's own trail tile into the unused header space. */}
              <rect x="-1024" y="0" width="1032" height="32" fill={`url(#nyan-extended-trail-${patternId}-${frame})`} />
              {paths.map(({ fill, d }) => <path key={fill} fill={fill} d={d} />)}
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
