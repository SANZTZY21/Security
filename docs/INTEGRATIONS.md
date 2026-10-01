# Integration status — 1 October 2026

Statuses below distinguish implemented boundaries from live verification. No metadata fixture is substituted for a failed provider.

| Integration    | Implementation                                                                                                            | Verified here                                                                            | Remaining requirement                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Supabase Auth  | Registration, password sign-in, sign-out, cookie sessions, refresh, PKCE callback, recovery                               | Real local GoTrue, registration/login/logout; browser session and private page redirects | Production project, public HTTPS URL, redirect allowlist, SMTP; production verification and recovery delivery test        |
| PostgreSQL     | Versioned migrations, RLS, constraints, RPC transactions, seed                                                            | Real PostgreSQL 17, migrations and security integration suite                            | Hosted backups/PITR and restore drill                                                                                     |
| Storage        | Private avatar bucket; server image decode/re-encode, limits, RLS-checked same-origin image reads                         | Local storage route tested separately in validation record                               | Production Storage configuration and lifecycle cleanup                                                                    |
| AniList        | Live search/trending/popular/country/genre, normalized title detail, pagination, timeout/retries                          | Official live GraphQL requests and browser artwork                                       | Operator must review API commercial terms and quota before commercial operation                                           |
| TMDB           | Movie/TV discovery, country categories, search and detail; key stays on server                                            | Missing-key unavailable state                                                            | TMDB API key, applicable commercial license; live API acceptance remains unverified                                       |
| Video          | Native HTML media controls; MP4/WebM authorized-source records, resume, speed, theater mode, server heartbeat             | Original 24-second VP9 WebM plays in shared Chromium                                     | Licensed catalog content, production media CDN/signed delivery. HLS/DASH/DRM and multi-track controls are not implemented |
| Midtrans       | Snap server checkout, SHA-512 notification authentication, server GET status, idempotent settlement/refund RPC            | Signature unit tests and database settlement/refund/replay tests                         | Sandbox server key, merchant account, reachable HTTPS webhook; no real payment processed                                  |
| Email          | Supabase Auth email mechanism                                                                                             | Local Mailpit available                                                                  | SMTP production credentials, branding and delivery tests                                                                  |
| Ads            | First-party campaigns, one eligibility event per two distinct completions, premium/staff exemptions, load/failure reports | Eligibility/idempotency database tests; campaign UI boundary                             | Real authorized campaign creative and consent/retention policy; no ads/revenue invented                                   |
| Push           | Not implemented                                                                                                           | Not tested                                                                               | Select service and implement device subscriptions/delivery                                                                |
| Realtime       | Supabase local service is running; inbox uses server reads                                                                | No client realtime subscription yet                                                      | Add subscriptions and Realtime publication policies                                                                       |
| Scheduled work | Bearer-protected `/api/jobs`, subscription expiry and stale viewing-session cleanup                                       | Boundary can be tested locally                                                           | Hosting scheduler invoking it; no scheduler runs by default                                                               |

## Exact environment configuration

Copy `.env.example`. Only consumed variables are included. Unimplemented Xendit, push, email vendor, ad vendor, and error-reporting vendor settings are deliberately absent rather than implying an implementation.

- `NEXT_PUBLIC_APP_URL`: canonical HTTPS origin in production; `http://localhost:3000` locally. Add `${origin}/auth/callback` to Supabase allowed redirects and set Site URL.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public project API URL and publishable/anon credential. RLS remains required.
- `SUPABASE_SERVICE_ROLE_KEY`: private server key. Needed for verified payments, image uploads, and jobs. Never expose in `NEXT_PUBLIC_*`, logs, or browser requests.
- `ANILIST_API_URL`: default official `https://graphql.anilist.co`; only change for trusted operator-controlled verification.
- `TMDB_API_KEY`: server-side v3 API key from TMDB project settings.
- `PAYMENT_PROVIDER=midtrans`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_PRODUCTION=false`: configure sandbox first. Snap uses redirect checkout; no public client key is needed. Switch production flag only with live merchant credentials.
- Configure Midtrans Payment Notification URL as `${origin}/api/payments/webhook`. The signing secret is the Midtrans server key; a separate made-up webhook secret is not used.
- `CRON_SECRET`: random high-entropy bearer credential for the scheduler. Configure `Authorization: Bearer <secret>`; keep it in hosting secrets.

## Sources checked

- [AniList API documentation](https://docs.anilist.co/guide/introduction)
- [TMDB developer documentation](https://developer.themoviedb.org/docs/getting-started)
- [Supabase server-side Next.js authentication](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Midtrans HTTP notifications](https://docs.midtrans.com/docs/https-notification-webhooks)

The supplied 135-provider directory is research input, not a list of integrations claimed by this application. Price and license assertions in that directory are not copied as verified facts.

CodeRabbit emulate v0.0.1 catalog was installed and inspected. It has no AniList, TMDB, Midtrans or Xendit service. Local Supabase is the actual stack, not a mock; unsupported providers have not been redirected to unrelated emulators.

## Direct playback and quality (2026-10-01)

- `/watch-now` lists available sources under database RLS plus an explicitly editorial open film. It does not mark AniList/TMDB metadata as playable.
- `/open-cinema` plays **Big Buck Bunny, Sunflower edition**, full duration 634.571 seconds, including credits. Credit: © Blender Foundation | www.blender.org. CC BY 3.0, project license: https://peach.blender.org/about/. Wikimedia Commons hosts WebM VP9 renditions at 360p and nominal 480p (854×481 encoded pixels). These are real full-film sources, not trailers. No playback or availability SLA is implied by a third-party public host; network/rate limits can interrupt delivery. For production scale, host permitted copies on your own media CDN with the attribution and full credits retained.
- `supabase/open-cinema.sql` optionally imports the same film and two sources, enabling authenticated progress/XP. Without this import or a working database, the public screening remains available; progress and comments do not pretend to persist.
- Migration `202610010011_playback_quality.sql` adds nullable `playback_sources.height`. Admin playback JSON accepts `height` (144–4320), or null for an unmeasured original. Every rendition must contain the same entire episode with aligned timing. The player preserves current time, playback speed and pause state when switching sources. Choices come only from authorized source records visible through RLS.
- MP4/H.264 support depends on the browser's codecs. The sandbox Chromium does not support H.264; the open film therefore uses WebM, tested by actual decoded frames. DRM, arbitrary embeds and automatic transcoding are not implemented.
- Comments now render inline on titles, episodes and the open screening. Add/like/delete actions return to a validated discussion URL. Database failures display a service unavailable message; logged-out visitors see a login link.
- Hosted migration/admin provisioning remains blocked until Supabase MCP authenticates successfully. The scoped endpoint returned HTTP401 `JWT could not be decoded`; authenticate the connection with Supabase OAuth or an appropriate management Personal Access Token, not an application anon/service-role key. Do not put secrets in chat.
