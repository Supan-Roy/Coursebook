import api from './api';

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
    const { access, refresh } = response.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    return response.data;
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
    return response.data;
  },

  async create(data) {
    const response = await api.post('/courses/', data);
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
    return response.data;
  },

  async create(data) {
    const response = await api.post('/materials/', data);
    return response.data;
  },

  async delete(id) {
    await api.delete(`/materials/${id}/`);
  },
};

export const usageService = {
  async get() {
    const response = await api.get('/usage/');
    return response.data;
  },
};
