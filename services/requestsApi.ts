import { apiRequest } from './api';
import { HerbRequest, RequestStatus, RequestType, User, UserRole } from '../types';

type BackendRole = 'farmer'|'lab'|'manufacturer';
const roleFromBackend = (r: BackendRole): UserRole => {
  switch (r) {
    case 'farmer': return UserRole.Farmer;
    case 'lab': return UserRole.Lab;
    case 'manufacturer': return UserRole.Manufacturer;
    default: return UserRole.Farmer;
  }
};

export async function sendRequestApi(data: { type: RequestType; receiverId?: string; receiverEmail?: string; herbIds?: string[]; message?: string; }): Promise<HerbRequest> {
  // Map RequestType to backend strings
  const type = data.type === RequestType.FarmerToLab ? 'FarmerToLab' : 'LabToManufacturer';
  const res = await apiRequest<any>('/requests/send', {
    method: 'POST',
    body: JSON.stringify({ type, receiverId: data.receiverId, receiverEmail: data.receiverEmail, herbIds: data.herbIds || [], message: data.message })
  });
  // Minimal mapping back; details will be populated when fetching
  return {
    id: res._id,
    type: data.type,
    requesterId: '',
    receiverId: data.receiverId || '',
    herbIds: data.herbIds || [],
    message: data.message || '',
    status: RequestStatus.Pending,
    createdAt: res.createdAt,
  } as unknown as HerbRequest;
}

export async function getMyRequests(): Promise<HerbRequest[]> {
  const res = await apiRequest<any[]>('/requests/mine');
  return res.map(r => ({
    id: r._id,
    type: r.type === 'FarmerToLab' ? RequestType.FarmerToLab : RequestType.LabToManufacturer,
    requesterId: r.requesterId,
    receiverId: r.receiverId,
    herbIds: r.herbIds || [],
    message: r.message || '',
    status: r.status as RequestStatus,
    createdAt: r.createdAt,
    requesterInfo: r.requesterInfo ? ({ id: r.requesterInfo._id, name: r.requesterInfo.name, email: r.requesterInfo.email, role: roleFromBackend(r.requesterInfo.role) } as User) : undefined,
    receiverInfo: r.receiverInfo ? ({ id: r.receiverInfo._id, name: r.receiverInfo.name, email: r.receiverInfo.email, role: roleFromBackend(r.receiverInfo.role) } as User) : undefined,
    herbInfos: (r.herbInfos || []).map((h: any) => ({ id: h.id, name: h.name, quantity: h.quantity })),
    receiverEmail: r.receiverEmail
  } as any as HerbRequest)) as HerbRequest[];
}

export async function updateRequestStatusApi(id: string, status: RequestStatus): Promise<void> {
  await apiRequest(`/requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function clearIncomingRequestsApi(): Promise<{ deletedCount: number }> {
  return apiRequest<{ deletedCount: number }>(`/requests/incoming`, {
    method: 'DELETE'
  });
}
