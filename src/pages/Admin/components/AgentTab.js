import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  getLlmConfig,
  updateLlmConfig,
  testLlmLatency,
  getConversations,
  exportConversationAsDemo
} from '../../../services/api';
import LlmConfigForm from './Agent/LlmConfigForm';
import TelemetryTable from './Agent/TelemetryTable';

const AgentTab = () => {
  const [config, setConfig] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingLatency, setTestingLatency] = useState(false);
  const [latencyResult, setLatencyResult] = useState(null);

  const fetchAgentData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedConfig, fetchedConversations] = await Promise.all([
        getLlmConfig().catch((err) => {
          console.warn('[AgentTab] Error fetching LLM config:', err);
          return null;
        }),
        getConversations().catch((err) => {
          console.warn('[AgentTab] Error fetching conversations:', err);
          return [];
        }),
      ]);

      if (fetchedConfig) setConfig(fetchedConfig);
      if (Array.isArray(fetchedConversations)) setConversations(fetchedConversations);
    } catch (e) {
      toast.error('Failed to load agent configuration: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgentData();
  }, [fetchAgentData]);

  const handleSaveConfig = async (formData) => {
    setSaving(true);
    try {
      const result = await updateLlmConfig(formData);
      setConfig(result?.config || result || formData);
      toast.success('LLM configuration saved successfully');
    } catch (err) {
      toast.error('Failed to save LLM configuration: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestLatency = async (params) => {
    setTestingLatency(true);
    setLatencyResult(null);
    try {
      const res = await testLlmLatency(params);
      setLatencyResult(res);
      if (res?.success) {
        toast.success(`Latency test passed: ${res.latency_ms}ms`);
      } else {
        toast.warn(`Latency test completed with notice: ${res.error || res.reply}`);
      }
    } catch (err) {
      toast.error('Latency test failed: ' + err.message);
      setLatencyResult({ success: false, latency_ms: 0, error: err.message });
    } finally {
      setTestingLatency(false);
    }
  };

  const handleExportDemo = (conv) => {
    try {
      const demoTrace = exportConversationAsDemo(conv);
      if (demoTrace && typeof window !== 'undefined') {
        // Trigger download of demo trace json
        const blob = new Blob([JSON.stringify(demoTrace, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scripted-demo-${demoTrace.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      toast.success('Exported as Scripted Demo into fallback trace repository!');
    } catch (err) {
      toast.error('Failed to export scripted demo: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <span className="inline-block w-6 h-6 border-2 border-cyan-electric border-t-transparent rounded-full animate-spin mr-3" />
        <span className="font-mono text-sm text-cyan-electric">Loading Agent Console...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex justify-between items-center pb-2 border-b border-cyber-border/60">
        <div>
          <h2 className="text-base font-mono font-bold text-cyan-electric uppercase tracking-wider flex items-center gap-2">
            <span>Agent Console</span>
            <span className="px-2 py-0.5 text-[10px] bg-cyan-electric/10 text-cyan-electric border border-cyan-electric/30 rounded">
              v1.0
            </span>
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Manage LLM proxy providers, live latency testing, guardrails, and conversation telemetry.
          </p>
        </div>
      </div>

      {/* 2. Provider Settings Card */}
      <div className="bg-cyber-card/60 border border-cyber-border rounded-lg p-5 space-y-4">
        <div className="border-b border-cyber-border/40 pb-2">
          <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider">
            LLM Provider & Parameter Configuration
          </h3>
          <p className="text-xs font-mono text-slate-500">
            API keys are write-only from UI and encrypted at rest with AES-256-GCM.
          </p>
        </div>
        <LlmConfigForm
          config={config}
          onSave={handleSaveConfig}
          onTestLatency={handleTestLatency}
          testingLatency={testingLatency}
          latencyResult={latencyResult}
          saving={saving}
        />
      </div>

      {/* 3. Conversation Telemetry & Export */}
      <div className="bg-cyber-card/60 border border-cyber-border rounded-lg p-5">
        <TelemetryTable
          conversations={conversations}
          onExportDemo={handleExportDemo}
        />
      </div>
    </div>
  );
};

export default AgentTab;
