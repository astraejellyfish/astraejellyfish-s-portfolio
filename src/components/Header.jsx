import NyanCat from './NyanCat'

export default function Header() {
  return <header className="panel portfolio-header grid items-center">
    <h1 className="outlined-heading" aria-label="astrae.jellyfish">astraejellyfish</h1>
    <NyanCat />
    <p className="header-status"><span aria-hidden="true">✳</span> exploring the internet</p>
  </header>
}
