const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const AUTH_TOKEN_KEY = "dav_admin_token";

const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

const request = async (path, options = {}) => {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const error = new Error(data?.message || "Erreur de communication avec l'API.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const adminApi = {
  async login(email, password) {
    const response = await request("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (response?.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  user() {
    return request("/user");
  },

  logout() {
    const result = request("/logout", {
      method: "POST",
    });
    setAuthToken(null);
    return result;
  },
  async getProducts() {
    return request('/products');
  },
  async getRdvs() {
    return request('/rdv');
  },
  async getBeautyServices(sectionKey = 'rendezvous') {
    return request(`/beauty-services?section_key=${encodeURIComponent(sectionKey)}`);
  },
  async createBeautyService(formData) {
    return request('/beauty-services', {
      method: 'POST',
      body: formData,
    });
  },
  async updateBeautyService(id, formData) {
    return request(`/beauty-services/${id}`, {
      method: 'POST',
      body: formData,
    });
  },
  async deleteBeautyService(id) {
    return request(`/beauty-services/${id}`, {
      method: 'DELETE',
    });
  },
};
