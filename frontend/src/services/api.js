// Auto-detect API URL: use current domain in production, env variable in development
const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
  ? window.location.origin 
  : process.env.REACT_APP_BACKEND_URL;

// Helper to get auth headers
const getHeaders = () => {
  const token = localStorage.getItem('advisorypro_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Handle API errors
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'Request failed');
  }
  return response.json();
};

// Client API
export const clientsApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/api/clients`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (clientId) => {
    const response = await fetch(`${API_URL}/api/clients/${clientId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (clientData) => {
    const response = await fetch(`${API_URL}/api/clients`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(clientData),
    });
    return handleResponse(response);
  },

  update: async (clientId, updateData) => {
    const response = await fetch(`${API_URL}/api/clients/${clientId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updateData),
    });
    return handleResponse(response);
  },

  delete: async (clientId) => {
    const response = await fetch(`${API_URL}/api/clients/${clientId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateFinancialData: async (clientId, financialData) => {
    const response = await fetch(`${API_URL}/api/clients/${clientId}/financial-data`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(financialData),
    });
    return handleResponse(response);
  },

  getAnalysis: async (clientId) => {
    const response = await fetch(`${API_URL}/api/clients/${clientId}/analysis`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  refreshAnalysis: async (clientId) => {
    const response = await fetch(`${API_URL}/api/clients/${clientId}/analysis/refresh`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// Calculations API
export const calculationsApi = {
  save: async (calculationData) => {
    const response = await fetch(`${API_URL}/api/calculations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(calculationData),
    });
    return handleResponse(response);
  },

  getByClient: async (clientId) => {
    const response = await fetch(`${API_URL}/api/calculations/client/${clientId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getByType: async (clientId, calcType) => {
    const response = await fetch(`${API_URL}/api/calculations/client/${clientId}/type/${calcType}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (calcId) => {
    const response = await fetch(`${API_URL}/api/calculations/${calcId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  delete: async (calcId) => {
    const response = await fetch(`${API_URL}/api/calculations/${calcId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// Goals API
export const goalsApi = {
  create: async (goalData) => {
    const response = await fetch(`${API_URL}/api/tools/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(goalData),
    });
    return handleResponse(response);
  },

  getByClient: async (clientId) => {
    const response = await fetch(`${API_URL}/api/tools/goals/client/${clientId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  update: async (goalId, updateData) => {
    const response = await fetch(`${API_URL}/api/tools/goals/${goalId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updateData),
    });
    return handleResponse(response);
  },

  delete: async (goalId) => {
    const response = await fetch(`${API_URL}/api/tools/goals/${goalId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// Meetings API
export const meetingsApi = {
  create: async (meetingData) => {
    const response = await fetch(`${API_URL}/api/tools/meetings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(meetingData),
    });
    return handleResponse(response);
  },

  getByClient: async (clientId) => {
    const response = await fetch(`${API_URL}/api/tools/meetings/client/${clientId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getPendingActionItems: async () => {
    const response = await fetch(`${API_URL}/api/tools/meetings/action-items`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// Reviews API
export const reviewsApi = {
  create: async (reviewData) => {
    const response = await fetch(`${API_URL}/api/tools/reviews`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reviewData),
    });
    return handleResponse(response);
  },

  getByClient: async (clientId) => {
    const response = await fetch(`${API_URL}/api/tools/reviews/client/${clientId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getUpcoming: async (days = 30) => {
    const response = await fetch(`${API_URL}/api/tools/reviews/upcoming?days=${days}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// Reports API
export const reportsApi = {
  downloadAnalysis: (clientId, currency = 'ZAR') => {
    const token = localStorage.getItem('advisorypro_token');
    return `${API_URL}/api/tools/reports/client/${clientId}/analysis?currency=${currency}&token=${token}`;
  },

  downloadGoals: (clientId, currency = 'ZAR') => {
    const token = localStorage.getItem('advisorypro_token');
    return `${API_URL}/api/tools/reports/client/${clientId}/goals?currency=${currency}&token=${token}`;
  },
};

// Portfolio API
export const portfolioApi = {
  get: async (clientId) => {
    const response = await fetch(`${API_URL}/api/portfolio/client/${clientId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createOrUpdate: async (clientId, portfolioData) => {
    const response = await fetch(`${API_URL}/api/portfolio/client/${clientId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(portfolioData),
    });
    return handleResponse(response);
  },

  getRebalancingSuggestions: async (clientId) => {
    const response = await fetch(`${API_URL}/api/portfolio/client/${clientId}/rebalance`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// Loans API
export const loansApi = {
  compare: async (clientId, purpose, options) => {
    const response = await fetch(`${API_URL}/api/portfolio/loans/compare?client_id=${clientId}&purpose=${purpose}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(options),
    });
    return handleResponse(response);
  },

  getByClient: async (clientId) => {
    const response = await fetch(`${API_URL}/api/portfolio/loans/client/${clientId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// Fees API
export const feesApi = {
  calculate: async (clientId, feeData) => {
    const response = await fetch(`${API_URL}/api/portfolio/fees/calculate?client_id=${clientId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(feeData),
    });
    return handleResponse(response);
  },
};

// Monte Carlo API
export const monteCarloApi = {
  runRetirement: async (params) => {
    const response = await fetch(`${API_URL}/api/portfolio/monte-carlo/retirement`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    return handleResponse(response);
  },
};

// Subscription API
export const subscriptionApi = {
  getPricing: async () => {
    const response = await fetch(`${API_URL}/api/subscriptions/pricing`);
    return handleResponse(response);
  },

  getCurrentSubscription: async () => {
    const response = await fetch(`${API_URL}/api/subscriptions/current`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createCheckout: async (tier, billingCycle) => {
    const response = await fetch(`${API_URL}/api/subscriptions/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        tier,
        billing_cycle: billingCycle,
        origin_url: window.location.origin,
      }),
    });
    return handleResponse(response);
  },

  getCheckoutStatus: async (sessionId) => {
    const response = await fetch(`${API_URL}/api/subscriptions/checkout/status/${sessionId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  startTrial: async (tier) => {
    const response = await fetch(`${API_URL}/api/subscriptions/start-trial?tier=${tier}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// Coupon API
export const couponApi = {
  redeem: async (code) => {
    const response = await fetch(`${API_URL}/api/coupons/redeem`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code }),
    });
    return handleResponse(response);
  },

  validate: async (code) => {
    const response = await fetch(`${API_URL}/api/coupons/validate/${encodeURIComponent(code)}`);
    return handleResponse(response);
  },
};

// Market Data API
export const marketApi = {
  getData: async () => {
    const response = await fetch(`${API_URL}/api/market/data`);
    return handleResponse(response);
  },

  refresh: async () => {
    const response = await fetch(`${API_URL}/api/market/refresh`);
    return handleResponse(response);
  },
};

// Analytics API
export const analyticsApi = {
  getDashboard: async () => {
    const response = await fetch(`${API_URL}/api/analytics/dashboard`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getUsers: async (limit = 100, skip = 0) => {
    const response = await fetch(`${API_URL}/api/analytics/users?limit=${limit}&skip=${skip}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getStats: async () => {
    const response = await fetch(`${API_URL}/api/analytics/stats`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};


// Export API_URL for direct use where needed
export { API_URL };