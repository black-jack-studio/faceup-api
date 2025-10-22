# Repository Audit

## Legacy → Updated Terminology
| Legacy reference | Updated source | Notes |
| --- | --- | --- |
| `API_URL` constant hard-coded in `client/src/lib/api.ts` | `CONFIG.API_URL` from `client/src/lib/config.ts` | Base URL now supplied via environment variable `VITE_API_URL`.
| Direct `import.meta.env.VITE_SUPABASE_URL` access | `CONFIG.SUPABASE_URL` | Centralized Supabase project URL lookup.
| Direct `import.meta.env.VITE_SUPABASE_ANON_KEY` access | `CONFIG.SUPABASE_ANON_KEY` | Prevents scattered credential reads.
| Direct `import.meta.env.VITE_STRIPE_PUBLIC_KEY` access | `getStripe()` helper (`client/src/lib/stripe.ts`) | Stripe initialisation now routed through configuration.
| `VITE_API_BASE` (legacy env) | `VITE_API_URL` | `.env` files updated to the new key naming.

## Environment variables in use
- Client runtime (`client/src/lib/config.ts`): `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLIC_KEY`, `VITE_LOG_LEVEL`.
- Payments: Stripe publishable key consumed via `client/src/lib/stripe.ts`; PayPal widgets rely on built-in `import.meta.env.PROD` only.
- Server/runtime (referenced in `/server` and scripts): `SUPABASE_SERVICE_ROLE_KEY`, `USE_SUPABASE`, `DATABASE_URL`, `SESSION_SECRET`, `STRIPE_SECRET_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, PostgreSQL connection variables (`PGHOST`, `PGUSER`, etc.).

## API endpoints referenced by the client
All client calls are relative paths passed to the shared API layer:
- Authentication & profile: `/api/auth/*`, `/api/user/profile`, `/api/user/owned-avatars`, `/api/subscription/status`.
- Economy: `/api/bets/*`, `/api/wheel-of-fortune/*`, `/api/seasons/add-xp`, `/api/avatars/purchase`, `/api/spin/status`, `/api/battlepass/claimed-tiers`, `/api/stats`.
- Payments: `/api/create-payment-intent-wallet`, PayPal integrations rely on the shared API client as well.
Every request now funnels through `client/src/lib/api.ts` so no direct `fetch` calls remain outside that module.

## Client/service factories
- Supabase client: single instance exported by `client/src/lib/supabase.ts` (with compatibility re-export in `client/src/lib/supabaseClient.ts`).
- Stripe loader: memoised helper in `client/src/lib/stripe.ts`.
- API layer: `client/src/lib/api.ts` attaches Supabase JWTs, handles 401 refresh, and exposes typed helpers (`login`, `register`, `logout`).

## Zustand stores
- `client/src/store/user-store.ts`: persists the authenticated user, delegates coin writes to the chips store, and syncs via `syncUserCoinsToChips`.
- `client/src/store/chips-store.ts`: authoritative coin balance backed by Supabase `public.users` (select/update on `id`).
- `client/src/store/game-store.ts`, `client/src/store/gems-store.ts`: unchanged but listed for completeness.
- Shared synchronisation helpers live in `client/src/lib/store-sync.ts` (`syncChipsToUser`, `syncUserCoinsToChips`, `reloadCoinsBalance`).

## Import aliases
- Defined in `vite.config.ts`: `@` → `client/src`, `@shared` → `shared`, `@assets` → `attached_assets`.
- Mirrored in `tsconfig.json` via `compilerOptions.paths` for `@/*` and `@shared/*`.

## Coins usage inventory
- Source of truth: Supabase `public.users.coins` (queried/updated in `client/src/store/chips-store.ts`).
- UI synchronisation: `client/src/lib/store-sync.ts` keeps `user-store` and `chips-store` aligned.
- Display: `client/src/components/CoinsHero.tsx` reads from the chips store only.
- Reward flows refreshing coins: `WheelOfFortune`, `shop`, `battlepass`, betting hooks, and gameplay now call `reloadCoinsBalance()` instead of hitting `/api/user/coins`.

## Files requiring harmonisation (completed)
- `client/src/lib/api.ts`: remove hard-coded API host, add Supabase auth/refresh, structured errors.
- `client/src/lib/config.ts`: new central configuration surface and log gating.
- `client/src/lib/supabase.ts` & `client/src/lib/supabaseClient.ts`: single Supabase client with compatibility re-export.
- `client/src/lib/stripe.ts`: shared Stripe loader using centralized config.
- `client/src/lib/store-sync.ts`: helper bridging Zustand stores.
- `client/src/store/chips-store.ts`: switch to Supabase reads/writes, emit `COINS_SYNC` logs.
- `client/src/store/user-store.ts`: delegate coin mutations to chips store, update skip-server sync, coins logging.
- UI components reacting to coin updates: `CoinsHero.tsx`, `WheelOfFortune.tsx`, `shop.tsx`, `play/game.tsx`, `battlepass.tsx`.
- Environment samples: `.env.example`, `client/.env.production` aligned on new keys.

These notes capture the pre-change pain points and the files updated to harmonise configuration and state management.
