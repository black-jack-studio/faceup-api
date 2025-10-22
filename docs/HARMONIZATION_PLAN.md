# Harmonization Plan

## Objectives
- Unify all client configuration behind a single module (`client/src/lib/config.ts`) fed by environment variables.
- Ensure every network request flows through the shared API layer with Supabase JWT propagation and 401 recovery.
- Consolidate Supabase usage into a single client instance and remove duplicate store logic around coin persistence.
- Replace legacy Replit/REST coin endpoints with direct Supabase `public.users` reads/writes while keeping Zustand stores in sync.

## Implemented actions
1. **Configuration**
   - Added `client/src/lib/config.ts` with normalized log level handling and sanity logging (`CONFIG` prefix).
   - Introduced `client/src/lib/stripe.ts` and rewired Wallet/Shop/Premium components to consume the memoised Stripe promise.
   - Updated `.env.example` and `client/.env.production` to expose `VITE_API_URL`, Supabase keys, Stripe key, and log level documentation.
2. **API layer & auth**
   - Reworked `client/src/lib/api.ts` to read `CONFIG.API_URL`, attach Supabase access tokens, retry once on 401 via `supabase.auth.refreshSession()`, and throw structured errors.
   - Added `client/src/lib/logger.ts` for log-level-aware emitters, reused by config/auth/coins paths.
   - Centralised Supabase client creation in `client/src/lib/supabase.ts` with a compatibility re-export (`supabaseClient.ts`).
3. **State management**
   - Rebuilt `client/src/store/chips-store.ts` to query/update Supabase `public.users` and emit `COINS_SYNC` logs, removing `/api/user/coins*` calls.
   - Extended `client/src/store/user-store.ts` to delegate coin mutations to the chips store, skip server sync for coin-only updates, and synchronise on login/load/logout via `syncUserCoinsToChips`.
   - Added `client/src/lib/store-sync.ts` utilities (`syncChipsToUser`, `syncUserCoinsToChips`, `reloadCoinsBalance`) used across gameplay, rewards, and commerce flows.
   - Refreshed components (`CoinsHero.tsx`, `WheelOfFortune.tsx`, `pages/shop.tsx`, `pages/play/game.tsx`, `pages/battlepass.tsx`) to rely on the chips store reload helper instead of invalidating `/api/user/coins` queries.
4. **UX polish**
   - `CoinsHero.tsx` now loads balance once on mount, removes debug logs, and keeps animation logic intact.

## Manual verification checklist
- [ ] Log in via Supabase-backed auth and confirm CoinsHero displays the persisted balance from `public.users.coins`.
- [ ] Trigger `addWinnings`/`deductBet` flows (e.g., through gameplay or store purchases) and verify:
  - Chips badge updates immediately.
  - Supabase `public.users.coins` reflects the new value (via Supabase dashboard).
  - User store coin field follows the chips store without duplicate writes.
- [ ] Disconnect/reconnect: after reloading the app, `useChipsStore.loadBalance()` restores the real coin balance.
- [ ] Exercise a flow that returns 401 (e.g., expired session) and confirm the API layer refreshes the Supabase session once before surfacing a structured error `{ status, message, errorType? }`.
- [ ] Run `rg "fetch\(" client/src` and ensure only `client/src/lib/api.ts` contains fetch calls.
- [ ] `npm run build` (from the repo root or within `client/`) — currently blocked by the pre-existing missing `client/src/pages/auth/callback` route; resolve separately once the route file is restored.

## Logging & observability
- Set `VITE_LOG_LEVEL=debug` (client) to enable verbose `CONFIG`, `AUTH_SYNC`, and `COINS_SYNC` console logs.
- Reduce to `warn`/`error` in production to silence sync diagnostics.
