-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_integrations_user_provider ON integrations (user_id, provider); 