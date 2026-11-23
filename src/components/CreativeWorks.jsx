import Panel from './Panel'
import PortfolioCarousel from './PortfolioCarousel'

const works = [
  { file: 'design1 (5).png', title: 'SIP BOOK (Commissioned)' },
  { file: 'design1 (1).jpg', title: 'Coffee Painting (Commissioned)' },
  { file: 'design1 (3).jpg', title: 'Three-story residential plan' },
  { file: 'design1 (4).jpg', title: 'Character illustration' },
  { file: 'design1 (6).png', title: 'CRLA Report 2025–2026 (Commissioned)' },
  { file: 'design1 (7).png', title: 'Globalization infographic' },
].map(({ file, title }) => ({
  image: `${import.meta.env.BASE_URL}images/projects/${file}`,
  title,
}))

export default function CreativeWorks() {
  return <section id="design-art-works" className="creative-works-section" aria-label="Creative works">
    <Panel title="design/art works" className="portfolio-carousel-panel creative-carousel-panel">
      <PortfolioCarousel
        items={works}
        label="Creative works"
        imageClassName="creative-carousel-image"
        renderCaption={work => <h3 className="carousel-art-title">{work.title}</h3>}
      />
      <p className="creative-tools">canva · figma · other works</p>
    </Panel>
  </section>
}
