import React from 'react';
import { useCustomerStore } from '../state/customers';
import { useInquiryStore } from '../state/inquiries';
import { usePaymentStore } from '../state/payments';
import { useSubscriptionStore } from '../state/subscriptions';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { useRole } from '../state/role';
import { Users, AlertCircle, TrendingUp, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { getPaymentBadgeVariant, PaymentStatusKR, Badge } from '../components/ui/Badge';

export const Dashboard: React.FC = () => {
    const customers = useCustomerStore(state => state.customers);
    const inquiries = useInquiryStore(state => state.inquiries);
    const payments = usePaymentStore(state => state.payments);
    const subscriptions = useSubscriptionStore(state => state.subscriptions);
    const { currentRole, currentSalesId } = useRole();
    const navigate = useNavigate();

    // Role Filtering logic
    const accessibleCustomers = currentRole === 'SALES_BRANCH'
        ? customers.filter(c => c.assignedSalesId === currentSalesId)
        : customers;

    const accessibleCustomerIds = new Set(accessibleCustomers.map(c => c.customerId));

    const accessibleInquiries = currentRole === 'SALES_BRANCH'
        ? inquiries.filter(i => accessibleCustomerIds.has(i.customerId))
        : inquiries;

    const accessibleSubscriptions = currentRole === 'SALES_BRANCH'
        ? subscriptions.filter(s => accessibleCustomerIds.has(s.customerId))
        : subscriptions;

    const accessiblePayments = currentRole === 'SALES_BRANCH'
        ? payments.filter(p => accessibleCustomerIds.has(p.customerId))
        : payments;

    // KPIs
    const totalCustomers = accessibleCustomers.length;
    const openInquiries = accessibleInquiries.filter(i => i.status === 'OPEN').length;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const thisMonthRevenue = accessiblePayments
        .filter(p => p.status === 'PAID' && p.paidAt >= firstDayOfMonth)
        .reduce((sum, p) => sum + p.amount, 0);

    const activeSubscriptions = accessibleSubscriptions.filter(s => s.status === 'ACTIVE').length;

    // Recent data sets
    // Sort descending by date locally
    const recentInquiries = [...accessibleInquiries]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    const recentPayments = [...accessiblePayments]
        .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
        .slice(0, 5);

    const recentCustomers = [...accessibleCustomers]
        .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
        .slice(0, 5);


    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">대시보드</h2>

            {/* KPI Cards */}
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="cursor-pointer hover:bg-gray-50 p-6 flex items-center justify-between" onClick={() => navigate('/customers')}>
                    <div>
                        <dt className="text-sm font-medium text-gray-500 truncate">전체 고객 수</dt>
                        <dd className="mt-2 text-3xl font-semibold text-gray-900">{totalCustomers}명</dd>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-full">
                        <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                </Card>

                <Card className="cursor-pointer hover:bg-gray-50 p-6 flex items-center justify-between" onClick={() => navigate('/inquiries?status=OPEN')}>
                    <div>
                        <dt className="text-sm font-medium text-gray-500 truncate">미답변 문의</dt>
                        <dd className="mt-2 text-3xl font-semibold text-gray-900">{openInquiries}건</dd>
                    </div>
                    <div className="bg-red-50 p-3 rounded-full">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                </Card>

                <Card className="cursor-pointer hover:bg-gray-50 p-6 flex items-center justify-between" onClick={() => navigate('/analytics?period=thisMonth')}>
                    <div>
                        <dt className="text-sm font-medium text-gray-500 truncate">이번 달 매출</dt>
                        <dd className="mt-2 text-3xl font-semibold text-gray-900">{thisMonthRevenue.toLocaleString()}원</dd>
                    </div>
                    <div className="bg-green-50 p-3 rounded-full">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                </Card>

                <Card className="cursor-pointer hover:bg-gray-50 p-6 flex items-center justify-between" onClick={() => navigate('/customers?subscriptionStatus=ACTIVE')}>
                    <div>
                        <dt className="text-sm font-medium text-gray-500 truncate">활성 구독 수</dt>
                        <dd className="mt-2 text-3xl font-semibold text-gray-900">{activeSubscriptions}건</dd>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-full">
                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                    </div>
                </Card>
            </dl>

            {/* Lists sections */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Recent Inquiries */}
                <Card className="p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">최근 문의</h3>
                    <ul className="divide-y divide-gray-200">
                        {recentInquiries.map(inq => (
                            <li key={inq.inquiryId} className="py-3 items-center flex justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{inq.title}</span>
                                    <span className="text-xs text-gray-500">{format(new Date(inq.createdAt), 'yyyy-MM-dd')}</span>
                                </div>
                                {inq.status === 'OPEN' ? (
                                    <span className="text-xs font-semibold text-red-600">미답변</span>
                                ) : (
                                    <span className="text-xs font-semibold text-green-600">답변완료</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </Card>

                {/* Recent Payments */}
                <Card className="p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">최근 결제</h3>
                    <ul className="divide-y divide-gray-200">
                        {recentPayments.map(pay => (
                            <li key={pay.paymentId} className="py-3 items-center flex justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">{pay.amount.toLocaleString()}원</span>
                                    <span className="text-xs text-gray-500">{format(new Date(pay.paidAt), 'yyyy-MM-dd HH:mm')}</span>
                                </div>
                                <Badge variant={getPaymentBadgeVariant(pay.status)}>{PaymentStatusKR[pay.status]}</Badge>
                            </li>
                        ))}
                    </ul>
                </Card>

                {/* Recent Customers */}
                <Card className="p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">최근 가입 고객</h3>
                    <ul className="divide-y divide-gray-200">
                        {recentCustomers.map(c => (
                            <li key={c.customerId} className="py-3 items-center flex justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">{c.name}</span>
                                    <span className="text-xs text-gray-500">{c.industry}</span>
                                </div>
                                <span className="text-xs text-gray-500">{format(new Date(c.joinedAt), 'yy/MM/dd')}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

        </div>
    );
};
