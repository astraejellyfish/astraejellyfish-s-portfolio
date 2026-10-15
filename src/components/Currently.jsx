const activities = [
  ['studying', 'computer science'], ['building', 'school projects'],
  ['learning', 'new technologies'], ['creating', 'arts'],
  ['exploring', 'korean · french · music'],
]
import BarcodeDecoration from './BarcodeDecoration'

export default function Currently() {
  return <section className="currently" aria-labelledby="currently-heading">
    <h2 id="currently-heading" className="section-heading">currently</h2>
    <div className="currently-content">
      <dl>{activities.map(([label, value]) => <div key={label} className="grid"><dt>{label}:</dt><dd>{value}</dd></div>)}</dl>
      <BarcodeDecoration />
    </div>
  </section>
}
