import Panel, { Decoration } from './Panel'
const socials = [
  { icon: 'discord', platform: 'Discord', handle: 'astrae.jellyfish', href: 'https://discord.com/users/1338152437868924952' },
  { icon: 'spotify', platform: 'Spotify', handle: 'starkururi', href: 'https://open.spotify.com/user/315lmvfy7v6pk6kl43q63jkw7uhq?si=5c9c0b4c7fc647d9' },
  { icon: 'instagram', platform: 'Instagram', handle: 'starkururi', href: 'https://www.instagram.com/starkururi?obrf=b2Jrd2twbmU2ZmVy' },
  { icon: 'github', platform: 'GitHub', handle: 'astraejellyfish', href: 'https://github.com/astraejellyfish' },
  { icon: 'gmail', platform: 'Gmail', handle: 'parazoshaine.commission@gmail.com', href: 'mailto:parazoshaine.commission@gmail.com' },
]
const navigation = [
  { id: 'about', label: '/about.exe' },
  { id: 'featured-projects', label: '/featured_projects.exe' },
  { id: 'design-art-works', label: '/design/art.works' },
  { id: 'case-study', label: '/case.study' },
]

export default function SideQuests({ activeSection, onNavigate }) {
  return <aside className="panel left-column" aria-label="Portfolio navigation and social profiles">
    <Panel title="navigation" className="navigation-panel">
      <nav aria-label="Portfolio sections">
        <ol className="numbered-list navigation-list">
          {navigation.map(({ id, label }, index) => (
            <li key={id}>
              <a
                className="navigation-link"
                href={`#${id}`}
                aria-current={activeSection === id ? 'location' : undefined}
                onClick={event => onNavigate(event, id)}
              >
                <span className="section-heading" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span>{label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <Decoration>⋅˚₊‧ ଳ⋆.ೃ࿔*:･</Decoration>
    </Panel>
    <Panel title="let’s connect!" className="social-panel">
      <ul className="social-list">{socials.map(({ icon, platform, handle, href }) =>
        <li key={platform}>
          <a className="external-row" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${platform}: ${handle} (opens in a new tab)`}>
            <img src={`/figma/${icon}.png`} width="34" height="29" alt="" />
            <span className="external-label">{handle}</span>
            <span className="external-arrow" aria-hidden="true">↗</span>
          </a>
        </li>
      )}
      </ul>
      <Decoration>⊹ ࣪ ﹏𓊝﹏𓂁﹏⊹ ࣪ ˖</Decoration>
    </Panel>
  </aside>
}

