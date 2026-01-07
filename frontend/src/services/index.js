import api from './api';
import { preparationService } from './preparationService';
import { toolkitService } from './toolkitService';

export const authService = {
  async register(email, password, first_name, last_name) {
    const response = await api.post('/auth/register/', {
      email,
      password,
      first_name,
      last_name,
    });
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/auth/login/', { email, password });
    const { access, refresh, user } = response.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    return response.data;
  },

  async verifyEmail(token) {
    const response = await api.post('/auth/verify-email/', { token });
    return response.data;
  },

  async resendVerificationEmail(email) {
    const response = await api.post('/auth/resend-verification/', { email });
    return response.data;
  },

  async getGoogleOAuthUrl() {
    const response = await api.get('/auth/google/');
    return response.data;
  },

  async handleGoogleOAuthCallback(code, state) {
    const response = await api.post('/auth/google/callback/', { code, state });
    return response.data;
  },

  async requestPasswordReset(email) {
    const response = await api.post('/auth/password-reset/', { email });
    return response.data;
  },

  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/password-reset-confirm/', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.patch('/auth/me/', data);
    return response.data;
  },

  async deleteAccount(password) {
    await api.post('/auth/delete-account/', { password });
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },
};

export const courseService = {
  async getAll() {
    const response = await api.get('/courses/');
    console.log('courseService.getAll() raw response:', response);
    console.log('courseService.getAll() response.data:', response.data);
    console.log('Is array?:', Array.isArray(response.data));
    
    if (Array.isArray(response.data)) {
      console.log('Returning as array');
      return response.data;
    }
    console.log('Returning results or data');
    return response.data.results || response.data;
  },

  async getById(id) {
    const response = await api.get(`/courses/${id}/`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/courses/', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.patch(`/courses/${id}/`, data);
    return response.data;
  },

  async delete(id) {
    await api.delete(`/courses/${id}/`);
  },
};

export const materialService = {
  async getAll(courseId = null) {
    const params = courseId ? { course_id: courseId } : {};
    const response = await api.get('/materials/', { params });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || response.data;
  },

  async getByCourse(courseId) {
    const response = await api.get(`/materials/?course_id=${courseId}`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || response.data;
  },

  async upload(formData) {
    const response = await api.post('/materials/upload-material/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async create(data) {
    const response = await api.post('/materials/', data);
    return response.data;
  },

  async delete(id) {
    await api.delete(`/materials/${id}/`);
  },

  async getTrash() {
    const response = await api.get('/materials/trash/');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || response.data;
  },

  async restore(id) {
    const response = await api.post(`/materials/${id}/restore/`);
    return response.data;
  },

  async permanentDelete(id) {
    await api.delete(`/materials/${id}/permanent-delete/`);
  },

  async emptyTrash() {
    const response = await api.delete('/materials/trash/empty/');
    return response.data;
  },
};

export const usageService = {
  async get() {
    const response = await api.get('/usage/');
    return response.data;
  },
};

export const semesterService = {
  async getAll() {
    const response = await api.get('/courses/semesters/');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || response.data || [];
  },

  async create(data) {
    const response = await api.post('/courses/semesters/create/', data);
    return response.data;
  },

  async delete(name) {
    const response = await api.delete('/courses/semesters/delete/', { data: { name } });
    return response.data;
  },
};

export const todoService = {
  async getAll() {
    const response = await api.get('/todos/');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || response.data || [];
  },

  async create(data) {
    const response = await api.post('/todos/', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.patch(`/todos/${id}/`, data);
    return response.data;
  },

  async delete(id) {
    await api.delete(`/todos/${id}/`);
  },
};

export const todoCategoryService = {
  async getAll() {
    const response = await api.get('/todos/categories/');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || response.data || [];
  },

  async create(data) {
    const response = await api.post('/todos/categories/', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.patch(`/todos/categories/${id}/`, data);
    return response.data;
  },

  async delete(id) {
    await api.delete(`/todos/categories/${id}/`);
  },
};

export { preparationService, toolkitService };
