// EntryX API Client
const BASE_URL = '/api';

export const api = {
  // Health
  getHealth: async () => {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  // Theaters
  getTheaters: async () => {
    const res = await fetch(`${BASE_URL}/theaters`);
    return res.json();
  },

  // Shows
  getShows: async (theaterId) => {
    const query = theaterId ? `?theaterId=${theaterId}` : '';
    const res = await fetch(`${BASE_URL}/shows${query}`);
    return res.json();
  },

  // Staff accounts
  getStaff: async (theaterId) => {
    const query = theaterId ? `?theaterId=${theaterId}` : '';
    const res = await fetch(`${BASE_URL}/staff${query}`);
    return res.json();
  },

  // Staff PIN Login
  login: async (pin, theaterId) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, theaterId })
    });
    return res.json();
  },

  // Atomic Ticket Redemption
  redeemTicket: async ({ rawPayload, activeShowId, activeScreenId, staffUser, theaterId, deviceInfo }) => {
    const res = await fetch(`${BASE_URL}/tickets/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawPayload,
        activeShowId,
        activeScreenId,
        staffUser,
        theaterId,
        deviceInfo
      })
    });
    return res.json();
  },

  // Inspect ticket (without redeeming)
  inspectTicket: async (rawPayload) => {
    const res = await fetch(`${BASE_URL}/tickets/inspect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawPayload })
    });
    return res.json();
  },

  // Race Condition Concurrency Simulator
  simulateRace: async ({ rawPayload, activeShowId, activeScreenId, theaterId, scannersCount }) => {
    const res = await fetch(`${BASE_URL}/tickets/simulate-race`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawPayload,
        activeShowId,
        activeScreenId,
        theaterId,
        scannersCount
      })
    });
    return res.json();
  },

  // Get Tickets Manifest
  getTickets: async (theaterId, showId) => {
    const params = new URLSearchParams();
    if (theaterId) params.append('theaterId', theaterId);
    if (showId) params.append('showId', showId);
    const res = await fetch(`${BASE_URL}/tickets?${params.toString()}`);
    return res.json();
  },

  // Create/Import Ticket
  createTicket: async (ticketData) => {
    const res = await fetch(`${BASE_URL}/tickets/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData)
    });
    return res.json();
  },

  // Reset show tickets to unredeemed
  resetShow: async (showId) => {
    const res = await fetch(`${BASE_URL}/tickets/reset-show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showId })
    });
    return res.json();
  },

  // Audit Logs
  getAuditLogs: async ({ theaterId, showId, status, limit }) => {
    const params = new URLSearchParams();
    if (theaterId) params.append('theaterId', theaterId);
    if (showId) params.append('showId', showId);
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit);
    const res = await fetch(`${BASE_URL}/audit-logs?${params.toString()}`);
    return res.json();
  },

  // Verify Audit Ledger Integrity
  verifyLedger: async () => {
    const res = await fetch(`${BASE_URL}/audit-logs/verify`);
    return res.json();
  },

  // Analytics
  getAnalytics: async (theaterId, showId) => {
    const params = new URLSearchParams();
    if (theaterId) params.append('theaterId', theaterId);
    if (showId) params.append('showId', showId);
    const res = await fetch(`${BASE_URL}/analytics?${params.toString()}`);
    return res.json();
  }
};
