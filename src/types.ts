export type StakeholderType = 'beekeeper' | 'trader' | 'processor';

export interface Stakeholder {
  id: string;
  uniqueId: string;
  type: StakeholderType;
  name: string;
  phone: string;
  email: string;
  address: string;
  registeredDate: string;
  password: string;
}

export interface ApiaryLocation {
  id: string;
  beekeeperId: string;
  location: string;
  latitude?: string;
  longitude?: string;
  dateOfArrival: string;
  majorFlora: string;
  numberOfColonies: number;
}

export interface MaintenanceLog {
  id: string;
  beekeeperId: string;
  apiaryId: string;
  date: string;
  activity: string;
  notes: string;
}

export interface Harvest {
  id: string;
  beekeeperId: string;
  apiaryId: string;
  harvestDate: string;
  quantity: number; // in kg
  harvestedAmount: number; // in kg
  remainingAmount: number; // in kg
  quality: string;
  batchId: string;
}

export interface Sale {
  id: string;
  sellerId: string;
  sellerType: StakeholderType;
  buyerId: string;
  buyerName: string;
  buyerType: StakeholderType | 'consumer';
  invoiceNumber: string;
  saleDate: string;
  quantity: number; // in kg
  pricePerKg: number;
  totalAmount: number;
  batchId: string;
  traceabilityChain: string[]; // array of stakeholder IDs in chain
  status: 'completed' | 'pending';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  saleId: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  date: string;
  quantity: number;
  pricePerKg: number;
  totalAmount: number;
  batchId: string;
  traceabilityChain: TraceabilityEntry[];
}

export interface TraceabilityEntry {
  stakeholderId: string;
  stakeholderName: string;
  stakeholderType: StakeholderType;
  uniqueId: string;
  action: string;
  date: string;
}
