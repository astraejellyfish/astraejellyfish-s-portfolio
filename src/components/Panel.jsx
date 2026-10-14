export default function Panel({ title, children, className = '' }) {
  return <section className={`panel inset-panel ${className}`} aria-label={title}>
    <h2 className="panel-label section-heading">{title}</h2>
    {children}
  </section>
}
export function Decoration({ children }) {
  return <p className="decoration text-center" aria-hidden="true">{children}</p>
}
export function NumberedList({ items }) {
  return <ol className="numbered-list">{items.map((item, index) =>
    <li key={`${index}-${item}`}><span className="section-heading" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{item}</span></li>
  )}</ol>
}
