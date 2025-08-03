import axios from 'axios';
import { AuthResponse, Project, Task, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:54995/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Project services
export const projectService = {
  getAll: async (): Promise<{ projects: Project[] }> => {
    const response = await api.get('/projects');
    return response.data;
  },

  getOne: async (id: number): Promise<{ project: Project }> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  create: async (name: string, description: string): Promise<{ project: Project }> => {
    const response = await api.post('/projects', { name, description });
    return response.data;
  },

  update: async (id: number, data: Partial<Project>): Promise<void> => {
    await api.put(`/projects/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  addMember: async (projectId: number, email: string): Promise<void> => {
    await api.post(`/projects/${projectId}/members`, { email });
  },
};

// Task services
export const taskService = {
  getByProject: async (projectId: number): Promise<{ tasks: Task[] }> => {
    const response = await api.get(`/tasks/project/${projectId}`);
    return response.data;
  },

  create: async (task: Omit<Task, 'id' | 'created_at'>): Promise<{ task: Task }> => {
    const response = await api.post('/tasks', task);
    return response.data;
  },

  update: async (id: number, data: Partial<Task>): Promise<void> => {
    await api.put(`/tasks/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  reorder: async (taskId: number, newStatus: string, newPosition: number): Promise<void> => {
    await api.post('/tasks/reorder', { taskId, newStatus, newPosition });
  },
};