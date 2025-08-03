export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  project_id: number;
  status: 'todo' | 'in_progress' | 'done';
  position: number;
  assigned_to?: number;
  assigned_to_name?: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}