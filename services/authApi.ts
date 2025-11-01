import { apiRequest, setToken } from './api';
import { User, UserRole } from '../types';

type BackendUser = { id: string; name: string; email: string; role: 'farmer'|'lab'|'manufacturer' };

const roleToBackend = (r: UserRole): BackendUser['role'] => {
  switch (r) {
    case UserRole.Farmer: return 'farmer';
    case UserRole.Lab: return 'lab';
    case UserRole.Manufacturer: return 'manufacturer';
    default: return 'farmer';
  }
};

const roleFromBackend = (r: BackendUser['role']): UserRole => {
  switch (r) {
    case 'farmer': return UserRole.Farmer;
    case 'lab': return UserRole.Lab;
    case 'manufacturer': return UserRole.Manufacturer;
    default: return UserRole.Farmer;
  }
};

export async function registerUser(data: { name: string; email: string; password: string; role: UserRole; location?: { latitude: number; longitude: number } }): Promise<User> {
  const payload: any = {
    name: data.name,
    email: data.email,
    password: data.password,
    role: roleToBackend(data.role)
  };
  if (data.role === UserRole.Farmer && data.location) {
    payload.location = { type: 'Point', coordinates: [data.location.longitude, data.location.latitude] };
  }
  const res = await apiRequest<{ token: string; user: BackendUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  setToken(res.token);
  const user: User = { id: res.user.id, name: res.user.name, email: res.user.email, role: roleFromBackend(res.user.role) } as User;
  return user;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const res = await apiRequest<{ token: string; user: BackendUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  setToken(res.token);
  const user: User = { id: res.user.id, name: res.user.name, email: res.user.email, role: roleFromBackend(res.user.role) } as User;
  return user;
}
