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
