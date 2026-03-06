import React, { useMemo } from 'react';
import { useCustomerStore } from '../state/customers';
import { useInquiryStore } from '../state/inquiries';
import { usePaymentStore } from '../state/payments';
import { useSubscriptionStore } from '../state/subscriptions';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../state/auth';
import { Users, AlertCircle, TrendingUp, ShieldCheck } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PAYMENT_STATUS_LABELS } from '../constants/labels';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const Dashboard: React.FC = () => {
    const customers = useCustomerStore(state => state.customers);
    const inquiries = useInquiryStore(state => state.inquiries);
    const payments = usePaymentStore(state => state.payments);
    const subscriptions = useSubscriptionStore(state => state.subscriptions);
    const { currentRole, currentSalesId } = useAuthStore();
    const navigate = useNavigate();

    // Role Filtering logic
    const accessibleCustomers = currentRole === 'SALES'
        ? customers.filter(c => c.assignedSalesId === currentSalesId)
        : customers;

    const accessibleCustomerIds = new Set(accessibleCustomers.map(c => c.customerId));

    const accessibleInquiries = currentRole === 'SALES'
        ? inquiries.filter(i => accessibleCustomerIds.has(i.customerId))
        : inquiries;

    const accessibleSubscriptions = currentRole === 'SALES'
        ? subscriptions.filter(s => accessibleCustomerIds.has(s.customerId))
        : subscriptions;

    const accessiblePayments = currentRole === 'SALES'
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
    const recentInquiries = [...accessibleInquiries]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    const recentPayments = [...accessiblePayments]
        .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
        .slice(0, 5);

    const recentCustomers = [...accessibleCustomers]
        .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
        .slice(0, 5);

    // Prepare Mini Chart Data (Last 7 Days Revenue)
    const chartData = useMemo(() => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dateStr = format(date, 'yyyy-MM-dd');

            const dayRev = accessiblePayments
                .filter(p => p.status === 'PAID' && format(parseISO(p.paidAt), 'yyyy-MM-dd') === dateStr)
                .reduce((sum, p) => sum + p.amount, 0);

            data.push({
                date: format(date, 'MM/dd'),
                revenue: dayRev
            });
        }
        return data;
    }, [accessiblePayments]);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">대시보드</h2>

            {/* KPI Cards */}
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="cursor-pointer hover:bg-white/90 bg-white p-6 flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-0.5" onClick={() => navigate('/customers')}>
                    <div className="flex items-start justify-between">
                        <dt className="text-sm font-medium text-gray-500 truncate">전체 고객 수</dt>
                        <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                            <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>
                    <dd className="mt-4 text-3xl font-semibold text-gray-900 border-l-4 border-indigo-500 pl-3">{totalCustomers}명</dd>
                </Card>

                <Card className="cursor-pointer hover:bg-white/90 bg-white p-6 flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-0.5" onClick={() => navigate('/inquiries')}>
                    <div className="flex items-start justify-between">
                        <dt className="text-sm font-medium text-gray-500 truncate">미답변 문의</dt>
                        <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                        </div>
                    </div>
                    <dd className="mt-4 text-3xl font-semibold text-gray-900 border-l-4 border-rose-500 pl-3">{openInquiries}건</dd>
                </Card>

                <Card className="cursor-pointer hover:bg-white/90 bg-white p-6 flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-0.5" onClick={() => navigate('/analytics')}>
                    <div className="flex items-start justify-between">
                        <dt className="text-sm font-medium text-gray-500 truncate">이번 달 매출</dt>
                        <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>
                    <dd className="mt-4 text-3xl font-semibold text-gray-900 border-l-4 border-emerald-500 pl-3">{thisMonthRevenue.toLocaleString()}원</dd>
                </Card>

                <Card className="cursor-pointer hover:bg-white/90 bg-white p-6 flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-0.5" onClick={() => navigate('/subscriptions')}>
                    <div className="flex items-start justify-between">
                        <dt className="text-sm font-medium text-gray-500 truncate">활성 구독 수</dt>
                        <div className="bg-sky-50 p-2.5 rounded-lg border border-sky-100">
                            <ShieldCheck className="w-5 h-5 text-sky-600" />
                        </div>
                    </div>
                    <dd className="mt-4 text-3xl font-semibold text-gray-900 border-l-4 border-sky-500 pl-3">{activeSubscriptions}건</dd>
                </Card>
            </dl>

            {/* Main Chart Area */}
            <Card className="p-5 bg-white shadow-sm border border-gray-100">
                <h3 className="text-base font-bold text-gray-900 mb-6">최근 7일 매출 추이</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toLocaleString()}k`} />
                            <Tooltip
                                formatter={(value: any) => [`${Number(value).toLocaleString()}원`, '매출']}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Lists sections */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Recent Payments */}
                <Card className="p-5 bg-white shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-bold text-gray-900">최근 결제</h3>
                        <button onClick={() => navigate('/payments')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">모두 보기</button>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {recentPayments.map(pay => {
                            const c = customers.find(c => c.customerId === pay.customerId);
                            return (
                                <li key={pay.paymentId} className="py-3 items-center flex justify-between hover:bg-gray-50 -mx-5 px-5 transition-colors cursor-pointer" onClick={() => navigate(`/customers/${pay.customerId}`)}>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-900">{pay.amount.toLocaleString()}원 <span className="text-xs text-gray-500 font-normal ml-1">({c?.name})</span></span>
                                        <span className="text-xs text-gray-500">{format(new Date(pay.paidAt), 'yyyy-MM-dd HH:mm')}</span>
                                    </div>
                                    <StatusBadge status={pay.status} label={PAYMENT_STATUS_LABELS[pay.status]} type="payment" />
                                </li>
                            );
                        })}
                    </ul>
                </Card>

                {/* Recent Inquiries */}
                <Card className="p-5 bg-white shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-bold text-gray-900">최근 문의</h3>
                        <button onClick={() => navigate('/inquiries')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">모두 보기</button>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {recentInquiries.map(inq => (
                            <li key={inq.inquiryId} className="py-3 items-center flex justify-between hover:bg-gray-50 -mx-5 px-5 transition-colors cursor-pointer" onClick={() => navigate('/inquiries')}>
                                <div className="flex flex-col w-3/4">
                                    <span className="text-sm font-semibold text-gray-900 truncate">{inq.title}</span>
                                    <span className="text-xs text-gray-500">{format(new Date(inq.createdAt), 'MM/dd HH:mm')}</span>
                                </div>
                                <StatusBadge status={inq.status} label={inq.status === 'OPEN' ? '미답변' : '답변완료'} type="inquiry" />
                            </li>
                        ))}
                    </ul>
                </Card>

                {/* Recent Customers */}
                <Card className="p-5 bg-white shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-bold text-gray-900">신규 가입 고객</h3>
                        <button onClick={() => navigate('/customers')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">모두 보기</button>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {recentCustomers.map(c => (
                            <li key={c.customerId} className="py-3 items-center flex justify-between hover:bg-gray-50 -mx-5 px-5 transition-colors cursor-pointer" onClick={() => navigate(`/customers/${c.customerId}`)}>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                                    <span className="text-xs text-gray-500">{c.industry}</span>
                                </div>
                                <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded">{format(new Date(c.joinedAt), 'yy/MM/dd')}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};
