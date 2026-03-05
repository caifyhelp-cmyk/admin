import { create } from 'zustand';
import type { Customer, Role } from '../mock/types';
import { mockCustomers } from '../mock/data';

interface CustomerState {
    customers: Customer[];

    // Selectors
    getCustomerById: (id: string) => Customer | undefined;
    getCustomersBySalesId: (salesId: string) => Customer[];
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
    customers: mockCustomers,

    getCustomerById: (id) => {
        return get().customers.find(c => c.customerId === id);
    },

    getCustomersBySalesId: (salesId) => {
        return get().customers.filter(c => c.assignedSalesId === salesId);
    }
}));
