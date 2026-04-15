import { apiFetch } from './client.js';

export const getHealth = () => apiFetch('/api/health');

export const getSummary = (id, title, abstract) => {
  const params = new URLSearchParams({ title, abstract });
  return apiFetch(`/api/papers/${encodeURIComponent(id)}/summary?${params}`);
};

export const getInsights = (id, title, abstract) => {
  const params = new URLSearchParams({ title, abstract });
  return apiFetch(`/api/papers/${encodeURIComponent(id)}/insights?${params}`);
};

export const searchPapers = (params) =>
  apiFetch('/api/search', { method: 'POST', body: JSON.stringify(params) });

/** Research Gap Detection — POST /api/gaps/analyze */
export const analyzeGaps = ({ searchId, query, papers }) =>
  apiFetch('/api/gaps/analyze', {
    method: 'POST',
    body: JSON.stringify({
      search_id: searchId,
      query,
      papers: papers.map((p) => ({
        id:       p.id,
        title:    p.title,
        abstract: p.abstract,
      })),
    }),
  });

/** Topic Discovery — POST /api/topics/suggest */
export const suggestTopics = ({ interests, skill_level, goal }) =>
  apiFetch('/api/topics/suggest', {
    method: 'POST',
    body: JSON.stringify({ interests, skill_level, goal }),
  });

// ── Auth ──────────────────────────────────────────────────────────────────────

export const signup = ({ email, username, password }) =>
  apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  });

export const login = ({ email, password }) =>
  apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const getMe = () => apiFetch('/api/auth/me');

// ── User Profile (server-side) ────────────────────────────────────────────────

export const getUserProfile = () => apiFetch('/api/user/profile');

export const saveUserProfile = (profile) =>
  apiFetch('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
