CREATE TABLE IF NOT EXISTS help_desk_tickets (
  id SERIAL PRIMARY KEY,
  issue_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  ai_response TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Add index for faster status lookups
CREATE INDEX IF NOT EXISTS idx_help_desk_tickets_status ON help_desk_tickets(status); 