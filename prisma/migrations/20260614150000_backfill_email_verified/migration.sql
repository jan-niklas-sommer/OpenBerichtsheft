-- Backfill: Konten, die vor der Email-Verification-Migration (20260510) angelegt
-- wurden, haben "emailVerified" = NULL. Die Auth-Logik (src/lib/auth.ts) wirft in
-- diesem Fall "EmailNotVerified" beim Login — diese Konten können sich also nicht
-- anmelden. Alle nicht-anonymisierten Konten werden hier als verifiziert markiert,
-- da Admin-/Seed-Konten per Konstruktion verifiziert sind (Self-Registration läuft
-- separat über den Verifizierungs-Flow).
UPDATE "users"
SET "emailVerified" = NOW()
WHERE "emailVerified" IS NULL AND "anonymizedAt" IS NULL;
