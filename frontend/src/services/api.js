const API_URL = process.env.REACT_APP_BACKEND_URL;

// Helper to get auth headers
const getHeaders = () => {
  const token = localStorage.getItem('wealthcalc_token');
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
    const token = localStorage.getItem('wealthcalc_token');
    return `${API_URL}/api/tools/reports/client/${clientId}/analysis?currency=${currency}&token=${token}`;
  },

  downloadGoals: (clientId, currency = 'ZAR') => {
    const token = localStorage.getItem('wealthcalc_token');
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
