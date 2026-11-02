import NyanCat from './NyanCat'

const title = 'astraejellyfish'

export default function Header({ active, onReturnToWelcome }) {
  return <header className="panel portfolio-header grid items-center">
    <h1 className="portfolio-heading" aria-label={title}>
      <button
        className={`portfolio-title${active ? ' is-typing' : ''}`}
        type="button" onClick={onReturnToWelcome}
        aria-label="astraejellyfish — return to welcome screen"
        aria-haspopup="dialog"
      >
        <span aria-hidden="true">
          {Array.from(title).map((character, index) => <span className="title-character" key={index} style={{ '--character-index': index + 1 }}>{character}</span>)}
        </span>
      </button>
    </h1>
    <NyanCat />
    <p className="header-status"><span aria-hidden="true">✳</span> exploring the internet</p>
  </header>
}
