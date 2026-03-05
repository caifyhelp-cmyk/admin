import { create } from 'zustand';
import type { Payment, Role } from '../mock/types';
import { mockPayments } from '../mock/data';
import { useAuditLogStore } from './auditLogs';

interface PaymentState {
    payments: Payment[];

    // Actions
    processRefund: (paymentId: string, actorRole: Role, actorName: string) => void;

    // Selectors
    getPaymentsByCustomerId: (customerId: string) => Payment[];
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
    payments: mockPayments,

    processRefund: (paymentId, actorRole, actorName) => {
        const payment = get().payments.find(p => p.paymentId === paymentId);
        // Only process refund if the payment is 'PAID' or 'PENDING'
        if (!payment || payment.status === 'REFUND' || payment.status === 'FAILED') return;

        const prevStatus = payment.status;
        const newStatus = 'REFUND_REQUESTED' as any; // Temporary mock cast

        set(state => ({
            payments: state.payments.map(p =>
                p.paymentId === paymentId ? { ...p, status: newStatus } : p
            )
        }));

        useAuditLogStore.getState().addAuditLog({
            actorRole,
            actorName,
            actionType: 'REFUND_REQUESTED',
            targetType: 'PAYMENT',
            targetId: paymentId,
            meta: {
                prevStatus,
                newStatus,
                amount: payment.amount
            }
        });
    },

    getPaymentsByCustomerId: (customerId) => {
        return get().payments.filter(p => p.customerId === customerId);
    }
}));
