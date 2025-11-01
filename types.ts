export enum UserRole {
  Farmer = 'Farmer',
  Lab = 'Lab Technician',
  Manufacturer = 'Manufacturer',
}

export interface User {
  id: string;
  name: string; // Farmer/Collector name, Lab name, Company name
  email: string;
  role: UserRole;
  // Common
  phone?: string;
  // Farmer specific
  location?: GeolocationCoordinates;
  address?: string;
  aadhar?: string;
  // Lab specific
  labRegId?: string;
  // Manufacturer specific
  gstin?: string;
  manufacturerId?: string;
}

export enum HerbStatus {
    Harvested = 'Harvested',
    AwaitingPickup = 'Awaiting Pickup',
    PickedUp = 'Picked Up',
    InLab = 'In Lab',
    Approved = 'Approved',
    Rejected = 'Rejected',
    ReceivedByManufacturer = 'Received by Manufacturer',
}

export interface GeolocationCoordinates {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

export interface Herb {
  id: string;
  name: string;
  quantity: number; // in kg
  farmerId: string;
  location: GeolocationCoordinates;
  harvestDate: string;
  imageURL?: string;
  status: HerbStatus;
  batchId?: string;
}

export interface Batch {
  id: string;
  herbIds: string[];
  labId: string;
  manufacturerId?: string;
  status: HerbStatus;
  reportURL?: string;
  pickupDate: string;
  vehicleNo: string;
}

export enum ActionType {
    FARMER_SUBMIT = 'FARMER_SUBMIT',
    FARMER_DISPATCH_TO_LAB = 'FARMER_DISPATCH_TO_LAB',
    LAB_TEST = 'LAB_TEST',
    MANUFACTURER_RECEIVE = 'MANUFACTURER_RECEIVE',
}

export interface Transaction {
  id: string;
  batchId: string;
  actorRole: UserRole;
  actorId: string;
  timestamp: string;
  gps?: GeolocationCoordinates;
  actionType: ActionType;
  details: Record<string, any>;
}

export enum RequestStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

export enum RequestType {
  FarmerToLab = 'FarmerToLab', // Farmer requests testing/dispatch to Lab
  LabToManufacturer = 'LabToManufacturer', // Lab notifies/requests Manufacturer post-approval
}

export interface HerbRequest {
  id: string;
  type: RequestType;
  requesterId: string;
  requesterInfo?: User;
  receiverId: string;
  receiverInfo?: User;
  herbIds: string[];
  herbInfos?: Herb[];
  message: string;
  status: RequestStatus;
  createdAt: string;
}
