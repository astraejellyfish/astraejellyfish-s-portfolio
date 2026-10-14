import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'

const spring = { type: 'spring', stiffness: 300, damping: 24, mass: 0.7 }
const motionQuery = '(prefers-reduced-motion: reduce)'
const subscribeMotionPreference = notify => {
  const query = window.matchMedia(motionQuery)
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}
const readMotionPreference = () => window.matchMedia(motionQuery).matches

export default function ProjectCard({ title, screenshot, number, open, onOpenChange: setOpen }) {
  const reduceMotion = useSyncExternalStore(subscribeMotionPreference, readMotionPreference, () => true)
  const [position, setPosition] = useState(null)
  const [failedScreenshot, setFailedScreenshot] = useState(null)
  const triggerRef = useRef(null)
  const previewRef = useRef(null)
  const pointerType = useRef(null)
  const previewId = useId()
  const showScreenshot = screenshot && failedScreenshot !== screenshot

  // A body portal escapes panel clipping. Fixed coordinates track the trigger
  // without participating in the portfolio's layout or intercepting the pointer.
  useLayoutEffect(() => {
    if (!open) return
    const placePreview = () => {
      const trigger = triggerRef.current.getBoundingClientRect()
      const width = Math.min(280, window.innerWidth - 24)
      const height = previewRef.current?.offsetHeight || 240
      const gap = 12
      let left = trigger.left - width - gap
      let top = trigger.top + trigger.height / 2 - height / 2
      if (left < gap) {
        left = trigger.left + trigger.width / 2 - width / 2
        top = trigger.top - height - gap
        if (top < gap) top = trigger.bottom + gap
      }
      setPosition({
        left: Math.max(gap, Math.min(left, window.innerWidth - width - gap)),
        top: Math.max(gap, Math.min(top, window.innerHeight - height - gap)),
        width,
      })
    }
    placePreview()
    window.addEventListener('resize', placePreview)
    window.addEventListener('scroll', placePreview, true)
    return () => {
      window.removeEventListener('resize', placePreview)
      window.removeEventListener('scroll', placePreview, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const dismissOutside = event => {
      if (!triggerRef.current?.contains(event.target)) setOpen(false)
    }
    const dismissEscape = event => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('keydown', dismissEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('keydown', dismissEscape)
    }
  }, [open, setOpen])

  const image = large => showScreenshot ? (
    <img
      className={large ? 'block aspect-[8/5] w-full object-contain' : 'block h-full w-full object-contain'}
      src={screenshot}
      alt={large ? `${title} project screenshot` : ''}
      width="160"
      height="100"
      onError={() => setFailedScreenshot(screenshot)}
    />
  ) : (
    <div
      className={large ? 'flex aspect-[8/5] items-center justify-center text-[14px]' : 'h-full w-full'}
      role={large ? 'img' : undefined}
      aria-label={large ? `${title} screenshot placeholder` : undefined}
    >{large ? 'Coming soon 𓏲๋࣭࣪˖🪼.ᐟ' : null}</div>
  )

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="flex h-[31px] w-full min-w-0 cursor-default items-center gap-[6px] bg-transparent pl-[10px] text-left text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={`Preview ${title}`}
        aria-describedby={open ? previewId : undefined}
        aria-expanded={open}
        onPointerDown={event => { pointerType.current = event.pointerType }}
        onPointerEnter={event => { if (event.pointerType === 'mouse') setOpen(true) }}
        onPointerLeave={event => {
          if (event.pointerType === 'mouse' && !event.currentTarget.matches(':focus-visible')) setOpen(false)
        }}
        onFocus={() => { if (pointerType.current !== 'touch') setOpen(true) }}
        onBlur={() => { setOpen(false); pointerType.current = null }}
        onClick={event => {
          if (pointerType.current === 'touch' || event.detail === 0) setOpen(value => !value)
        }}
      >
        <span className="section-heading basis-[16px] shrink-0" aria-hidden="true">{String(number).padStart(2, '0')}</span>
        <span className="text-[14px]">{title}</span>
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <div className="pointer-events-none fixed z-[1000] w-[280px] max-w-[calc(100vw-24px)]" style={{ ...position, visibility: position ? 'visible' : 'hidden' }}>
              <motion.figure
                ref={previewRef}
                id={previewId}
                role="tooltip"
                className="m-0 border border-[#e5dfcf] bg-[#fffbed] p-3 pb-4 text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.95 }}
                transition={reduceMotion ? { duration: 0 } : { ...spring, opacity: { duration: 0.16 } }}
              >
                <div className="overflow-hidden bg-[#eeeeee]">{image(true)}</div>
                <figcaption className="mt-3 text-center font-heading text-[16px] font-bold leading-[22px]">{title}</figcaption>
              </motion.figure>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
