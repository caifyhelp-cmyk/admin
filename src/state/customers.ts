import { create } from 'zustand';
import type { Customer, Role } from '../mock/types';
import { mockCustomers } from '../mock/data';
import { useAuditLogStore } from './auditLogs';

interface CustomerState {
    customers: Customer[];

    // Selectors
    getCustomerById: (id: string) => Customer | undefined;
    getCustomersBySalesId: (salesId: string) => Customer[];
    getCustomersVisibleToRole: (role: Role, salesId: string) => Customer[];

    // Actions
    updateCustomer: (customerId: string, updates: Partial<Customer>) => void;
    updateCustomerField: (customerId: string, field: keyof Customer, value: any, actorRole: string, actorName: string) => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
    customers: mockCustomers,

    getCustomerById: (id) => get().customers.find(c => c.customerId === id),

    getCustomersBySalesId: (salesId) => get().customers.filter(c => c.assignedSalesId === salesId),

    getCustomersVisibleToRole: (role, salesId) => {
        const all = get().customers;
        if (role === 'SALES_BRANCH') {
            return all.filter(c => c.assignedSalesId === salesId);
        }
        return all;
    },

    updateCustomer: (customerId, updates) => set((state) => ({
        customers: state.customers.map(c =>
            c.customerId === customerId ? { ...c, ...updates } : c
        )
    })),

    updateCustomerField: (customerId, field, value, actorRole, actorName) => {
        set(state => {
            const customer = state.customers.find(c => c.customerId === customerId);
            if (!customer) return state;

            const oldValue = customer[field];

            useAuditLogStore.getState().addAuditLog({
                actorRole: actorRole as any,
                actorName,
                actionType: 'UPDATE_CUSTOMER_INFO',
                targetType: 'CUSTOMER',
                targetId: customerId,
                meta: { field, oldValue, newValue: value }
            });

            return {
                customers: state.customers.map(c =>
                    c.customerId === customerId ? { ...c, [field]: value } : c
                )
            };
        });
    }
}));
