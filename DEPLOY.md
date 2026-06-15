# Deployment-Checkliste

Stand: 2026-06-14. Was VOR und BEIM Deploy zu prüfen ist.

## 1. Datenbank-Migrationen

Auf jedem Ziel (Staging/Prod) ausführen, sobald der neue Stand deployed ist:

```bash
npx prisma migrate deploy
```

Betroffene Migrationen (2026-06-14):
- `20260614140000_add_password_reset` — Tabelle `password_reset_tokens`
- `20260614150000_backfill_email_verified` — setzt `emailVerified` für alle bestehenden, nicht-anonymisierten Konten (repariert kaputte Logins)

> Ohne Backfill können sich vor der Email-Verification-Migration angelegte Konten nicht einloggen (`EmailNotVerified`).

Optional (Dev-Sync): `npm run db:seed`.

## 2. Vercel-Umgebungsvariaben

Pflicht (App bricht ohne):
- `DATABASE_URL` — **muss** gesetzt sein (nicht nur `PRISMA_DATABASE_URL`/`POSTGRES_URL`; `schema.prisma` liest `DATABASE_URL`)
- `AUTH_SECRET` — sicherer Zufallswert
- `NEXTAUTH_URL` — Produktions-URL

Für Mail-Flows (Self-Service-Passwort-Reset, Registrierungs-Verifizierung, Admin-Reset per Mail):
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

Ohne SMTP schlagen Mail-Flows fehl (direkter Admin-Passwort-Set funktioniert weiterhin).

Cron (fehlt-Bericht-Benachrichtigung):
- `CRON_SECRET` — Scheduler muss `?secret=<CRON_SECRET>` mitsenden. Endpunkt: `POST /api/notifications/check?secret=...`.

## 3. Credentials rotieren ⚠️

Falls DB-Credentials (`db.prisma.io` … `sk_...`) jemals im Klartext geteilt wurden (z.B. Chat/Issue): **sofort rotieren**.
- Prisma/Vercel Dashboard → API Key / Connection String neu generieren → neuen Wert in Vercel-Env `DATABASE_URL` eintragen.

## 4. Post-Deploy Smoke

- Login als `admin@example.com` / `trainer@example.com` / `trainee@example.com` (Passwort `password123`) klappt.
- `/forgot-password` → Reset-Mail (sofern SMTP konfiguriert).
- Cron manuell: `curl -X POST "<URL>/api/notifications/check?secret=<CRON_SECRET>"` → 200.
