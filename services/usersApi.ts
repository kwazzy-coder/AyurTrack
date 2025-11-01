import { apiRequest } from './api';
import { User, UserRole } from '../types';

export async function searchLabsApi(query: string): Promise<User[]> {
  const q = encodeURIComponent(query || '');
  const res = await apiRequest<Array<{ id: string; name: string; email: string; role: 'lab' }>>(`/auth/labs?q=${q}`);
  return res.map(u => ({ id: u.id, name: u.name, email: u.email, role: UserRole.Lab } as User));
}
