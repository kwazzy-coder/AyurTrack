import { apiRequest } from './api';
import { Herb, HerbStatus } from '../types';

function mapStatus(s: string): HerbStatus {
  switch (s) {
    case 'submitted': return HerbStatus.Harvested;
    case 'picked_up': return HerbStatus.PickedUp;
    case 'testing': return HerbStatus.InLab;
    case 'approved': return HerbStatus.Approved;
    case 'rejected': return HerbStatus.Rejected;
    default: return HerbStatus.Harvested;
  }
}

export async function getMyHerbsApi(): Promise<Herb[]> {
  const res = await apiRequest<any[]>('/farmer/myHerbs');
  return res.map(h => ({
    id: h._id,
    name: h.herbName,
    quantity: h.quantity,
    harvestDate: h.harvestDate,
    status: mapStatus(h.status),
    farmerId: h.farmerId,
  } as Herb));
}

export async function addHerbApi(data: { name: string; quantity: number; farmerId: string; location: { latitude: number; longitude: number }; harvestDate: string; }): Promise<Herb> {
  const payload = {
    herbName: data.name,
    quantity: data.quantity,
    farmerId: data.farmerId,
    location: { type: 'Point', coordinates: [data.location.longitude, data.location.latitude] },
    harvestDate: data.harvestDate,
  };
  const h = await apiRequest<any>('/farmer/addHerb', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return {
    id: h._id,
    name: h.herbName,
    quantity: h.quantity,
    harvestDate: h.harvestDate,
    status: mapStatus(h.status),
    farmerId: h.farmerId,
  } as Herb;
}
