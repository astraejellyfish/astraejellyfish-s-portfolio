import Header from './components/Header'
import About from './components/About'
import SideQuests from './components/SideQuests'
import FeaturedProjects from './components/FeaturedProjects'

export default function App() {
  return <div className="portfolio-shell">
    <Header />
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
}
