# Session visitor counter

This implementation counts **visits with a 30-minute inactivity timeout**, not page views or unique people. The frontend stays on GitHub Pages. The backend is a Cloudflare Worker and one SQLite-backed Durable Object named `astraee.studio`.

The separately approved Worker was deployed on November 3, 2026 (Singapore time), after the owner confirmed **Workers Free ($0/month)**. Its HTTPS endpoint is `https://astraee-visitor-counter.parazoshaine-commission.workers.dev`. The owner subsequently approved committing and pushing the frontend integration to `main` for GitHub Pages deployment. No paid features, DNS changes, or repository-variable changes are required.

## Counting rules

- The first production document load checks for a visit. Your own browser is included.
- A UUID created and stored in first-party IndexedDB identifies the browser. ID creation uses a read/write transaction, so tabs opened together share one ID.
- Refreshes, additional tabs, re-renders, Strict Mode subscriptions, and repeated requests with that ID reuse the active server session and do not increment the total.
- New visits are checked on document loads and returns to a tab/window, including back-forward cache restoration. After 30 minutes without recorded activity, a return creates one new visit.
- Trusted pointer, keyboard, and scroll activity extends an existing session. Activity never creates a visit, including after expiry. START, EXIT, STAY?, and title navigation cannot increment the counter.
- An open tab left idle has no recurring heartbeat. An ordinary interaction in that still-open tab does not start a visit; a document load or tab/window return does. This is the recommended open-tab behavior discussed during implementation.
- Activity is batched at most once per minute. The request includes the age of the last real interaction, so delayed batches do not extend the session from the time a background timer happens to run. Switching away flushes pending activity once.
- Different browsers, devices, storage partitions, and private browsing contexts may count separately. Clearing the saved browser ID creates a new identity on the next check.

The server clock controls expiry. No client-supplied total or absolute expiry is accepted. The session lookup, possible increment, and expiry renewal run in one synchronous SQLite transaction. Concurrent requests cannot count one active session twice, and simultaneous different visitors cannot overwrite one another's increments.

## Data and privacy

IndexedDB database `astraee-visit-counter` stores only one random UUID under `identity` → `browser-id`. It does not store the total or session expiry.

The server stores:

| Table | Data |
| --- | --- |
| `totals` | One persistent integer total |
| `sessions` | SHA-256 hash of the random browser ID and an expiration timestamp |

An alarm removes expired session hashes even when no new visitor arrives. The total remains stored. There are no application cookies, IP-address records, user-agent records, names, fingerprinting, or cross-site identifiers. Worker observability and Wrangler telemetry are disabled in configuration. Cloudflare still processes normal connection metadata as the hosting provider; this does not promise that its infrastructure never processes IP addresses.

The Worker validates Origin, method, JSON, body size, UUID, and activity age. Production permits only `https://astraee.studio`. Requests omit credentials and referrers; responses are not cached. CORS is not authentication or a bot-proof guarantee. Browser-based totals can undercount when storage or network requests are blocked and can include automated traffic.

## Failure behavior

- If IndexedDB is unavailable, blocked, or cannot initialize, no increment request is sent and the UI shows `----`. There is no temporary per-tab identity that would inflate the total on refresh or across tabs.
- A timeout, failed request, unexpected response, or unavailable service shows `----`, rather than a fabricated or locally maintained total.
- A subsequent document/tab entry can retry with the same browser ID. An earlier request that committed before its response was lost will not count again while the session remains active.
- Browser-storage deletion or private-session teardown cannot be deduplicated without additional identifying information. The implementation intentionally does not fingerprint to work around that.
- An outage cannot reliably record activity or visits that never reach the backend. Activity received after a session expires cannot resurrect it or increment the count; a subsequent entry check can start the next visit.

## Local development

Use Node.js 24. No Cloudflare account or login is needed for local tests.

```sh
npm ci
npm --prefix counter ci
npm --prefix counter run test
npm --prefix counter run dev
```

The last command runs `wrangler dev --env local --local` on `http://127.0.0.1:8787`. Its Durable Object is local, with persistent development data under ignored `counter/.wrangler/`. The separate local environment permits the test frontend origin; it does not change the production CORS settings or connect to a live Durable Object.

Ordinary frontend development and production previews on localhost **never send counting requests**, even if public counter variables are set. Counting requires a production build, the exact origin `https://astraee.studio`, an explicit enabled flag, and a valid HTTPS endpoint.

For real browser tests, leave a Vite development server running on the fixture port:

```sh
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

Then in another terminal:

```sh
npm --prefix counter run test:browser
```

The browser script starts an isolated Miniflare Worker on `127.0.0.1:8789`, uses the source-only `tests/visitor-counter.html` fixture, and launches headless Edge. Set `BROWSER_BIN` to another compatible Chromium executable if necessary. This fixture intentionally exercises the client against a local test namespace and is not part of the production `dist` build. Its short timeout is only for tests; the production configuration remains 1,800,000 ms.

The backend tests run the actual Worker and SQLite Durable Object in Cloudflare's workerd runtime through Miniflare. They test concurrency, server expiry, activity-only renewal, alarm cleanup, persistence through runtime restarts, CORS, validation, and unavailable-service responses. Client tests cover Strict Mode, production gating, activity batching, storage failures, request failures, and recovery. Browser tests verify concurrent IndexedDB initialization across real tabs, refreshes, tab returns, zero padding, restricted storage, failure display, and the original local welcome controls.

## Account and authorization steps before deployment

1. Create or use your Cloudflare account and stay on **Workers Free**. This backend uses SQLite-backed Durable Objects, which are available on the Free plan. No paid upgrade is required. Free quotas still apply; [check current Cloudflare pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) before approving deployment. Activity touches, SQL updates, and alarm cleanup also consume quotas.
2. When you are ready to authorize access, run `npx wrangler login` from `counter/` and complete the Cloudflare browser authorization. A scoped deployment API token is an alternative for automation. Keep any such token outside this repository and never in a `VITE_*` variable or chat message. See [Wrangler login](https://developers.cloudflare.com/workers/wrangler/commands/general/#login).
3. **Only after separate explicit deployment approval**, deploy the top-level production configuration from `counter/`. Do not deploy the `local` environment. The resulting Worker `workers.dev` URL can serve the API without moving the GitHub Pages frontend or changing DNS. No backend deployment command or workflow runs automatically in this repository.

   From `counter/`, the explicit production command is:

   ```sh
   npx wrangler deploy --config wrangler.jsonc --env=
   ```

   `--env=` selects the top-level production configuration, not the isolated `local` environment. `npx wrangler deploy --dry-run --config wrangler.jsonc --env=` validates and bundles without publishing. Run from `counter/`; this configuration names the separate backend `astraee-visitor-counter`.
4. The approved GitHub Pages workflow now supplies these public build settings directly:

   | Variable | Value |
   | --- | --- |
   | `VITE_VISITOR_COUNTER_ENABLED` | `true` |
   | `VITE_VISITOR_COUNTER_URL` | `https://astraee-visitor-counter.parazoshaine-commission.workers.dev` |

   These values are committed in the workflow so deployment does not depend on an ignored local file or separately configured repository variables. They are public configuration, not secrets. No Cloudflare token is exposed to React. To disable counting in a future deployment, change the workflow's enabled flag to `'false'` and rebuild.
5. A push to `main` triggers the existing Pages deployment workflow. The owner has approved the frontend commit and push. An ignored `.env.production.local` also enables the actual endpoint for local production builds, while localhost development and previews remain excluded by the origin guard. `.env.example` provides the public URL with counting disabled by default.

## Deployment and verification status

The deployment preflight on November 3, 2026 confirmed an existing Wrangler OAuth login for the account that owns the Active `astraee.studio` zone. The production configuration is pinned to that account ID so a future deployment does not select another account. No credentials are stored in configuration or frontend code.

The production dry run passed with the `VISITS` → `VisitCounter` binding, `new_sqlite_classes` migration, `https://astraee.studio` CORS origin, and 1,800,000 ms timeout. All 11 automated tests passed again. There are no custom Worker routes or custom domains in the configuration.

Read-only inspection now confirms an existing Worker named `astraejellyfish-s-portfolio`. Its public root at `https://astraejellyfish-s-portfolio.parazoshaine-commission.workers.dev/` returns the React portfolio HTML, including the `root` element and Vite module `/assets/index-DrdIFD5u.js`. Its Worker bindings list is empty. It is a frontend deployment, not the session-counter backend. The same name is not a Cloudflare Pages project (Pages API returns 404).

The approved production command completed successfully from `counter/`:

```sh
npx wrangler deploy --config wrangler.jsonc --env=
```

- Worker: `astraee-visitor-counter`
- HTTPS origin: `https://astraee-visitor-counter.parazoshaine-commission.workers.dev`
- Version: `17c8bb21-cc5c-4057-a3a7-28e66843d121`
- Binding: `VISITS` to class `VisitCounter`
- SQLite namespace: `astraee-visitor-counter_VisitCounter` (`7bf56ecd2ea84aa3b79dc66d4fa2b138`)
- Migration: `v1`, `new_sqlite_classes: ["VisitCounter"]`
- Production timeout: `1800000` ms; allowed origin: `https://astraee.studio`

Cloudflare's service/settings APIs report the separate Worker and binding. Its Durable Object namespace API reports `use_sqlite: true`. The existing frontend Worker still has no bindings and continues to serve its portfolio HTML.

Keep the portfolio on GitHub Pages. Leave the existing Cloudflare frontend Worker unchanged. The backend deployment uses only `counter/wrangler.jsonc`, the `VISITS` binding to class `VisitCounter`, and the `v1` SQLite migration using `new_sqlite_classes`. There are no custom Worker routes or custom domains in that configuration. Do not override the backend name with `astraejellyfish-s-portfolio`.

The owner confirmed Workers Free in the dashboard before approving deployment. The existing OAuth login was verified against the account that owns `astraee.studio`. Its token lacks subscription-read access, so API calls were not used to claim billing-plan verification. No plan change or paid feature was enabled.

HTTPS API checks passed with normal certificate verification: production-origin preflight returned 204 with the exact CORS origin, localhost preflight returned 403 without an allow-origin header, and successful JSON responses were uncached. A fresh test identity created one visit; repeated `/visit` calls and `/activity` calls kept the total at `1`. The returned expiry was verified as 30 minutes from server time. A repeat smoke run reused the same identity and added no visits. **Deployment testing added exactly one artificial production visit**, retained in the total. The test identity stays only in an ignored local test ledger; it is not published.

Headless Edge also verified native production CORS, a real browser refresh, and an additional tab against the deployed API. Both tabs used the existing test identity in IndexedDB and retained total `1`, with zero additional visits or browser runtime errors. Only the test HTML document was supplied through local browser interception at the production origin; no live website files were changed. The source client and identity implementation sent real HTTPS requests to the deployed Worker.

After configuring the actual endpoint locally, `npm run build`, `npm run lint`, and all 11 automated counter tests passed again. The ignored local environment file is excluded from Git; the build contains only the public Worker endpoint, not Cloudflare credentials.

Full 30-minute production expiry was not waited out or shortened. Expiry, re-entry, concurrency, persistence, and expired-session activity behavior were verified using the isolated local workerd/SQLite tests. Backend deployment did not change DNS, nameservers, SSL, GitHub Pages settings, or push frontend changes; frontend publication was approved separately afterward. The public API accepts POST `/visit` and `/activity`; opening the Worker root without an allowed Origin is intentionally rejected.

## Implementation map

- `counter/src/index.js`: CORS/API validation, atomic visit checks, SQLite total/session storage, and expiry cleanup alarms.
- `counter/wrangler.jsonc`: production and isolated local bindings, SQLite migration, and the 30-minute timeout.
- `counter/package.json` / `counter/package-lock.json`: local-only Wrangler/Miniflare tooling; frontend dependencies are unchanged.
- `src/visitorCounter/identity.js`: atomic cross-tab browser ID initialization.
- `src/visitorCounter/client.js`: production gating, one document controller, visit checks, real-activity renewal, and failure handling.
- `src/hooks/useVisitorCount.js`: React subscription shared across Strict Mode and welcome remounts.
- `src/App.jsx` / `src/components/WelcomeScreen.jsx`: pass the live session total to the existing display.
- `src/components/VisitorCounter.jsx`: existing design and number formatting; accessible label now says visits instead of page visits.
- `.env.example` / `.github/workflows/deploy.yml`: disabled-by-default local example and explicitly enabled production build configuration.
- Tests live under `counter/test/` and `tests/visitor-counter*`.
