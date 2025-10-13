# Phase 0 – Repository inventory & canonicalization plan

## Duplicate inventory (by basename)
The script at the bottom of this document (and committed later as `scripts/audit-duplicates.ts`) surfaces the main duplicate basenames. Below are the groups that require decisions:

| Basename | Instances discovered | Canonical plan | Legacy/archive | Removal | Notes |
| --- | --- | --- | --- | --- | --- |
| `schema` | `shared/schema.ts`, generated `supabase_migration/schema.sql` exports | New canonical source at `server/db/schema/index.ts` exposing Drizzle tables and types. | Copy of `shared/schema.ts` moved under `legacy/shared/schema.ts` for reference. | Generated SQL remains untouched. | Routes/services will import from the new index; `shared/schema.ts` re-exports it for type sharing. |
| `db` connectivity | `server/db.ts`, `server/supabase-db.ts`, `server/supabase-client.ts`, `scripts/auto-migrate-to-supabase.ts` | Keep `server/db.ts` (renamed to `server/db/index.ts`) as unified Neon/Supabase entry. | Move `server/supabase-db.ts` under `legacy/server/db/supabase-db.ts` (historic single-purpose client). | None. | `server/supabase-client.ts` stays but moves into canonical `server/db/` folder. |
| Validation schemas | Zod snippets embedded in `shared/schema.ts` and ad‑hoc parsing in `routes.ts` | Create `server/validation/index.ts` with the agreed schema set. | Legacy zod helpers in `shared/schema.ts` archived with the schema file. | Remove ad-hoc validations from routes. | Keeps auth rules intact. |
| Storage/service logic | `server/storage.ts`, `server/challengeService.ts`, `server/seasonService.ts` alongside older scripts | Move active services to `server/services/`. | None (files already unique). | N/A | Imports updated to the new paths. |
| Referral utilities | `server/utils/referral.ts`, `server/utils/referral-rewards.ts`, `server/utils/generate-referral-codes.ts` | Keep in `server/utils/`. | None. | N/A | Only path updates expected. |
| `generate-jwt` scripts | `generate-jwt.js` (ESM), `generate-jwt.cjs` (CJS) | Keep `generate-jwt.js` under `scripts/` (ESM). | Move `generate-jwt.cjs` to `legacy/scripts/generate-jwt.cjs`. | None. | Normalises around ESM. |
| `AppleLoginButton` | `client/src/components/AppleLoginButton.tsx`, `client/src/components/auth/AppleLoginButton.tsx` | Keep the `auth/` variant (used by pages). | Move unused root component to `legacy/client/components/AppleLoginButton.tsx`. | None. | Avoid duplicate exports. |
| `.gitignore` | Root `.gitignore`, `server/.gitignore` | Consolidate rules into root `.gitignore`. | Archive `server/.gitignore` in `legacy/server/.gitignore`. | None. | Server copy currently duplicates base rules. |

Other duplicate basenames (`card`, `challenges`, `leaderboard`, etc.) are intentional pairs of component/page files and remain untouched.

## Target structure
```
client/
server/
  db/
    index.ts           # unified client setup
    schema/
      index.ts         # single source of tables & types
  services/
    storage.ts
    challengeService.ts
    seasonService.ts
  utils/
    referral.ts
    referral-rewards.ts
    generate-referral-codes.ts
  validation/
    index.ts
  routes.ts
legacy/
  client/
  server/
    db/
  shared/
  scripts/
```

## Planned refactor steps
1. **Create canonical DB schema module**
   * Extract the table definitions and types from `shared/schema.ts` into `server/db/schema/index.ts`.
   * Update all imports (`server/storage.ts`, `server/routes.ts`, scripts) to use the new module.
2. **Archive legacy schema + extras**
   * Move `shared/schema.ts` (and redundant CJS helpers) into `legacy/shared/` for historical reference.
   * Relocate `server/supabase-db.ts` and the extra `.gitignore` into `legacy/server/`.
3. **Validation centralisation**
   * Build `server/validation/index.ts` with the provided zod schemas.
   * Replace inline parsing in `routes.ts` to import from this single source.
4. **Services folder**
   * Move `storage.ts`, `challengeService.ts`, `seasonService.ts` into `server/services/`.
   * Adjust import paths in routes and dependent modules.
5. **ESM only & artefact cleanup**
   * Remove committed build artefacts (`*.cjs`, `*.cts`, `*.d.cts`, `*.map`) outside of source control needs.
   * Relocate `generate-jwt.cjs` into `legacy/scripts/` and ensure root `.gitignore` captures build outputs listed in the brief.
6. **Utility updates**
   * Keep referral utilities under `server/utils/`; update their imports if path changes require it.
   * Provide `scripts/audit-duplicates.ts` to list duplicate basenames for future audits.
7. **Routes & type fixes**
   * Update `server/routes.ts` to use the new schema + validation imports and tighten the types as per acceptance criteria (e.g., parse outputs, session casts).

## Deliverables for the PR
* This Phase 0 document (committed separately before code refactors).
* Canonicalised folder structure, imports, and TypeScript fixes per plan.
* Legacy folder containing archived variants.
* Updated `.gitignore` and duplicate-audit script.
* Smoke test commands documented in the PR description.
