# FaceUp API

## Auth debugging

### CSRF JSON + Cookie

1. **Fetch a fresh CSRF token (sets the secure cookie and returns JSON)**
   ```bash
   curl -i -c cookies.txt https://faceup-api.onrender.com/api/auth/csrf
   ```
   *Expected:* HTTP/200 with `Set-Cookie: faceup.csrf=...; HttpOnly; SameSite=None; Secure` (in production) and body `{ "csrfToken": "<token>" }`.

2. **Login using the stored cookie + token header**
   ```bash
   curl -i -b cookies.txt \
     -H "x-csrf-token: <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"username":"stan","password":"<MOT_DE_PASSE>"}' \
     https://faceup-api.onrender.com/api/auth/login
   ```
   *Expected:* HTTP/200 with the JSON login response (or `{"message":"Invalid credentials"}` for a wrong password). No HTML fallback.

3. **Verify that API responses stay JSON**
   ```bash
   curl -i https://faceup-api.onrender.com/api/ready
   ```
   *Expected:* JSON diagnostics, never the SPA HTML payload.

### Notes

* The server trusts Render's proxy (`app.set('trust proxy', 1)`) so HTTPS cookies are respected.
* Allowed CORS origins: `capacitor://localhost`, local dev URLs, `https://faceup.app`, and `https://faceup-api.onrender.com`.
* CSRF protection applies to all mutative `/api` requests except health checks and payment webhooks.

## Supabase OAuth checklist

- [ ] Add redirect URLs: `https://faceup.app`, `https://faceup-api.onrender.com/auth/callback`, `capacitor://localhost`, and `faceup://auth/callback`.
- [ ] Confirm the iOS/Android apps register the `faceup://auth/callback` scheme.
- [ ] Ensure the Supabase project has Apple & Google OAuth enabled with the same redirect list.
- [ ] Update environment variables for native deep links (`APP_URL`, `SUPABASE_REDIRECT_URL`) if they change.
- [ ] Test Apple and Google flows on-device after updating the callback list.

