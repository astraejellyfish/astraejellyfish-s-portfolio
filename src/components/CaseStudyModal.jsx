import { useEffect, useRef } from 'react'
import DocumentViewer from './DocumentViewer'

export default function CaseStudyModal({ open, projectTitle, caseStudy, onClose }) {
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      closeButtonRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const body = document.body
    const root = document.documentElement
    const centerColumn = document.querySelector('.center-column')
    const previousBodyOverflow = body.style.overflow
    const previousRootOverflow = root.style.overflow
    const previousPaddingRight = body.style.paddingRight
    const previousCenterOverflowY = centerColumn ? centerColumn.style.overflowY : ''
    const scrollbarWidth = window.innerWidth - root.clientWidth

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + scrollbarWidth}px`
    }
    body.style.overflow = 'hidden'
    root.style.overflow = 'hidden'
    if (centerColumn) centerColumn.style.overflowY = 'hidden'

    return () => {
      body.style.overflow = previousBodyOverflow
      root.style.overflow = previousRootOverflow
      body.style.paddingRight = previousPaddingRight
      if (centerColumn) centerColumn.style.overflowY = previousCenterOverflowY || ''
    }
  }, [open])

  return <dialog
    ref={dialogRef}
    className="case-study-modal"
    aria-labelledby="case-study-modal-title"
    onClick={event => {
      if (event.target === dialogRef.current) dialogRef.current.close()
    }}
    onClose={onClose}
  >
    <header className="case-study-modal-header">
      <h2 id="case-study-modal-title">{projectTitle} / case.study</h2>
      <button ref={closeButtonRef} type="button" className="case-study-modal-close" onClick={() => dialogRef.current.close()} aria-label="Close case study">
        [ x ]
      </button>
    </header>
    <div className="case-study-modal-content">
      <DocumentViewer document={caseStudy.document} title={`${projectTitle} case study`} />
    </div>
  </dialog>
}
