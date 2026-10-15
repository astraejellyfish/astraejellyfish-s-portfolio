import Panel, { Decoration } from './Panel'
import ProjectCard from './ProjectCard'
import { useState } from 'react'

const projects = [
  { title: 'Class Connect', screenshot: '/images/projects/classconnect.png' },
  { title: 'Tamagotchi Pet', screenshot: '/images/projects/tamagotchi.jpg' },
  { title: 'Mini logs', screenshot: null },
]

export default function FeaturedProjects() {
  const [activeProject, setActiveProject] = useState(null)
  const changePreview = (title, value) => {
    setActiveProject(current => {
      const next = typeof value === 'function' ? value(current === title) : value
      return next ? title : current === title ? null : current
    })
  }
  return <aside className="panel right-column" aria-label="Programming projects and case study">
    <Panel title="featured projects" className="projects-panel">
      <ol className="h-[93px]" aria-label="Featured programming projects">
        {projects.map((project, index) => (
          <li key={project.title} className="h-[31px] min-w-0 bg-[url('/figma/row-line.svg')] bg-size-[100%_1px] bg-position-[left_bottom] bg-no-repeat">
            <ProjectCard {...project} number={index + 1} open={activeProject === project.title} onOpenChange={value => changePreview(project.title, value)} />
          </li>
        ))}
      </ol>
      <Decoration>⡞⠳⣄⣀⣠⠞⢷ ֹ۪</Decoration>
    </Panel>
    <Panel title="case study" className="case-panel">
      <ol className="numbered-list">
        <li>
          <ProjectCard
            title="HIVE"
            number={1}
            screenshot="/images/hive.png"
            open={activeProject === 'HIVE'}
            onOpenChange={value => changePreview('HIVE', value)}
            href="https://drive.google.com/drive/folders/1cC_yCdrjm0h0rCwg2EuW6Q7Z2yNyefM3"
          />
        </li>
      </ol>
      <Decoration>⋆｡𖦹°⭒˚｡⋆ ✮⋆˙</Decoration>
    </Panel>
    <div className="decorative-images flex justify-between" aria-hidden="true">
      <div className="panel cat-frame"><img src="/figma/cat.png" alt="" width="118" height="118" /></div>
      <div className="panel character-frame flex items-center justify-center"><img src="/figma/katsuki.png" alt="" width="63" height="63" /></div>
    </div>
  </aside>
}

