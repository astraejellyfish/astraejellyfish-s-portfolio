import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import TypewriterDialogue from './TypewriterDialogue'
import VisitorCounter from './VisitorCounter'
import './WelcomeScreen.css'

const welcomeText = 'hm...? a visitor? oh! welcome. click start to explore! (˶>⤙<˶)'
const exitText = 'leaving already? (╥﹏╥)'
const motionQuery = '(prefers-reduced-motion: reduce)'
const subscribeMotion = notify => {
  const query = window.matchMedia(motionQuery)
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}
const readMotion = () => window.matchMedia(motionQuery).matches
const startPressDuration = 120

export default function WelcomeScreen({ portfolioRef, onComplete, onPlayClick, visitorCount = null }) {
  const reduceMotion = useSyncExternalStore(subscribeMotion, readMotion, () => true)
  const [leaving, setLeaving] = useState(false)
  const [pressing, setPressing] = useState(false)
  const [dialogue, setDialogue] = useState({ text: welcomeText, revision: 0 })
  const screenRef = useRef(null)
  const startRef = useRef(null)
  const activatedRef = useRef(false)
  const finishedRef = useRef(false)
  const completeRef = useRef(onComplete)

  useLayoutEffect(() => {
    completeRef.current = onComplete
  }, [onComplete])

  useLayoutEffect(() => {
    const body = document.body
    const root = document.documentElement
    const previousOverflow = body.style.overflow
    const previousRootOverflow = root.style.overflow
    const previousPadding = body.style.paddingRight
    const scrollbarWidth = window.innerWidth - root.clientWidth
    if (scrollbarWidth > 0) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + scrollbarWidth}px`
    body.style.overflow = 'hidden'
    root.style.overflow = 'hidden'
    startRef.current.focus({ preventScroll: true })
    return () => {
      body.style.overflow = previousOverflow
      root.style.overflow = previousRootOverflow
      body.style.paddingRight = previousPadding
    }
  }, [portfolioRef])

  function finish() {
    if (finishedRef.current) return
    finishedRef.current = true
    completeRef.current()
  }

  useEffect(() => {
    if (!pressing) return
    const timer = window.setTimeout(() => {
      setPressing(false)
      setLeaving(true)
    }, reduceMotion ? 0 : startPressDuration)
    return () => window.clearTimeout(timer)
  }, [pressing, reduceMotion])

  useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(() => {
      if (finishedRef.current) return
      finishedRef.current = true
      completeRef.current()
    }, reduceMotion ? 0 : 1500)
    return () => window.clearTimeout(timer)
  }, [leaving, reduceMotion])

  function start() {
    if (activatedRef.current) return
    activatedRef.current = true
    onPlayClick()
    if (reduceMotion) finish()
    else setPressing(true)
  }

  function toggleExit() {
    if (activatedRef.current) return
    setDialogue(current => ({
      text: current.text === exitText ? welcomeText : exitText,
      revision: current.revision + 1,
    }))
    onPlayClick()
  }

  function trapFocus(event) {
    if (event.key !== 'Tab') return
    const controls = [...screenRef.current.querySelectorAll('button:not(:disabled), [tabindex="0"]')]
    const currentIndex = controls.indexOf(document.activeElement)
    const nextIndex = (currentIndex + (event.shiftKey ? -1 : 1) + controls.length) % controls.length
    event.preventDefault()
    controls[nextIndex]?.focus({ preventScroll: true })
  }

  return <div
    className={`welcome-screen${leaving ? ' is-leaving' : ''}${pressing ? ' is-pressing' : ''}`}
    style={{ '--welcome-press-duration': `${startPressDuration}ms` }}
    role="dialog" aria-modal="true" aria-label="Welcome to astraejellyfish"
    ref={screenRef} onKeyDown={trapFocus}
  >
    <div className="welcome-dimmer" aria-hidden="true" />
    <VisitorCounter count={visitorCount} />
    <div className="welcome-down" onTransitionEnd={event => {
      if (event.target === event.currentTarget && event.propertyName === 'transform' && activatedRef.current) finish()
    }}>
      <div className="welcome-black" aria-hidden="true" />
      <div className="welcome-stage">
        <div className="welcome-avatar" aria-hidden="true">
          <img src={`${import.meta.env.BASE_URL}images/welcome-avatar.gif`} width="64" height="64" alt="" draggable="false" />
        </div>
        <TypewriterDialogue key={dialogue.revision} text={dialogue.text} reduceMotion={reduceMotion} soundEnabled={!pressing && !leaving} />
        <div className="welcome-actions">
          <button className="welcome-action welcome-exit" type="button" disabled={pressing || leaving} onClick={toggleExit}>
            <img src={`${import.meta.env.BASE_URL}figma/welcome-exit.png`} width="36" height="32" alt="" />
            <span>{dialogue.text === exitText ? 'STAY?' : 'EXIT'}</span>
          </button>
          <button className="welcome-action welcome-start" type="button" ref={startRef} aria-disabled={pressing || leaving} onClick={start}>
            <img src={`${import.meta.env.BASE_URL}figma/welcome-start.png`} width="35" height="35" alt="" />
            <span>START</span>
          </button>
        </div>
      </div>
    </div>
  </div>
}
