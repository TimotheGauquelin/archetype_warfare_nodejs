-- Artwork croppé YGOPRODeck (card_images[].image_url_cropped)
ALTER TABLE card
    ADD COLUMN IF NOT EXISTS artwork_url TEXT NULL;

-- Backfill à partir du passcode (id carte)
UPDATE card
SET artwork_url = 'https://images.ygoprodeck.com/images/cards_cropped/' || id || '.jpg'
WHERE artwork_url IS NULL
  AND id IS NOT NULL
  AND id <> '';
