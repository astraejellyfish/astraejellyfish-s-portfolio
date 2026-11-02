import { useEffect, useId, useRef, useState } from 'react'

export default function TypewriterDialogue({ text, reduceMotion, soundEnabled = true }) {
  const [visible, setVisible] = useState(0)
  const [skipped, setSkipped] = useState(false)
  const textId = useId()
  const typingAudioRef = useRef(null)
  const kaomojiStart = text.lastIndexOf('(')
  const characters = Array.from(text.slice(0, kaomojiStart))
  const kaomoji = text.slice(kaomojiStart)
  const complete = reduceMotion || skipped || visible > characters.length

  useEffect(() => {
    if (complete || !soundEnabled) return
    const audio = typingAudioRef.current
    let active = true
    let pending = false
    audio.volume = 0.08

    function removeRetryListeners() {
      document.removeEventListener('pointerdown', retryPlayback)
      document.removeEventListener('keydown', retryPlayback)
    }

    function retryPlayback(event) {
      if (!event.isTrusted) return
      if (event.type === 'keydown' && (event.repeat || event.ctrlKey || event.metaKey || event.altKey || !['Enter', ' '].includes(event.key))) return
      play()
    }

    function play() {
      if (!active || pending || !audio.paused) return
      pending = true
      audio.play().then(() => {
        pending = false
        removeRetryListeners()
      }).catch(error => {
        pending = false
        if (!active || error.name !== 'NotAllowedError') return
        document.addEventListener('pointerdown', retryPlayback)
        document.addEventListener('keydown', retryPlayback)
      })
    }

    play()
    return () => {
      active = false
      removeRetryListeners()
      audio.pause()
      audio.currentTime = 0
    }
  }, [complete, soundEnabled])

  useEffect(() => {
    if (reduceMotion || skipped) return
    const startedAt = performance.now()
    const timer = window.setInterval(() => {
      const next = Math.min(characters.length + 1, Math.floor((performance.now() - startedAt) / 32))
      setVisible(next)
      if (next > characters.length) window.clearInterval(timer)
    }, 32)
    return () => window.clearInterval(timer)
  }, [characters.length, reduceMotion, skipped])

  return <>
  <audio ref={typingAudioRef} src={`${import.meta.env.BASE_URL}audio/typing-sounds.mp3`} loop preload="auto" />
  <button
    className="welcome-bubble" type="button"
    aria-label={complete ? 'Dialogue complete' : 'Skip typing animation'}
    aria-describedby={textId}
    onClick={() => setSkipped(true)}
  >
    <span className="welcome-bubble-art" aria-hidden="true">
      <img src={`${import.meta.env.BASE_URL}figma/welcome-bubble.png`} alt="" />
    </span>
    <span className="welcome-dialogue" aria-hidden="true">
      {characters.map((character, index) => <span key={index} style={{ visibility: complete || index < visible ? 'visible' : 'hidden' }}>{character}</span>)}
      <span className="welcome-kaomoji" style={{ visibility: complete ? 'visible' : 'hidden' }}>{kaomoji}</span>
    </span>
    <span className="sr-only" id={textId}>{text}</span>
  </button>
  </>
}
