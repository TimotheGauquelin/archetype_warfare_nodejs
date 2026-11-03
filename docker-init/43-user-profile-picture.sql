-- Photo de profil (URL Cloudinary parmi les defaults)
ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS profile_picture_url TEXT NULL;
