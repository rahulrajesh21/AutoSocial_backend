-- Create user settings table for Instagram and other social media integrations
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  instagram_username VARCHAR(255),
  auto_reply_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_settings_user_id_unique UNIQUE (user_id)
);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Add a comment
COMMENT ON TABLE user_settings IS 'Stores user-specific settings for social media integrations'; 