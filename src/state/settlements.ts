import { create } from 'zustand';
import type { Settlement, Payment, Role } from '../mock/types';
import { useAuditLogStore } from './auditLogs';
import { useSalesStore } from './sales';
import { mockPayments } from '../mock/data';

interface SettlementState {
    settlements: Settlement[];

    // Actions
    processPaymentForSettlement: (payment: Payment) => void;
    handleRefundDeduction: (payment: Payment) => void;
    updateSettlementStatus: (settlementId: string, status: Settlement['status'], actorRole: Role, actorName: string) => void;

    // Selectors
    getSettlementsBySalesId: (salesId: string) => Settlement[];
}

export const useSettlementStore = create<SettlementState>((set, get) => {
    // Generate initial settlements from mockPayments
    const initialSettlements: Settlement[] = [];
    const salesState = useSalesStore.getState();

    mockPayments.forEach(payment => {
        if (!payment.salesId || payment.status === 'REFUND') return;
        const sId = payment.salesId as string;

        const date = new Date(payment.paidAt);
        const periodFrom = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const periodTo = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const rate = salesState.getSalesById(sId)?.commissionRate ?? salesState.baseCommissionRate;
        const commission = payment.amount * rate;

        const existingItem = initialSettlements.find(s => s.salesId === sId && s.periodFrom === periodFrom);
        if (existingItem) {
            existingItem.amount += commission;
        } else {
            initialSettlements.push({
                settlementId: `stl_${sId}_${date.getFullYear()}_${date.getMonth() + 1}`,
                salesId: sId,
                periodFrom,
                periodTo,
                amount: commission,
                status: 'PENDING'
            });
        }
    });

    return {
        settlements: initialSettlements,

        processPaymentForSettlement: (payment) => {
            // 직접 가입은 정산에서 제외
            if (!payment.salesId) return;
            const sId = payment.salesId as string;

            // 멱등성: 해당 결제건이 이미 정산 리스트에 반영되었는지 (동일 기간 등) 여부는 
            // 일반적으로 paymentId가 settlementItem에 종속되지만, 
            // 현 구조상 월별 집계(Settlement)를 갱신하거나 새로 생성함.

            const date = new Date(payment.paidAt);
            const periodFrom = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
            const periodTo = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

            const salesStore = useSalesStore.getState();
            const sales = salesStore.getSalesById(sId);
            const rate = sales?.commissionRate ?? salesStore.baseCommissionRate;

            const commission = payment.amount * rate;

            set((state) => {
                const existingIdx = state.settlements.findIndex(
                    s => s.salesId === sId && s.periodFrom === periodFrom
                );

                if (existingIdx >= 0) {
                    const updated = [...state.settlements];
                    updated[existingIdx].amount += commission;
                    return { settlements: updated };
                } else {
                    const newSettlement: Settlement = {
                        settlementId: `stl_${sId}_${date.getFullYear()}_${date.getMonth() + 1}`,
                        salesId: sId,
                        periodFrom,
                        periodTo,
                        amount: commission,
                        status: 'PENDING'
                    };

                    useAuditLogStore.getState().addAuditLog({
                        actorRole: 'SYSTEM' as any,
                        actorName: 'System',
                        actionType: 'CREATE_SETTLEMENT',
                        targetType: 'SETTLEMENT',
                        targetId: newSettlement.settlementId,
                        meta: { amount: newSettlement.amount }
                    });

                    return { settlements: [...state.settlements, newSettlement] };
                }
            });
        },

        handleRefundDeduction: (payment) => {
            if (!payment.salesId) return;
            const sId = payment.salesId as string;

            const date = new Date(payment.paidAt);
            const periodFrom = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();

            const salesStore = useSalesStore.getState();
            const sales = salesStore.getSalesById(sId);
            const rate = sales?.commissionRate ?? salesStore.baseCommissionRate;

            const deduction = payment.amount * rate;

            set((state) => {
                const existingIdx = state.settlements.findIndex(
                    s => s.salesId === sId && s.periodFrom === periodFrom
                );

                if (existingIdx >= 0) {
                    const updated = [...state.settlements];
                    updated[existingIdx].amount -= deduction;

                    useAuditLogStore.getState().addAuditLog({
                        actorRole: 'SYSTEM' as any,
                        actorName: 'System',
                        actionType: 'DEDUCT_SETTLEMENT',
                        targetType: 'SETTLEMENT',
                        targetId: updated[existingIdx].settlementId,
                        meta: { deduction, newAmount: updated[existingIdx].amount }
                    });

                    return { settlements: updated };
                }
                return state;
            });
        },

        updateSettlementStatus: (settlementId, status, actorRole, actorName) => {
            let prevStatus = '';
            set((state) => {
                const settlements = state.settlements.map(s => {
                    if (s.settlementId === settlementId) {
                        prevStatus = s.status;
                        return { ...s, status };
                    }
                    return s;
                });
                return { settlements };
            });

            const actionType = status === 'CONFIRMED' ? 'CONFIRM_SETTLEMENT' :
                status === 'PAID' ? 'COMPLETE_SETTLEMENT' : 'UPDATE_SETTLEMENT';

            useAuditLogStore.getState().addAuditLog({
                actorRole,
                actorName,
                actionType,
                targetType: 'SETTLEMENT',
                targetId: settlementId,
                meta: { prevStatus, newStatus: status }
            });
        },

        getSettlementsBySalesId: (salesId) => {
            return get().settlements.filter(s => s.salesId === salesId);
        }
    };
});
