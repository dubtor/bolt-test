export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
} 