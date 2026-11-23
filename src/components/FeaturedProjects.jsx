import Panel from './Panel'
import PortfolioCarousel from './PortfolioCarousel'
import { projects } from '../data/projects'

function ProjectCaption({ project }) {
  const { title, description, status, role, liveUrl } = project
  const statusClass = status === 'online' ? 'status-online' : status === 'in development' ? 'status-in-development' : ''

  return <>
    <h3 className="carousel-title section-heading">{title}</h3>
    <p className="carousel-description">{description}</p>
    <p className="carousel-role">{role}</p>
    <p className="carousel-status">
      <span className={`status-indicator ${statusClass}`} aria-hidden="true" />
      status: {status}
      {liveUrl && <a className="project-live-link" href={liveUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${title} on Vercel (opens in a new tab)`}>↗</a>}
    </p>
  </>
}

export default function FeaturedProjects() {
  return <section id="featured-projects" className="featured-projects-section" aria-label="Featured projects">
    <Panel title="featured projects" className="portfolio-carousel-panel project-carousel-panel">
      <PortfolioCarousel
        items={projects}
        label="Featured projects"
        imageClassName="project-carousel-image"
        renderCaption={project => <ProjectCaption project={project} />}
      />
    </Panel>
  </section>
}
