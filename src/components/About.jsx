import Currently from './Currently'
const likes = ['drawing', 'music', 'learning new things', 'lowercase letters', 'jellyfish', 'kopi']
export default function About() {
  return <section className="panel about-panel" aria-labelledby="about-heading">
    <div className="about-intro grid items-start">
      <img className="profile-image" src="/figma/profile.png" width="162" height="162" alt="Black and white illustrated portrait with bright green accents" />
      <div className="about-copy min-w-0">
        <h2 id="about-heading" className="section-heading">a little about me</h2>
        <p className="bio">i am a computer science student interested in building fun stuffs, exploring technology, and finding some exciting way to make technology fun. i’m also into indie and retro stuffs.....</p>
        <h3 className="section-heading likes-heading">likes</h3>
        <ul className="likes-list grid">{likes.map(like => <li key={like} className="flex items-center"><img src="/figma/star.png" width="17" height="15" alt="" />{like}</li>)}</ul>
      </div>
    </div>
    <Currently />
  </section>
}
