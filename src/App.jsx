import Header from './components/Header'
import About from './components/About'
import SideQuests from './components/SideQuests'
import PortfolioDetails from './components/PortfolioDetails'
import FeaturedProjects from './components/FeaturedProjects'
import CreativeWorks from './components/CreativeWorks'
import CaseStudySection from './components/CaseStudySection'
import CaseStudyModal from './components/CaseStudyModal'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import WelcomeScreen from './components/WelcomeScreen'
import useVisitorCount from './hooks/useVisitorCount'

const sectionIds = ['about', 'featured-projects', 'design-art-works', 'case-study']

export default function App() {
  const [welcomeOpen, setWelcomeOpen] = useState(true)
  const [activeSection, setActiveSection] = useState('about')
  const [activeCaseStudy, setActiveCaseStudy] = useState(null)
  const visitorCount = useVisitorCount()
  const portfolioRef = useRef(null)
  const centerColumnRef = useRef(null)
  const clickAudioRef = useRef(null)
  const caseStudyTriggerRef = useRef(null)

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

  const updateActiveSection = useCallback(() => {
    const centerColumn = centerColumnRef.current
    if (!centerColumn) return

    const centerRect = centerColumn.getBoundingClientRect()
    const isCenterScrollable = centerColumn.scrollHeight > centerColumn.clientHeight + 1
    const threshold = isCenterScrollable ? centerRect.top + 40 : 40
    let currentSection = 'about'
    for (const id of sectionIds) {
      const section = document.getElementById(id)
      if (section?.getBoundingClientRect().top <= threshold) currentSection = id
    }
    setActiveSection(currentSection)
  }, [])

  useEffect(() => {
    const centerColumn = centerColumnRef.current
    if (!centerColumn) return
    centerColumn.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('scroll', updateActiveSection, { passive: true })
    updateActiveSection()
    return () => {
      centerColumn.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('scroll', updateActiveSection)
    }
  }, [updateActiveSection])

  const navigateToSection = useCallback((event, id) => {
    event.preventDefault()
    const centerColumn = centerColumnRef.current
    const section = document.getElementById(id)
    if (!centerColumn || !section || !centerColumn.contains(section)) return
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

    if (centerColumn.scrollHeight > centerColumn.clientHeight + 1) {
      const top = section.getBoundingClientRect().top
        - centerColumn.getBoundingClientRect().top
        + centerColumn.scrollTop
      centerColumn.scrollTo({ top, behavior })
    } else {
      section.scrollIntoView({ behavior, block: 'start' })
    }
    setActiveSection(id)
  }, [])

  const openCaseStudy = useCallback((caseStudy, event) => {
    caseStudyTriggerRef.current = event.currentTarget
    setActiveCaseStudy(caseStudy)
  }, [])

  const closeCaseStudy = useCallback(() => {
    setActiveCaseStudy(null)
    window.requestAnimationFrame(() => caseStudyTriggerRef.current?.focus({ preventScroll: true }))
  }, [])

  return <>
  <div className="portfolio-shell" ref={portfolioRef} inert={welcomeOpen}>
    <Header active={!welcomeOpen} onReturnToWelcome={() => setWelcomeOpen(true)} />
    <main className="portfolio-grid" aria-label="astrae.jellyfish portfolio">
      <SideQuests activeSection={activeSection} onNavigate={navigateToSection} />
      <div className="center-column flex min-w-0 flex-col" ref={centerColumnRef} tabIndex={0} aria-label="Main portfolio content">
        <About />
        <FeaturedProjects />
        <CreativeWorks />
        <CaseStudySection onOpenCaseStudy={openCaseStudy} />
        <footer className="panel portfolio-note flex flex-col items-center justify-center text-center">
          <p className="section-heading">Computer Science student</p>
          <p>This space is dedicated for things I build and skills I am still learning.</p>
        </footer>
      </div>
      <PortfolioDetails />
    </main>
  </div>
  <audio ref={clickAudioRef} src={`${import.meta.env.BASE_URL}audio/start.mp3`} preload="auto" />
  {activeCaseStudy && <CaseStudyModal open projectTitle="HIVE" caseStudy={activeCaseStudy} onClose={closeCaseStudy} />}
  {welcomeOpen && <WelcomeScreen portfolioRef={portfolioRef} onComplete={() => setWelcomeOpen(false)} onPlayClick={playClickSound} visitorCount={visitorCount} />}
  </>
}
