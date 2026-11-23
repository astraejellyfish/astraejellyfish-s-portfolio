import { useEffect, useRef, useState } from 'react'

const loadTimeoutMs = 20000

export default function DocumentViewer({ document: documentConfig, title }) {
  const [status, setStatus] = useState('loading')
  const timeoutRef = useRef(null)
  const url = documentConfig?.url
  const type = documentConfig?.type
  const supported = type === 'pdf' || type === 'google-slides'

  useEffect(() => {
    if (!supported || !url) {
      setStatus(type === 'unavailable' || !url ? 'unavailable' : 'error')
      return undefined
    }

    setStatus('loading')
    timeoutRef.current = window.setTimeout(() => setStatus('error'), loadTimeoutMs)
    return () => window.clearTimeout(timeoutRef.current)
  }, [supported, type, url])

  if (!url || type === 'unavailable') {
    return <div className="document-unavailable" role="status">
      <h3>Document unavailable</h3>
      <p>{documentConfig?.message || 'No PDF or Google Slides embed is configured for this case study yet.'}</p>
    </div>
  }

  if (!supported) {
    return <div className="document-error" role="alert">
      <h3>Unsupported document type</h3>
      <p>Configure this case study with a PDF or Google Slides embed URL.</p>
    </div>
  }

  const finishLoading = () => {
    window.clearTimeout(timeoutRef.current)
    setStatus('loaded')
  }
  const failLoading = () => {
    window.clearTimeout(timeoutRef.current)
    setStatus('error')
  }

  return <div className="document-viewer" aria-busy={status === 'loading'}>
    {status === 'loading' && <p className="document-loading" role="status">Loading {type === 'pdf' ? 'PDF' : 'Google Slides'}…</p>}
    {status === 'error' && <div className="document-error" role="alert">
      <h3>Unable to load the embedded document</h3>
      <p>It may be unavailable or require public viewing access. You can try opening the configured document separately.</p>
      <a href={url} target="_blank" rel="noopener noreferrer">Open document in a new tab ↗</a>
    </div>}
    <iframe
      className={`document-frame${status === 'error' ? ' is-failed' : ''}`}
      src={url}
      title={`${title} ${type === 'pdf' ? 'PDF' : 'Google Slides presentation'}`}
      onLoad={finishLoading}
      onError={failLoading}
      allowFullScreen={type === 'google-slides'}
    />
    {status === 'loaded' && <p className="document-fallback">If the embedded document is blank or asks for access, <a href={url} target="_blank" rel="noopener noreferrer">open it separately ↗</a>.</p>}
  </div>
}
