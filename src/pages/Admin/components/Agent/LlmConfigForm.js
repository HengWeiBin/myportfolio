import React, { useState, useEffect } from 'react';
import { FormInput, FormSelect, FormTextarea, AdminButton } from '../Shared';

const PROVIDER_OPTIONS = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'custom', label: 'Custom (OpenAI Compatible)' },
];

const LlmConfigForm = ({ config, onSave, onTestLatency, testingLatency, latencyResult, saving }) => {
  const [formData, setFormData] = useState({
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    base_url: '',
    api_key: '',
    system_prompt: '',
    daily_rate_limit: 5,
  });
  const [keyDirty, setKeyDirty] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData({
        provider: config.provider || 'gemini',
        model: config.model || config.model_name || 'gemini-1.5-flash',
        base_url: config.base_url || '',
        api_key: config.api_key_masked || '',
        system_prompt: config.system_prompt || '',
        daily_rate_limit: config.daily_rate_limit || 5,
      });
      setKeyDirty(false);
    }
  }, [config]);

  const handleChange = (field, value) => {
    if (field === 'api_key') setKeyDirty(true);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!keyDirty && payload.api_key?.startsWith('••••')) {
      delete payload.api_key;
    }
    onSave(payload);
  };

  const promptChars = formData.system_prompt?.length || 0;
  const estimatedTokens = Math.round(promptChars / 4);
  const isPromptValid = promptChars > 15;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormSelect
          label="LLM Provider"
          id="provider-select"
          value={formData.provider}
          onChange={(e) => handleChange('provider', e.target.value)}
          options={PROVIDER_OPTIONS}
        />
        <FormInput
          label="Model Identifier"
          id="model-input"
          placeholder="e.g. gemini-1.5-flash or gpt-4o-mini"
          value={formData.model}
          onChange={(e) => handleChange('model', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="API Base URL (Optional)"
          id="base-url-input"
          placeholder="e.g. https://api.openai.com/v1"
          value={formData.base_url}
          onChange={(e) => handleChange('base_url', e.target.value)}
          helper="Custom OpenAI-compatible gateway"
        />
        <div>
          <FormInput
            label="API Key (Write-Only, AES-256 Encrypted)"
            id="api-key-input"
            type="text"
            placeholder={config?.api_key_masked ? config.api_key_masked : 'Enter API Key...'}
            value={formData.api_key}
            onChange={(e) => handleChange('api_key', e.target.value)}
            helper={keyDirty ? 'New key will be encrypted at rest' : 'Stored securely as ••••last4'}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-mono">
          <label htmlFor="system-prompt" className="text-slate-300 font-medium uppercase tracking-wider">
            System Prompt & Guardrails
          </label>
          <div className="flex items-center gap-3">
            <span className="text-slate-500">
              {promptChars} chars (~{estimatedTokens} tok)
            </span>
            {!isPromptValid && (
              <span className="text-terminal-rose text-xs font-semibold px-2 py-0.5 rounded bg-terminal-rose/10 border border-terminal-rose/30">
                ⚠️ Too short
              </span>
            )}
          </div>
        </div>
        <FormTextarea
          id="system-prompt"
          rows={6}
          placeholder="Define agent persona, grounding rules, and NDA guardrails..."
          value={formData.system_prompt}
          onChange={(e) => handleChange('system_prompt', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <FormInput
          label="Daily Rate Limit per Salted IP Hash"
          id="rate-limit-input"
          type="number"
          min="1"
          max="500"
          value={formData.daily_rate_limit}
          onChange={(e) => handleChange('daily_rate_limit', Number(e.target.value))}
          helper="Immediate threshold applied to anonymous clients"
          required
        />

        <div className="flex items-center gap-3 pb-3.5">
          <AdminButton
            type="button"
            variant="secondary"
            loading={testingLatency}
            onClick={() => onTestLatency(formData)}
            className="flex-1"
          >
            ⚡ Test Provider Latency
          </AdminButton>

          {latencyResult && (
            <div
              data-testid="latency-badge"
              className={`px-3 py-2 rounded font-mono text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap ${
                latencyResult.success
                  ? latencyResult.latency_ms < 300
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-terminal-rose/10 text-terminal-rose border-terminal-rose/30'
              }`}
            >
              <span>⚡</span>
              <span>{latencyResult.latency_ms}ms</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <AdminButton type="submit" loading={saving} className="min-w-[160px]">
          Save Settings
        </AdminButton>
      </div>
    </form>
  );
};

export default LlmConfigForm;
