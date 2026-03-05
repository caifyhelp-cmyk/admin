import { create } from 'zustand';
import type { Customer, Subscription, Payment, Inquiry, Sales, AuditLog, Role } from '../mock/types';
import { mockCustomers, mockSubscriptions, mockPayments, mockInquiries, mockSales, mockAuditLogs } from '../mock/data';

interface AppState {
    customers: Customer[];
    subscriptions: Subscription[];
    payments: Payment[];
    inquiries: Inquiry[];
    sales: Sales[];
    auditLogs: AuditLog[];

    // Actions
    updateSubscriptionStatus: (subscriptionId: string, status: Subscription['status'], actorRole: Role) => void;
    updateInquiryStatus: (inquiryId: string, status: Inquiry['status'], answerContent?: string, actorRole?: Role) => void;
    addAuditLog: (log: Omit<AuditLog, 'logId' | 'timestamp'>) => void;
}

export const useAppStore = create<AppState>((set) => ({
    customers: mockCustomers,
    subscriptions: mockSubscriptions,
    payments: mockPayments,
    inquiries: mockInquiries,
    sales: mockSales,
    auditLogs: mockAuditLogs,

    addAuditLog: (log) => set((state) => ({
        auditLogs: [{
            ...log,
            logId: `audit_${Date.now()}`,
            timestamp: new Date().toISOString()
        }, ...state.auditLogs]
    })),

    updateSubscriptionStatus: (subscriptionId, newStatus, actorRole) => set((state) => {
        const sub = state.subscriptions.find(s => s.subscriptionId === subscriptionId);
        if (!sub) return state;

        const auditLog = {
            actorRole,
            actorName: 'Current User', // Mocked name
            actionType: 'UPDATE_SUBSCRIPTION',
            targetType: 'SUBSCRIPTION',
            targetId: subscriptionId,
            before: { status: sub.status },
            after: { status: newStatus },
        };

        const newLogs = [{
            ...auditLog,
            logId: `audit_${Date.now()}`,
            timestamp: new Date().toISOString()
        }, ...state.auditLogs];

        return {
            subscriptions: state.subscriptions.map(s =>
                s.subscriptionId === subscriptionId ? { ...s, status: newStatus } : s
            ),
            auditLogs: newLogs
        };
    }),

    updateInquiryStatus: (inquiryId, status, answerContent, actorRole) => set((state) => {
        const inq = state.inquiries.find(i => i.inquiryId === inquiryId);
        if (!inq) return state;

        const isExistingAnswer = !!inq.answer;
        const now = new Date().toISOString();

        const auditLog = {
            actorRole: actorRole || 'ADMIN',
            actorName: 'Current User',
            actionType: isExistingAnswer ? 'UPDATE_INQUIRY_ANSWER' : 'CREATE_INQUIRY_ANSWER',
            targetType: 'INQUIRY',
            targetId: inquiryId,
            before: { status: inq.status, answer: inq.answer?.content },
            after: { status, answer: answerContent },
        };

        const notificationLog = {
            actorRole: 'SYSTEM' as Role,
            actorName: 'System Bot',
            actionType: 'SEND_NOTIFICATION (Kakao)',
            targetType: 'INQUIRY',
            targetId: inquiryId,
            before: null,
            after: { success: true },
        };

        const logsToAdd: AuditLog[] = [{
            ...auditLog,
            logId: `audit_${Date.now()}_1`,
            timestamp: now
        }];

        // Auto send Kakao notification on CREATE
        if (!isExistingAnswer && answerContent) {
            logsToAdd.push({
                ...notificationLog,
                logId: `audit_${Date.now()}_2`,
                timestamp: now
            });
        }

        return {
            inquiries: state.inquiries.map(i => {
                if (i.inquiryId !== inquiryId) return i;
                return {
                    ...i,
                    status,
                    answer: answerContent ? {
                        content: answerContent,
                        authorRole: actorRole || 'ADMIN',
                        createdAt: i.answer?.createdAt || now,
                        updatedAt: now
                    } : undefined
                };
            }),
            auditLogs: [...logsToAdd, ...state.auditLogs]
        };
    })
}));
