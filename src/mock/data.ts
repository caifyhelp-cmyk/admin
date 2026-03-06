import type { Customer, Subscription, Payment, Inquiry, Sales, AuditLog } from './types';
import { subDays, formatISO } from 'date-fns';

const now = new Date();

export const mockSales: Sales[] = [
    { salesId: 'sales_001', name: '김태형', phone: '010-1234-5678' },
    { salesId: 'sales_002', name: '이민호', phone: '010-2345-6789' },
    { salesId: 'sales_003', name: '박서준', phone: '010-3456-7890' },
    { salesId: 'sales_004', name: '최우식', phone: '010-4567-8901' },
    { salesId: 'sales_005', name: '정해인', phone: '010-5678-9012' },
];

export const mockCustomers: Customer[] = Array.from({ length: 30 }).map((_, i) => ({
    customerId: `cust_${String(i + 1).padStart(3, '0')}`,
    name: `(주)고객사${i + 1}`,
    industry: ['IT/Software', 'Manufacturing', 'Retail', 'Healthcare', 'Finance'][i % 5],
    contact: `contact${i + 1}@example.com`,
    accountId: `acc_${String(i + 1).padStart(3, '0')}`,
    joinedAt: formatISO(subDays(now, Math.floor(Math.random() * 365))),
    assignedSalesId: i < 20 ? mockSales[i % 5].salesId : null,
}));

export const mockSubscriptions: Subscription[] = mockCustomers.map((c, i) => {
    let status: Subscription['status'] = 'ACTIVE';
    if (i === 5) status = 'TRIAL';
    if (i === 10) status = 'SUSPENDED';
    if (i === 15) status = 'CANCELLED';
    if (i === 20) status = 'ACTIVE'; // Will force payment failed later

    return {
        subscriptionId: `sub_${c.customerId}`,
        customerId: c.customerId,
        product: ['Basic Plan', 'Pro Plan', 'Enterprise Plan'][i % 3],
        status,
        startAt: c.joinedAt,
        endAt: formatISO(subDays(now, -30)), // 30 days in future roughly
        nextBillingAt: formatISO(subDays(now, -15)),
    };
});

export const mockPayments: Payment[] = [];
for (let i = 0; i < 80; i++) {
    const customer = mockCustomers[i % 30];
    const subscription = mockSubscriptions[i % 30];
    let status: Payment['status'] = 'PAID';

    // Edge case: ACTIVE subscription but payment FAILED
    if (customer.customerId === 'cust_021' && i > 60) {
        status = 'FAILED';
    }
    // Edge case: Refund payment
    if (i === 75 || i === 76) {
        status = 'REFUND';
    }

    mockPayments.push({
        paymentId: `pay_${String(i + 1).padStart(3, '0')}`,
        customerId: customer.customerId,
        subscriptionId: subscription.subscriptionId,
        amount: [10000, 50000, 150000][i % 3], // KRW
        currency: 'KRW',
        status,
        paidAt: formatISO(subDays(now, Math.floor(Math.random() * 90))),
        method: 'CARD',
        billingCycleNo: Math.floor(i / 30) + 1,
    });
}

export const mockInquiries: Inquiry[] = Array.from({ length: 50 }).map((_, i) => {
    const customer = mockCustomers[i % 30];
    const isAnswered = i % 3 !== 0; // 2/3 answered
    const status: Inquiry['status'] = isAnswered ? 'ANSWERED' : 'OPEN';

    return {
        inquiryId: `inq_${String(i + 1).padStart(3, '0')}`,
        customerId: customer.customerId,
        title: `서비스 이용 관련 문의 ${i + 1}`,
        content: `이러이러한 기능은 어떻게 사용하나요?\n빠른 답변 부탁드립니다.`,
        type: ['결제', '기술지원', '계정', '기타'][i % 4],
        createdAt: formatISO(subDays(now, Math.floor(Math.random() * 30))),
        status,
        answer: isAnswered
            ? {
                content: '안녕하세요. 고객님 문의하신 내용에 대해 답변 드립니다.',
                authorRole: 'ADMIN',
                createdAt: formatISO(subDays(now, Math.floor(Math.random() * 20))),
                updatedAt: formatISO(subDays(now, Math.floor(Math.random() * 20))),
            }
            : undefined,
    };
});

export const mockAuditLogs: AuditLog[] = [
    {
        id: 'audit_001',
        actorRole: 'SUPER_ADMIN',
        actorName: 'Admin User',
        actionType: 'UPDATE_SUBSCRIPTION',
        targetType: 'SUBSCRIPTION',
        targetId: 'sub_cust_011',
        before: { status: 'ACTIVE' },
        after: { status: 'SUSPENDED' },
        timestamp: formatISO(subDays(now, 1)),
    },
];