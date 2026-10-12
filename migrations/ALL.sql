-- Everything in one file, for pasting into the D1 console in the dashboard.
-- (The numbered files are the same SQL, split for `wrangler d1 migrations apply`.)

-- Every payment. The row id is the giver number printed on the certificate.
CREATE TABLE IF NOT EXISTS gifts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id     TEXT UNIQUE,                     -- Stripe Checkout Session; NULL for pre-Stripe gifts
  payment_intent TEXT,
  amount_cents   INTEGER NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'usd',
  name           TEXT NOT NULL DEFAULT 'Anonymous',
  hidden         INTEGER NOT NULL DEFAULT 0,      -- 1 = kept off the public ledger (still counted)
  refunded       INTEGER NOT NULL DEFAULT 0,      -- 1 = refunded or disputed (not counted)
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS gifts_by_amount ON gifts (refunded, hidden, amount_cents DESC);
CREATE INDEX IF NOT EXISTS gifts_by_pi ON gifts (payment_intent);

CREATE TABLE IF NOT EXISTS subscribers (
  email      TEXT PRIMARY KEY,
  writings   INTEGER NOT NULL DEFAULT 1,
  billion    INTEGER NOT NULL DEFAULT 1,
  source     TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- The fifteen givers from before Stripe (Q1 2026, $149). Giver numbers 1–15.
INSERT INTO gifts (amount_cents, name, created_at) VALUES
  (5000, 'a man who lost a bet', '2026-04-30 00:00:00'),
  (2500, 'a man who says he runs an AI lab', '2026-04-30 00:00:00'),
  (2000, 'someone''s wife (didn''t ask)', '2026-04-30 00:00:00'),
  (1500, 'guy from the airport bar', '2026-04-30 00:00:00'),
  (1000, 'the estate of a dead oil baron', '2026-04-30 00:00:00'),
  (700, 'a man who is 47 but insists he is 18', '2026-04-30 00:00:00'),
  (500, 'a lurker, finally', '2026-04-30 00:00:00'),
  (500, 'a guy with a blog', '2026-04-30 00:00:00'),
  (300, 'my uber driver', '2026-04-30 00:00:00'),
  (200, 'a fellow founder', '2026-04-30 00:00:00'),
  (200, 'mom (not the one above)', '2026-04-30 00:00:00'),
  (200, 'someone who clicked twice', '2026-04-30 00:00:00'),
  (100, 'Anonymous', '2026-04-30 00:00:00'),
  (100, 'Anonymous', '2026-04-30 00:00:00'),
  (100, 'a child who stole the iPad', '2026-04-30 00:00:00');
-- Shelves a subscriber follows, as comma-separated series ids ('' = none).
ALTER TABLE subscribers ADD COLUMN series TEXT NOT NULL DEFAULT '';
