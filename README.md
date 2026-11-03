
# astraejellyfish's portfolio

React + Vite portfolio for **https://astraee.studio**, hosted on GitHub Pages from `astraejellyfish/astraejellyfish-s-portfolio`.

## Local development and production preview

Use Node.js 24, matching the deployment workflow.

```sh
npm ci
npm run dev
```

Check and preview the production build:

```sh
npm run lint
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Open `http://127.0.0.1:4173/` to review `dist/`. The preview command does not publish anything.

## GitHub Pages deployment

`.github/workflows/deploy.yml` follows the [official Vite Pages workflow](https://vite.dev/guide/static-deploy.html#github-pages), using GitHub's official actions pinned to commit SHAs. It runs on pushes to `main` and manual workflow dispatch, installs with `npm ci`, lints, builds, uploads `dist/`, and deploys to the `github-pages` environment. It uses GitHub's automatic workflow token; no personal token or additional dependency is required.

Vite explicitly uses `base: '/'` for the custom domain. Public images, GIFs, fonts, and audio are served from `/figma/`, `/images/`, and `/audio/`. Do not change the base to the repository name while using `astraee.studio`.

After deployment is approved:

1. In the repository's **Settings → Pages**, choose **GitHub Actions** as the build/deployment source.
2. Set the Pages custom domain to `astraee.studio`. For Actions-based publishing, a `CNAME` file is not required and does not configure the domain; use the repository setting. See [GitHub's custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
3. Review and commit the complete portfolio source, lockfile, workflow, and all required public assets. `dist/` and `tmp-screens/` remain ignored; the workflow builds the published artifact.
4. An approved push to `main`, or a manual run from the Actions tab, will publish the build. Configure DNS separately only when authorized, then enable HTTPS in Pages when available.

Preparing these files does not change GitHub repository settings or DNS and does not trigger a deployment.

## Runtime and sound

`TypewriterDialogue.jsx` imports `useRef`, declares `typingAudioRef` inside the component, and attaches it to one audio element. Typing uses the existing `/audio/typing-sounds.mp3` recording and remains animated when browser audio is blocked. Lint checks undefined variables in browser source files. START, EXIT/STAY?, title navigation, and sound behavior are described in [the welcome-screen documentation](docs/welcome-screen.md).

The session visitor counter uses a shared random browser ID and a server-side 30-minute inactivity timeout; refreshes and new tabs reuse active visits. Its Cloudflare Worker and SQLite-backed Durable Object are deployed at `https://astraee-visitor-counter.parazoshaine-commission.workers.dev`. The GitHub Pages workflow explicitly enables the counter and sets this public endpoint during production builds; no repository variables or Cloudflare credentials are needed for frontend deployment. Local development and preview never send live counting requests. See [counter behavior, deployment verification, privacy, and setup](docs/visitor-counter.md).
