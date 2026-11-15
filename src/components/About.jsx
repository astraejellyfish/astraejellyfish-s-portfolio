import Currently from './Currently'
const likes = ['drawing', 'music', 'learning new things', 'lowercase letters', 'jellyfish', 'pixels']
export default function About() {
  return <section className="panel about-panel" aria-labelledby="about-heading">
    <div className="about-intro grid items-start">
      <img className="profile-image" src="/figma/profile.png" width="162" height="162" />
      <div className="about-copy min-w-0">
        <h2 id="about-heading" className="section-heading">a little about me</h2>
        <p className="bio">i am a computer science student interested in building fun stuffs, exploring technology, and currently building sprite sheets and tilesets for a personal project. i’m also into indie and retro stuffs.....</p>
        <h3 className="section-heading likes-heading">likes</h3>
        <ul className="likes-list grid">{likes.map(like => <li key={like} className="flex items-center"><img src="/figma/star.png" width="17" height="15" alt="" />{like}</li>)}</ul>
      </div>
    </div>
    <Currently />
  </section>
}
