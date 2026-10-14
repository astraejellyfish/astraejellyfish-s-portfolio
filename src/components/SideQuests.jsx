import Panel, { Decoration } from './Panel'
// Update these titles, statuses, and icon names as your personal quests evolve.
const quests = [
  { id: 'bass', icon: 'music', title: 'Learning bass guitar', status: 'IN PROGRESS' },
  { id: 'piano', icon: 'piano', title: 'Learning piano', status: 'LEARNING' },
  { id: 'languages', icon: 'languages', title: 'Studying Korean and French', status: 'LEARNING' },
  { id: 'drawing', icon: 'pencil', title: 'Drawing and sketching', status: 'ONGOING' },
  { id: 'photography', icon: 'camera', title: 'Photography', status: 'ONGOING' },
]

const questIcons = {
  music: 'M9 17V5l11-2v12M9 8l11-2M9 17c0 2-6 4-6 1s6-4 6-1M20 15c0 2-6 4-6 1s6-4 6-1',
  piano: 'M3 4h18v16H3zM8 13v7M13 13v7M18 13v7M7 4v9h3V4M14 4v9h3V4',
  languages: 'M3 5h12M9 3v2M5 8c1 4 4 7 8 9M13 5c-1 6-4 10-10 13M14 21l4-10 4 10M16 17h4',
  pencil: 'M4 16L16 4l4 4L8 20l-5 1zM13 7l4 4M4 16l4 4',
  camera: 'M3 7h4l2-3h6l2 3h4v13H3zM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
}

function QuestIcon({ name }) {
  return <svg className="quest-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={questIcons[name]} />
  </svg>
}
const socials = [
  { icon: 'discord', platform: 'Discord', handle: 'astrae.jellyfish', href: 'https://discord.com/users/1338152437868924952' },
  { icon: 'spotify', platform: 'Spotify', handle: 'starkururi', href: 'https://open.spotify.com/user/315lmvfy7v6pk6kl43q63jkw7uhq?si=5c9c0b4c7fc647d9' },
  { icon: 'instagram', platform: 'Instagram', handle: 'astraejellyfish', href: 'https://www.instagram.com/starkururi?obrf=b2Jrd2twbmU2ZmVy' },
  { icon: 'github', platform: 'GitHub', handle: 'astraejellyfish', href: 'https://github.com/astraejellyfish' },
]
export default function SideQuests() {
  return <aside className="panel left-column" aria-label="Personal interests and social profiles">
    <Panel title="side quests" className="quests-panel">
      <ul className="quest-list" aria-label="Personal quests">
        {quests.map(({ id, icon, title, status }) => (
          <li className="quest-row" key={id}>
            <QuestIcon name={icon} />
            <div className="quest-details">
              <p className="quest-title">{title}</p>
              <p className="quest-status">{status}</p>
            </div>
          </li>
        ))}
      </ul>
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
      )}</ul>
      <Decoration>⊹ ࣪ ﹏𓊝﹏𓂁﹏⊹ ࣪ ˖</Decoration>
    </Panel>
  </aside>
}

