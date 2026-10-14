import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Stakeholder, ApiaryLocation, MaintenanceLog, Harvest, Sale, Invoice, TraceabilityEntry } from '../types';
import { generateId } from '../utils/helpers';

interface AppState {
  stakeholders: Stakeholder[];
  apiaries: ApiaryLocation[];
  maintenanceLogs: MaintenanceLog[];
  harvests: Harvest[];
  sales: Sale[];
  invoices: Invoice[];
  currentUser: Stakeholder | null;
}

interface AppContextType extends AppState {
  registerStakeholder: (stakeholder: Omit<Stakeholder, 'id' | 'uniqueId' | 'registeredDate'>) => Stakeholder;
  login: (uniqueId: string, password: string) => boolean;
  logout: () => void;
  addApiary: (apiary: Omit<ApiaryLocation, 'id'>) => void;
  addMaintenanceLog: (log: Omit<MaintenanceLog, 'id'>) => void;
  addHarvest: (harvest: Omit<Harvest, 'id'>) => void;
  addSale: (sale: Omit<Sale, 'id'>) => void;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  getStakeholderById: (id: string) => Stakeholder | undefined;
  getApiariesByBeekeeper: (beekeeperId: string) => ApiaryLocation[];
  getHarvestsByBeekeeper: (beekeeperId: string) => Harvest[];
  getSalesBySeller: (sellerId: string) => Sale[];
  getSalesByBuyer: (buyerId: string) => Sale[];
  getInvoicesBySeller: (sellerId: string) => Invoice[];
  getInvoicesByBuyer: (buyerId: string) => Invoice[];
  getTraceabilityChain: (batchId: string) => TraceabilityEntry[];
  updateHarvestQuantity: (harvestId: string, soldQty: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'honey-traceability-app';

function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }
  return {
    stakeholders: [],
    apiaries: [],
    maintenanceLogs: [],
    harvests: [],
    sales: [],
    invoices: [],
    currentUser: null,
  };
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const registerStakeholder = (data: Omit<Stakeholder, 'id' | 'uniqueId' | 'registeredDate'>): Stakeholder => {
    const prefix = data.type === 'beekeeper' ? 'BK' : data.type === 'trader' ? 'TR' : 'PR';
    const random = Math.floor(100000 + Math.random() * 900000);
    const uniqueId = `${prefix}-${random}`;
    
    const stakeholder: Stakeholder = {
      ...data,
      id: generateId(),
      uniqueId,
      registeredDate: new Date().toISOString().split('T')[0],
    };

    setState(prev => ({
      ...prev,
      stakeholders: [...prev.stakeholders, stakeholder],
    }));

    return stakeholder;
  };

  const login = (uniqueId: string, password: string): boolean => {
    const stakeholder = state.stakeholders.find(
      s => s.uniqueId === uniqueId && s.password === password
    );
    if (stakeholder) {
      setState(prev => ({ ...prev, currentUser: stakeholder }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const addApiary = (apiary: Omit<ApiaryLocation, 'id'>) => {
    setState(prev => ({
      ...prev,
      apiaries: [...prev.apiaries, { ...apiary, id: generateId() }],
    }));
  };

  const addMaintenanceLog = (log: Omit<MaintenanceLog, 'id'>) => {
    setState(prev => ({
      ...prev,
      maintenanceLogs: [...prev.maintenanceLogs, { ...log, id: generateId() }],
    }));
  };

  const addHarvest = (harvest: Omit<Harvest, 'id'>) => {
    setState(prev => ({
      ...prev,
      harvests: [...prev.harvests, { ...harvest, id: generateId() }],
    }));
  };

  const addSale = (sale: Omit<Sale, 'id'>) => {
    setState(prev => ({
      ...prev,
      sales: [...prev.sales, { ...sale, id: generateId() }],
    }));
  };

  const addInvoice = (invoice: Omit<Invoice, 'id'>) => {
    setState(prev => ({
      ...prev,
      invoices: [...prev.invoices, { ...invoice, id: generateId() }],
    }));
  };

  const getStakeholderById = (id: string) => state.stakeholders.find(s => s.id === id);

  const getApiariesByBeekeeper = (beekeeperId: string) =>
    state.apiaries.filter(a => a.beekeeperId === beekeeperId);

  const getHarvestsByBeekeeper = (beekeeperId: string) =>
    state.harvests.filter(h => h.beekeeperId === beekeeperId);

  const getSalesBySeller = (sellerId: string) =>
    state.sales.filter(s => s.sellerId === sellerId);

  const getSalesByBuyer = (buyerId: string) =>
    state.sales.filter(s => s.buyerId === buyerId);

  const getInvoicesBySeller = (sellerId: string) =>
    state.invoices.filter(i => i.sellerId === sellerId);

  const getInvoicesByBuyer = (buyerId: string) =>
    state.invoices.filter(i => i.buyerId === buyerId);

  const getTraceabilityChain = (batchId: string): TraceabilityEntry[] => {
    const chain: TraceabilityEntry[] = [];
    const harvest = state.harvests.find(h => h.batchId === batchId);
    if (harvest) {
      const beekeeper = state.stakeholders.find(s => s.id === harvest.beekeeperId);
      if (beekeeper) {
        chain.push({
          stakeholderId: beekeeper.id,
          stakeholderName: beekeeper.name,
          stakeholderType: 'beekeeper',
          uniqueId: beekeeper.uniqueId,
          action: `Harvested ${harvest.harvestedAmount} kg`,
          date: harvest.harvestDate,
        });
      }
    }

    const sales = state.sales.filter(s => s.batchId === batchId);
    sales.forEach(sale => {
      const seller = state.stakeholders.find(s => s.id === sale.sellerId);
      if (seller) {
        chain.push({
          stakeholderId: seller.id,
          stakeholderName: seller.name,
          stakeholderType: seller.type,
          uniqueId: seller.uniqueId,
          action: `Sold ${sale.quantity} kg`,
          date: sale.saleDate,
        });
      }
      const buyer = state.stakeholders.find(s => s.id === sale.buyerId);
      if (buyer) {
        chain.push({
          stakeholderId: buyer.id,
          stakeholderName: buyer.name,
          stakeholderType: buyer.type,
          uniqueId: buyer.uniqueId,
          action: `Purchased ${sale.quantity} kg`,
          date: sale.saleDate,
        });
      }
    });

    return chain;
  };

  const updateHarvestQuantity = (harvestId: string, soldQty: number) => {
    setState(prev => ({
      ...prev,
      harvests: prev.harvests.map(h =>
        h.id === harvestId
          ? { ...h, remainingAmount: h.remainingAmount - soldQty }
          : h
      ),
    }));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        registerStakeholder,
        login,
        logout,
        addApiary,
        addMaintenanceLog,
        addHarvest,
        addSale,
        addInvoice,
        getStakeholderById,
        getApiariesByBeekeeper,
        getHarvestsByBeekeeper,
        getSalesBySeller,
        getSalesByBuyer,
        getInvoicesBySeller,
        getInvoicesByBuyer,
        getTraceabilityChain,
        updateHarvestQuantity,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
