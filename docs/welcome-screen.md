# Welcome screen

Reference: [Figma Frame 5, 121:217](https://www.figma.com/design/pKZqO1T0fADDFT5ovHPdfV/Portfolio?node-id=121-217), 1366 × 770.

Run `npm run dev` to review locally. Every document load mounts the welcome screen. START dismisses it without using storage. Clicking the portfolio title, or activating it with Enter or Space, reopens a fresh welcome screen without reloading or remounting the portfolio. The avatar, dialogue, counter, buttons, and dimmer return to their initial state, and the original dialogue types again. EXIT changes the dialogue to `leaving already? (╥﹏╥)` and becomes STAY?. STAY? restores the original welcome dialogue and EXIT label. Each activation restarts typing while keeping welcome open and START available. Click or keyboard-activate the bubble to complete typing. Reduced motion disables typing and dismisses immediately on START.

## Portfolio interactions

START immediately plays the supplied `public/audio/start.mp3` at 15% volume, then runs the existing 120 ms pixel press, moving the button down 3 px with a subtle green highlight before starting the existing 750 ms downward group slide, upward counter slide, and overlay fade together. Repeat activations are ignored during the press and exit. The click audio stays mounted in App so it can finish after welcome closes. Reduced motion skips the press and transition; changing the preference while an interaction is running also completes promptly.

After the welcome screen exits, the title reveals one character every 65 ms, once per START. CSS visibility keeps all characters in the layout throughout the reveal, preserving the title's size and position. The accessible name is available immediately. Reduced motion shows the complete title immediately. Reopening welcome removes the typing animation so the next START replays it.

The title is a native button within the heading, with inherited typography, a pointer cursor, a subtle dark hover color, and a keyboard-only underline for focus. The title has no border, outline, or box shadow. Focus moves to START when welcome opens and returns to the title when it closes. The header and heading use opaque white backgrounds, the existing dashed border, and filled dark gray text without a stroke on desktop and mobile.

The portfolio, Nyan Cat, music player, project controls, and barcode remain mounted during return visits. EXIT/STAY? reuses the same app-owned click audio as START. Each activation pauses and rewinds that instance before playing. Audio errors do not interrupt the dialogue toggle. Changing the dialogue remounts the existing typewriter component, which clears its previous interval and stops its typing recording. The session-counter controller is owned by the document, outside welcome, so these interactions do not create visits. See the counter configuration below.

While the welcome, EXIT, or STAY? dialogue types, `TypewriterDialogue` plays `public/audio/typing-sounds.mp3` as one continuous looping recording at 8% volume. It does not restart per character. Completion, skipping, replacement, START, reduced motion, and unmounting all stop the recording and remove permission-retry listeners. If autoplay is denied, a trusted pointer or Enter/Space interaction retries playback only while that dialogue is still typing. Other playback errors are handled quietly.

The original GIF is a transparent 64 × 64 canvas with nine frames. Its canvas is scaled uniformly inside the same cropped avatar slot as Figma; the source file is unchanged. Bubble and button artwork were downloaded from Figma. The counter SVG supplied in `public/images/visitor-counter.svg` contains only footprints, so it needs no numeric edits. Original Figma border pieces surround an expandable HTML number.

## Music

The existing MusicPlayer remains mounted under the welcome screen and retains its existing behavior: attempt background playback at 25% volume, remember the listener's choice and playback position, and retry on a permitted interaction if browser autoplay is blocked. Typing and click effects use independent audio elements and never pause, rewind, or restart this player. Browsers may require an interaction before audible music can play; automatic sound on every fresh visit cannot be guaranteed. A saved pause preference remains respected.

The `credits.txt` popup renders the hardcoded `credits` array in `src/components/MusicPlayer.jsx`; it does not load a text file. Each credit section must be a top-level array entry. Its `links` contain only labeled URLs; formatted attribution can use the optional `attribution` field. The sound-effect sections were previously nested inside the music section's links and were therefore omitted by the link renderer. They now render alongside the existing music credit, and the supplied Pixabay HTML attribution is represented as text and real links rather than an invalid URL. The original attribution wording, source URLs, and popup styling are retained.

## Shared session visitor count

The approved implementation counts sessions with 30-minute server-side inactivity expiry, not page views. Refreshes, new tabs, Strict Mode, and welcome interactions do not increment an active session. The existing footprint, tooltip, zero padding, and `----` fallback are retained. The separate Worker is deployed, and the approved GitHub Pages workflow enables the public endpoint for production builds. See [visitor-counter setup and deployment verification](visitor-counter.md).

## Local verification

- `npm run build`: passed.
- `npm run lint`: passed, no warnings.
- Sound/title checks (`node tmp-screens/welcome-check.mjs --sounds-only`) passed: both supplied MP3s decoded, all three dialogues played continuous quiet typing audio, autoplay denial retried on a trusted interaction, completion/skip/replacement stopped typing, rapid toggles never overlapped typing recordings, duplicate START activated one sound, and that sound finished after welcome unmounted. Active vinyl music kept advancing with no extra play/pause calls. Original credits, reduced motion, repeat welcome visits, blocked-audio fallback, and mobile layout passed. The title has no border/outline/shadow, retains the white/dashed header, and shows an underline for keyboard focus. Review captures: `tmp-screens/welcome-sound-title-focus.png` and `tmp-screens/welcome-sound-title-mobile.png`.
- EXIT/STAY? checks (`node tmp-screens/welcome-check.mjs --exit-only`) passed: original and alternate dialogue, mouse/Space/Enter activation, 20 rapid toggles with at most one typing interval, one low-volume click sound restarted per activation, audio-unavailable fallback, reduced motion, START from either dialogue, title reopening reset, 390 px/320 px button fit, timer/audio cleanup, retained portfolio/music state, and no navigation or counter/API calls.
- Interaction browser checks passed: a 3 px START press precedes all three exit transitions; the title types once after each START without changing its rectangle; mouse, Enter, and Space reopen welcome with its original dialogue; the same portfolio and paused audio nodes stay mounted; no navigation or counter/API request occurs during return cycles. The title remains filled and the header stays opaque white across all sizes below. Reduced motion shows both the dialogue and title immediately and allows repeated return/START cycles.
- Credits browser checks passed: opened, closed, and reopened the popup without navigation. All three sections, the original music credit, both sound-effect credits, and the supplied source links were present. Every credit link had an HTTPS URL rather than pasted HTML. The popup stylesheet was unchanged; a review capture is saved as `tmp-screens/welcome-credits-fixed.png`.
- Headless Edge checked fresh loads and refresh, EXIT dialogue, skipping typing, atomic kaomoji reveal, focus trapping/restoration, keyboard START, duplicate START protection, tooltip, reduced motion, simultaneous opposite slide directions and overlay fade. The downward group reached 770px on a 770px viewport at transition end; the portfolio rectangle stayed unchanged throughout.
- Responsive checks: 1366 × 770, 1024 × 768, 768 × 1024, 390 × 844, 320 × 568, 844 × 390, and 568 × 320. No horizontal overflow or dialogue/button overlap; START/EXIT targets are at least 44px high.
- Review captures and the disposable browser script are in ignored `tmp-screens/welcome-*` files. These welcome checks do not certify other browsers. Separate backend deployment checks are recorded in [the visitor-counter documentation](visitor-counter.md).

## Files added or changed for this implementation

- Modified: `src/App.jsx`.
- Portfolio interaction updates: `src/components/Header.jsx`, `src/index.css`, and the existing welcome screen component/styles. `src/App.jsx` controls reopening welcome and restoring focus without remounting the portfolio.
- Added components/styles: `src/components/WelcomeScreen.jsx`, `src/components/WelcomeScreen.css`, `src/components/TypewriterDialogue.jsx`, `src/components/VisitorCounter.jsx`.
- Downloaded original Figma assets: `public/figma/welcome-bubble.png`, `public/figma/welcome-exit.png`, `public/figma/welcome-start.png`, `public/figma/counter-horizontal.svg`, `public/figma/counter-corner.svg`, `public/figma/counter-center.svg`, `public/figma/counter-edge.svg`, `public/figma/counter-inner.svg`.
- Added documentation: `docs/welcome-screen.md`.
- Added local-only verification: `tmp-screens/welcome-check.mjs` and its screenshots/browser profile (gitignored).
- Reused, unchanged: the supplied `public/images/welcome-avatar.gif`, `public/images/visitor-counter.svg`, and existing music/portfolio components. Other working-tree edits were not made by this implementation.
