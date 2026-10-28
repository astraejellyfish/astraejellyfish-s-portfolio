import { useEffect, useRef, useState } from 'react'

// Edit these sections when replacing the audio or adding attribution details.
const credits = [
  { title: 'audio', text: 'music cover by certified trash', links: [
    { label: 'youtube: @certifiedtrash', href: 'https://www.youtube.com/@certifiedtrash' },
    { label: 'soundcloud: certified_trash', href: 'https://soundcloud.com/certified_trash' },
  ] },
]

// Storage can be unavailable in private browsing or embedded previews.
function readMusicSession() {
  try { return JSON.parse(sessionStorage.getItem('portfolio-music')) || {} }
  catch { return {} }
}

function saveMusicSession(audio, shouldPlay) {
  try {
    sessionStorage.setItem('portfolio-music', JSON.stringify({ time: audio.currentTime, shouldPlay }))
  } catch { /* Playback still works when storage is unavailable. */ }
}

export default function MusicPlayer() {
  const audioRef = useRef(null)
  const dialogRef = useRef(null)
  const creditsButtonRef = useRef(null)
  const closeButtonRef = useRef(null)
  const shouldPlayRef = useRef(readMusicSession().shouldPlay !== false)
  const resumeTimeRef = useRef(readMusicSession().time)
  const [playing, setPlaying] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const audio = audioRef.current
    let active = true
    let attempt = 0
    audio.volume = 0.25
    const removeRetryListeners = () => {
      document.removeEventListener('pointerdown', retryPlayback)
      document.removeEventListener('keydown', retryPlayback)
    }
    const onPlaying = () => {
      setPlaying(true)
      setError('')
      removeRetryListeners()
    }
    const onPause = () => setPlaying(false)
    const savePosition = () => {
      if (audio.readyState >= 1) saveMusicSession(audio, shouldPlayRef.current)
    }
    const restorePosition = () => {
      const time = resumeTimeRef.current
      if (Number.isFinite(time) && time >= 0 && Number.isFinite(audio.duration)) {
        audio.currentTime = Math.min(time, Math.max(0, audio.duration - 0.1))
      }
    }
    const onError = () => {
      setPlaying(false)
      setError('Music unavailable. Please try again later.')
    }
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)
    audio.addEventListener('loadedmetadata', restorePosition)
    audio.addEventListener('timeupdate', savePosition)
    window.addEventListener('pagehide', savePosition)
    if (audio.readyState >= 1) restorePosition()

    function tryPlayback() {
      const currentAttempt = ++attempt
      audio.play().catch(playError => {
        if (!active || currentAttempt !== attempt || playError.name === 'AbortError') return
        if (playError.name === 'NotAllowedError') {
          document.addEventListener('pointerdown', retryPlayback)
          document.addEventListener('keydown', retryPlayback)
        } else onError()
      })
    }

    function retryPlayback(event) {
      // The player's own controls manage playback directly.
      if (!event.isTrusted || event.target?.closest?.('.music-corner')) return
      if (event.type === 'keydown' && (event.repeat || event.ctrlKey || event.metaKey || event.altKey || !['Enter', ' '].includes(event.key))) return
      if (shouldPlayRef.current && audio.paused) tryPlayback()
    }

    // Sound autoplay still depends on the visitor's browser permissions.
    if (shouldPlayRef.current) tryPlayback()
    return () => {
      active = false
      savePosition()
      removeRetryListeners()
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('loadedmetadata', restorePosition)
      audio.removeEventListener('timeupdate', savePosition)
      window.removeEventListener('pagehide', savePosition)
      audio.pause()
    }
  }, [])

  async function togglePlayback() {
    const audio = audioRef.current
    if (!audio.paused) {
      shouldPlayRef.current = false
      audio.pause()
      saveMusicSession(audio, false)
      return
    }
    shouldPlayRef.current = true
    saveMusicSession(audio, true)
    setPending(true)
    setError('')
    try {
      if (audio.error) audio.load()
      await audio.play()
    } catch (playError) {
      if (audioRef.current === audio && playError.name !== 'AbortError') {
        setPlaying(false)
        setError('Could not play music. Click the record to retry.')
      }
    } finally {
      if (audioRef.current === audio) setPending(false)
    }
  }

  function openCredits() {
    dialogRef.current.showModal()
    closeButtonRef.current.focus()
  }

  return <div className="music-corner">
    <audio ref={audioRef} src={`${import.meta.env.BASE_URL}audio/background.wav`} loop preload="metadata" />
    <button className="vinyl-button" type="button" onClick={togglePlayback} disabled={pending}
      aria-label={playing ? 'Pause background music' : 'Play background music'} aria-pressed={playing} aria-busy={pending}
      title={playing ? 'Pause music' : 'Play music'}>
      <span className={`vinyl-record${playing ? ' is-playing' : ''}`} aria-hidden="true">
        <span className="vinyl-label"><span>♫</span></span>
      </span>
    </button>
    <div className="music-caption">
      <p className="music-status" role="status">{error || (pending ? '♫ loading…' : playing ? 'seventeen - pretty u 8bit' : '♫ click to play')}</p>
      <button type="button" className="credits-link music-toggle" onClick={togglePlayback} disabled={pending}>
        {playing ? '[ pause ]' : '[ play ]'}
      </button>
      <button type="button" className="credits-link" ref={creditsButtonRef} onClick={openCredits} aria-haspopup="dialog">[ credits.txt ]</button>
    </div>
    <dialog className="credits-dialog" ref={dialogRef} aria-labelledby="credits-title" onClose={() => creditsButtonRef.current?.focus()}>
      <div className="credits-titlebar">
        <h2 id="credits-title">credits.txt</h2>
        <button ref={closeButtonRef} type="button" onClick={() => dialogRef.current.close()} aria-label="Close credits">[ x ]</button>
      </div>
      <div className="credits-body">
        {credits.map(({ title, text, links }) => <section key={title}>
          <h3>/{title}</h3>
          <p>{text}</p>
          {links?.map(({ label, href }) => <a key={href} href={href} target="_blank" rel="noopener noreferrer">{label}<span className="sr-only"> (opens in a new tab)</span> ↗</a>)}
        </section>)}
      </div>
    </dialog>
  </div>
}
