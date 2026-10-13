-- Migration 006: LLM Configuration, Agent Usage, and Telemetry

-- Ensure pgcrypto extension exists for gen_random_uuid() if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create llm_config table
CREATE TABLE IF NOT EXISTS llm_config (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL DEFAULT 'gemini',
  model_name VARCHAR(100) NOT NULL DEFAULT 'gemini-1.5-flash',
  api_key_encrypted TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create agent_usage table
CREATE TABLE IF NOT EXISTS agent_usage (
  id SERIAL PRIMARY KEY,
  ip_hash VARCHAR(64) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER DEFAULT 1,
  tokens_used INTEGER DEFAULT 0,
  last_request_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_ip_date UNIQUE (ip_hash, date)
);

CREATE INDEX IF NOT EXISTS idx_agent_usage_ip_date ON agent_usage (ip_hash, date);

-- 3. Create conversations table for anonymized telemetry
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255),
  ip_hash VARCHAR(64) NOT NULL,
  prompt TEXT,
  response TEXT,
  tool_trace JSONB DEFAULT '[]'::jsonb,
  latency_ms INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations (session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_ip_hash ON conversations (ip_hash);
