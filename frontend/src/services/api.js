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
