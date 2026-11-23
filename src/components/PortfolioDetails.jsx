import { useState } from 'react'
import Panel, { Decoration } from './Panel'
import ProjectCard from './ProjectCard'
import DecorativeSticker from './DecorativeSticker'
import MusicPlayer from './MusicPlayer'

const certificates = [
  {
    title: 'National Certificate III in Visual Graphic Design',
    image: `${import.meta.env.BASE_URL}images/NC%20II.png`,
  },
  {
    title: 'Cisco Networking Academy CSS Essentials',
    image: `${import.meta.env.BASE_URL}images/css-essentials.png`,
  },
  {
    title: 'Cisco Networking Academy HTML Essentials',
    image: `${import.meta.env.BASE_URL}images/html-essentials.png`,
  },
]

export default function PortfolioDetails() {
  const [activeCertificate, setActiveCertificate] = useState(null)

  const changePreview = (title, value) => {
    setActiveCertificate(current => {
      const next = typeof value === 'function' ? value(current === title) : value
      return next ? title : current === title ? null : current
    })
  }

  return <aside className="panel right-column" aria-label="Certificates and creative interests">
    <Panel title="certificates" className="certificates-panel">
      <ol className="certificate-list" aria-label="Certificates">
        {certificates.map(({ title, image }, index) => (
          <li key={`${title}-${index}`}>
            <ProjectCard
              title={title}
              screenshot={image}
              number={index + 1}
              open={activeCertificate === `${title}-${index}`}
              onOpenChange={value => changePreview(`${title}-${index}`, value)}
              className="certificate-preview"
              previewUnavailableText="Certificate image unavailable"
            />
          </li>
        ))}
      </ol>
      <Decoration>⡞⠳⣄⣀⣠⠞⢷ ֹ۪</Decoration>
    </Panel>
    <div className="decorative-images flex justify-between" aria-hidden="true">
      <DecorativeSticker className="panel cat-frame" src={`${import.meta.env.BASE_URL}figma/cat.gif`} width={1080} height={1080} tilt={-4} />
      <DecorativeSticker className="panel character-frame" src={`${import.meta.env.BASE_URL}figma/neon-character.png`} width={1024} height={1280} tilt={4} />
    </div>
    <MusicPlayer />
  </aside>
}
