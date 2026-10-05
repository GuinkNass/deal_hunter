const BASE_URL = '/api';

export async function fetchAnalyses(filters = {}) {
  const query = new URLSearchParams();
  if (filters.store && filters.store !== 'all') query.set('store', filters.store);
  if (filters.verdict && filters.verdict !== 'all') query.set('verdict', filters.verdict);
  if (filters.source_type && filters.source_type !== 'all') query.set('source_type', filters.source_type);
  if (filters.search) query.set('search', filters.search);
  if (filters.sort) query.set('sort', filters.sort);
  if (filters.limit) query.set('limit', filters.limit);
  if (filters.offset) query.set('offset', filters.offset);

  const res = await fetch(`${BASE_URL}/analyses?${query.toString()}`);
  return res.json();
}

export async function fetchAnalysisById(id) {
  const res = await fetch(`${BASE_URL}/analyses/${id}`);
  return res.json();
}

export async function deleteAnalysis(id) {
  const res = await fetch(`${BASE_URL}/analyses/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function runManualAnalysis(data) {
  const res = await fetch(`${BASE_URL}/analyses/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function previewUrl(url) {
  const res = await fetch(`${BASE_URL}/analyses/preview-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${BASE_URL}/settings`);
  return res.json();
}

export async function updateSettings(settingsMap) {
  const res = await fetch(`${BASE_URL}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings: settingsMap })
  });
  return res.json();
}

export async function testConnection(service) {
  const res = await fetch(`${BASE_URL}/settings/test-connection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service })
  });
  return res.json();
}

export async function fetchStatus() {
  const res = await fetch(`${BASE_URL}/status`);
  return res.json();
}

export async function calculateLiveROI(params) {
  const res = await fetch(`${BASE_URL}/calculator/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return res.json();
}

export async function fetchCalculationsHistory() {
  const res = await fetch(`${BASE_URL}/calculator/history`);
  return res.json();
}

export async function saveCalculation(data) {
  const res = await fetch(`${BASE_URL}/calculator/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteCalculation(id) {
  const res = await fetch(`${BASE_URL}/calculator/history/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function getMLAuthUrl() {
  const res = await fetch(`${BASE_URL}/ml/auth-url`);
  return res.json();
}
