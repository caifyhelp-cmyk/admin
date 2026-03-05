import { create } from 'zustand';
import type { Sales } from '../mock/types';
import { mockSales } from '../mock/data';

interface SalesState {
    sales: Sales[];

    // Selectors
    getSalesById: (id: string) => Sales | undefined;
}

export const useSalesStore = create<SalesState>((set, get) => ({
    sales: mockSales,

    getSalesById: (id) => {
        return get().sales.find(s => s.salesId === id);
    }
}));
