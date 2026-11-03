import { useId, useState } from 'react'

export default function VisitorCounter({ count = null }) {
  const tooltipId = useId()
  const [tooltipDismissed, setTooltipDismissed] = useState(false)
  const digits = typeof count === 'number' && Number.isSafeInteger(count) && count >= 0
    ? String(count).padStart(4, '0')
    : typeof count === 'string' && /^\d+$/.test(count) ? count.padStart(4, '0') : '----'

  return <div className="welcome-counter-position">
    <div
      className={`welcome-counter${tooltipDismissed ? ' tooltip-dismissed' : ''}`}
      tabIndex={0} role="group"
      aria-label={digits === '----' ? 'Visitor count unavailable' : `${digits} visits`}
      aria-describedby={tooltipId}
      onPointerEnter={() => setTooltipDismissed(false)}
      onFocus={() => setTooltipDismissed(false)}
      onKeyDown={event => { if (event.key === 'Escape') setTooltipDismissed(true) }}
    >
      <span className="counter-border" aria-hidden="true">
        {['top', 'top-left', 'top-right', 'left', 'inner-left', 'center', 'inner-right', 'right', 'bottom-left', 'bottom-right', 'bottom'].map(piece => <span key={piece} className={`counter-piece counter-${piece}`} />)}
      </span>
      <img className="counter-footprints" src={`${import.meta.env.BASE_URL}images/visitor-counter.svg`} width="41" height="53" alt="" />
      <span className="counter-digits" aria-hidden="true">{digits}</span>
      <span className="counter-tooltip" role="tooltip" id={tooltipId}>wanderers who stopped by ♡</span>
    </div>
  </div>
}
