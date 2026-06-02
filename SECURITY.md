# Security (personal / home network)

This app is intended for **local or trusted LAN** use, not public internet exposure.

## Before you run it

- Set a strong `AUTH_SECRET` in `.env` (see `.env.example`).
- Keep Postgres bound to localhost or a private network; do not port-forward the database to the internet.
- Use the demo seed password only in local development.

## If you ever expose it on the internet

- Terminate TLS (HTTPS) and set `AUTH_URL` to the public origin.
- Add rate limiting on auth routes and consider MFA.
- Review Auth.js session cookie settings (`Secure`, `SameSite`).

This document is a checklist, not a full threat model.
