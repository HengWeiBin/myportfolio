// --- FETCH DATA (Unified Serverless Endpoint) ---

export const fetchPortfolioData = async (options = {}) => {
  const baseUrl = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';
  const query = options?.tier ? `?tier=${encodeURIComponent(options.tier)}` : '';
  const response = await fetch(`${baseUrl}/api/portfolio${query}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio data: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};

export const getProjects = async (options = {}) => {
  const data = await fetchPortfolioData(options);
  return data.projects || [];
};

export const getTieredProjects = async () => {
  const data = await fetchPortfolioData();
  return data.tiered_projects || data.tiered?.projects || {};
};

export const getCertificates = async (options = {}) => {
  const data = await fetchPortfolioData(options);
  return data.certificates || [];
};

export const getSkills = async () => {
  const data = await fetchPortfolioData();
  return data.skills || [];
};

export const getExperience = async () => {
  const data = await fetchPortfolioData();
  return data.experience || [];
};

export const getProfile = async () => {
  const data = await fetchPortfolioData();
  return data.profile || {};
};

// --- UPDATE DATA (Protected Admin Methods via Serverless CRUD) ---

export const callAdminCrud = async (action, data = {}, id = null) => {
  const baseUrl = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';

  const headers = {
    'Content-Type': 'application/json'
  };

  if (typeof process !== 'undefined' && process.env?.REACT_APP_ADMIN_API_KEY) {
    headers['x-admin-key'] = process.env.REACT_APP_ADMIN_API_KEY;
  }

  const response = await fetch(`${baseUrl}/api/admin/crud`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({
      action,
      data,
      id: id !== null && id !== undefined ? id : data?.id
    })
  });

  if (!response.ok) {
    let errorMsg = `Admin CRUD failed: ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson?.error) errorMsg = errJson.error;
    } catch {}
    throw new Error(errorMsg);
  }

  const resJson = await response.json();
  return resJson.result;
};

export const addProject = async (project) => {
  const tier = project.tier || 'standard';
  const sort_order = project.sort_order !== undefined && project.sort_order !== '' ? Number(project.sort_order) : 0;
  const is_confidential = Boolean(project.is_confidential);
  const repo_visibility = project.repo_visibility || 'public';
  const metrics = typeof project.metrics === 'object' && project.metrics !== null 
    ? project.metrics 
    : (project.metrics || {});
  const tags = Array.isArray(project.tags)
    ? project.tags
    : (typeof project.tags === 'string'
      ? project.tags.split(',').map((s) => s.trim()).filter(Boolean)
      : []);

  return await callAdminCrud('addProject', {
    ...project,
    tier,
    sort_order,
    is_confidential,
    repo_visibility,
    metrics,
    tags
  });
};

export const updateProject = async (id, project) => {
  const tier = project.tier || 'standard';
  const sort_order = project.sort_order !== undefined && project.sort_order !== '' ? Number(project.sort_order) : 0;
  const is_confidential = Boolean(project.is_confidential);
  const repo_visibility = project.repo_visibility || 'public';
  const metrics = typeof project.metrics === 'object' && project.metrics !== null 
    ? project.metrics 
    : (project.metrics || {});
  const tags = Array.isArray(project.tags)
    ? project.tags
    : (typeof project.tags === 'string'
      ? project.tags.split(',').map((s) => s.trim()).filter(Boolean)
      : []);

  return await callAdminCrud('updateProject', {
    ...project,
    tier,
    sort_order,
    is_confidential,
    repo_visibility,
    metrics,
    tags
  }, id);
};

export const deleteProject = async (id) => {
  return await callAdminCrud('deleteProject', {}, id);
};

export const addCertificate = async (cert) => {
  const category = cert.category || 'Certificate';
  const tier = cert.tier || 'standard';
  const sort_order = cert.sort_order !== undefined && cert.sort_order !== '' ? Number(cert.sort_order) : 0;

  return await callAdminCrud('addCertificate', {
    ...cert,
    category,
    tier,
    sort_order
  });
};

export const updateCertificate = async (id, cert) => {
  const category = cert.category || 'Certificate';
  const tier = cert.tier || 'standard';
  const sort_order = cert.sort_order !== undefined && cert.sort_order !== '' ? Number(cert.sort_order) : 0;

  return await callAdminCrud('updateCertificate', {
    ...cert,
    category,
    tier,
    sort_order
  }, id);
};

export const deleteCertificate = async (id) => {
  return await callAdminCrud('deleteCertificate', {}, id);
};

// --- SKILLS CRUD ---

export const addSkill = async (skill) => {
  return await callAdminCrud('addSkill', skill);
};

export const updateSkill = async (id, skill) => {
  return await callAdminCrud('updateSkill', skill, id);
};

export const deleteSkill = async (id) => {
  return await callAdminCrud('deleteSkill', {}, id);
};

// --- EXPERIENCE CRUD ---

export const addExperience = async (exp) => {
  const sort_order = exp.sort_order !== undefined && exp.sort_order !== '' ? Number(exp.sort_order) : 0;
  return await callAdminCrud('addExperience', {
    ...exp,
    sort_order
  });
};

export const updateExperience = async (id, exp) => {
  const sort_order = exp.sort_order !== undefined && exp.sort_order !== '' ? Number(exp.sort_order) : 0;
  return await callAdminCrud('updateExperience', {
    ...exp,
    sort_order
  }, id);
};

export const deleteExperience = async (id) => {
  return await callAdminCrud('deleteExperience', {}, id);
};

// --- PROFILE CRUD ---

export const updateProfile = async (profile) => {
  return await callAdminCrud('updateProfile', profile, profile.id);
};

// --- AGENT CONSOLE & TELEMETRY (Issue #11) ---

export const getLlmConfig = async () => {
  const baseUrl = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';
  const res = await fetch(`${baseUrl}/api/admin/llm/config`, {
    credentials: 'include'
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch LLM config: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.config || data;
};

export const updateLlmConfig = async (config) => {
  const baseUrl = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';
  const res = await fetch(`${baseUrl}/api/admin/llm/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(config)
  });
  if (!res.ok) {
    throw new Error(`Failed to update LLM config: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.config || data;
};

export const testLlmLatency = async (params = {}) => {
  const baseUrl = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';
  const res = await fetch(`${baseUrl}/api/admin/llm/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    throw new Error(`Failed to test LLM latency: ${res.status} ${res.statusText}`);
  }
  return await res.json();
};

export const getConversations = async () => {
  const baseUrl = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';
  const res = await fetch(`${baseUrl}/api/admin/conversations`, {
    credentials: 'include'
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch conversations: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.conversations || [];
};

export const exportConversationAsDemo = (conversation) => {
  if (!conversation) return null;
  const traceId = `exported_${(conversation.id || Date.now()).toString().slice(0, 8)}`;
  const isZh = /[\u4e00-\u9fa5]/.test(conversation.prompt || '');
  const keywords = (conversation.prompt || '')
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
    .split(/\s+/)
    .filter(k => k.length >= 2)
    .slice(0, 8);

  const demoTrace = {
    id: traceId,
    lang: isZh ? 'zh' : 'en',
    keywords,
    thought: `Scripted demonstration generated from conversation ${conversation.session_id || 'telemetry'}`,
    toolCalls: Array.isArray(conversation.tool_trace) ? conversation.tool_trace : [],
    uiActions: [],
    response: conversation.response || ''
  };

  // Persist into localStorage for fallback traces
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = JSON.parse(window.localStorage.getItem('agent_fallback_traces') || '[]');
      const updated = [demoTrace, ...stored.filter(t => t.id !== traceId)];
      window.localStorage.setItem('agent_fallback_traces', JSON.stringify(updated));
    } catch (e) {
      console.warn('[api] Failed to save demo trace to localStorage:', e);
    }
  }

  return demoTrace;
};
