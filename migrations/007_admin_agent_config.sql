-- Migration 007: Admin Agent LLM Config Extensions
-- Adds base_url, system_prompt, and daily_rate_limit to llm_config

ALTER TABLE llm_config 
  ADD COLUMN IF NOT EXISTS base_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS system_prompt TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS daily_rate_limit INTEGER DEFAULT 5;

ALTER TABLE agent_usage
  ADD COLUMN IF NOT EXISTS token_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocked_count INTEGER DEFAULT 0;
