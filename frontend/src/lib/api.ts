/**
 * API Client for LMS Backend
 * Centralized API communication layer
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;
    
    let url = `${this.baseUrl}${endpoint}`;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // GET request
  get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  // POST request
  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request
  patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);

// API Endpoints
export const endpoints = {
  // Dashboard
  dashboard: {
    stats: '/dashboard/stats',
  },
  
  // Loan Products
  loanProducts: {
    list: '/loan-products',
    get: (id: string) => `/loan-products/${id}`,
    create: '/loan-products',
    update: (id: string) => `/loan-products/${id}`,
    delete: (id: string) => `/loan-products/${id}`,
  },
  
  // Loan Applications
  applications: {
    list: '/applications',
    get: (id: string) => `/applications/${id}`,
    create: '/applications',
    update: (id: string) => `/applications/${id}`,
    updateStatus: (id: string) => `/applications/${id}/status`,
    delete: (id: string) => `/applications/${id}`,
  },
  
  // Ongoing Loans
  loans: {
    list: '/loans',
    get: (id: string) => `/loans/${id}`,
    recordPayment: (id: string) => `/loans/${id}/payment`,
    getEmiSchedule: (id: string) => `/loans/${id}/emi-schedule`,
  },
  
  // Collateral Management
  collaterals: {
    list: '/collaterals',
    get: (id: string) => `/collaterals/${id}`,
    create: '/collaterals',
    update: (id: string) => `/collaterals/${id}`,
    markLien: (id: string) => `/collaterals/${id}/lien`,
    releaseLien: (id: string) => `/collaterals/${id}/release`,
    updateNav: '/collaterals/update-nav',
  },
};
