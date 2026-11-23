import { hiveCaseStudy } from '../data/projects'

export default function CaseStudySection({ onOpenCaseStudy }) {
  return <section id="case-study" className="panel case-study-section" aria-labelledby="case-study-heading">
    <h2 id="case-study-heading" className="section-heading">case study</h2>
    <img className="case-study-preview" src={`${import.meta.env.BASE_URL}images/case study.png`} alt="HIVE project interface preview" loading="lazy" decoding="async" />
    <h3 className="case-study-section-title">{hiveCaseStudy.title}</h3>
    <div className="case-study-section-copy">
      {hiveCaseStudy.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    </div>
    <button className="case-study-action" type="button" onClick={event => onOpenCaseStudy(hiveCaseStudy, event)} aria-haspopup="dialog">
      VIEW CASE STUDY
    </button>
  </section>
}
