import Header from './components/Header'
import About from './components/About'
import SideQuests from './components/SideQuests'
import FeaturedProjects from './components/FeaturedProjects'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import WelcomeScreen from './components/WelcomeScreen'

export default function App() {
  const [welcomeOpen, setWelcomeOpen] = useState(true)
  const portfolioRef = useRef(null)
  const clickAudioRef = useRef(null)

  useEffect(() => {
    const audio = clickAudioRef.current
    audio.volume = 0.15
    return () => audio.pause()
  }, [])

  const playClickSound = useCallback(() => {
    const audio = clickAudioRef.current
    audio.pause()
    audio.currentTime = 0
    audio.play().catch(() => {})
  }, [])

  useLayoutEffect(() => {
    if (welcomeOpen) return
    portfolioRef.current.querySelector('.portfolio-title').focus({ preventScroll: true })
  }, [welcomeOpen])

  return <>
  <div className="portfolio-shell" ref={portfolioRef} inert={welcomeOpen}>
    <Header active={!welcomeOpen} onReturnToWelcome={() => setWelcomeOpen(true)} />
    <main className="portfolio-grid" aria-label="astrae.jellyfish portfolio">
      <SideQuests />
      <div className="center-column flex min-w-0 flex-col">
        <About />
        <footer className="panel portfolio-note flex flex-col items-center justify-center text-center">
          <p className="section-heading">Computer Science student with too many side quests</p>
          <p>This space is dedicated for things I build and skills I am still learning.</p>
        </footer>
      </div>
      <FeaturedProjects />
    </main>
  </div>
  <audio ref={clickAudioRef} src={`${import.meta.env.BASE_URL}audio/start.mp3`} preload="auto" />
  {welcomeOpen && <WelcomeScreen portfolioRef={portfolioRef} onComplete={() => setWelcomeOpen(false)} onPlayClick={playClickSound} />}
  </>
}
