import { useState } from 'react'

export default function PortfolioCarousel({
  items,
  label,
  imageClassName,
  renderCaption,
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const item = items[activeIndex]
  const previous = () => setActiveIndex(index => (index - 1 + items.length) % items.length)
  const next = () => setActiveIndex(index => (index + 1) % items.length)

  return <div className="portfolio-carousel" role="region" aria-label={label} aria-roledescription="carousel">
    <figure className="portfolio-slide">
      <div className="carousel-stage">
        <button className="carousel-arrow carousel-previous" type="button" onClick={previous} aria-label={`Previous ${label.toLowerCase()} item`}>
          <img src={`${import.meta.env.BASE_URL}figma/left back button.png`} alt="" />
        </button>
        <div className={`carousel-media ${imageClassName}`}>
          {item.image
            ? <img src={item.image} alt={item.alt || `${item.title} preview`} loading="lazy" decoding="async" />
            : <span className="carousel-unavailable" role="img" aria-label={`${item.title} preview image unavailable`}>preview in development</span>}
        </div>
        <button className="carousel-arrow carousel-next" type="button" onClick={next} aria-label={`Next ${label.toLowerCase()} item`}>
          <img src={`${import.meta.env.BASE_URL}figma/right back button.png`} alt="" />
        </button>
      </div>
      <figcaption className="carousel-caption">{renderCaption(item, activeIndex)}</figcaption>
    </figure>
    <span className="sr-only" aria-live="polite" aria-atomic="true">{activeIndex + 1} of {items.length}: {item.title}</span>
  </div>
}
