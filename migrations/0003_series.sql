-- Shelves a subscriber follows, as comma-separated series ids ('' = none).
ALTER TABLE subscribers ADD COLUMN series TEXT NOT NULL DEFAULT '';
