import React, { useMemo } from 'react';
import { useCustomerStore } from '../state/customers';
import { useInquiryStore } from '../state/inquiries';
import { usePaymentStore } from '../state/payments';
import { useSubscriptionStore } from '../state/subscriptions';
import { useAuditLogStore } from '../state/auditLogs';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../state/auth';
import { Users, AlertCircle, TrendingUp, ShieldCheck, Box, CreditCard, UserX } from 'lucide-react';
import { format, parseISO, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';

export const Dashboard: React.FC = () => {
    const customers = useCustomerStore(state => state.customers);
    const inquiries = useInquiryStore(state => state.inquiries);
    const payments = usePaymentStore(state => state.payments);
    const subscriptions = useSubscriptionStore(state => state.subscriptions);
    const auditLogs = useAuditLogStore(state => state.auditLogs);
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

    const accessibleLogs = currentRole === 'SALES'
        ? auditLogs.filter(log => log.targetType === 'CUSTOMER' && accessibleCustomerIds.has(log.targetId))
        : auditLogs;

    // Check Role Access
    const isManager = currentRole === 'MANAGER';

    // KPIs
    const totalCustomers = accessibleCustomers.length;
    const trialCustomers = accessibleCustomers.filter(c => c.serviceStatus === 'TRIAL').length;
    const paidCustomers = accessibleSubscriptions.filter(s => s.status === 'ACTIVE').length;

    const now = new Date();
    const startOfMo = startOfMonth(now);
    const endOfMo = endOfMonth(now);

    const thisMonthInquiries = accessibleInquiries.filter(i => {
        const d = parseISO(i.createdAt);
        return isWithinInterval(d, { start: startOfMo, end: endOfMo });
    }).length;

    const thisMonthRevenue = accessiblePayments
        .filter(p => p.status === 'PAID' && isWithinInterval(parseISO(p.paidAt), { start: startOfMo, end: endOfMo }))
        .reduce((sum, p) => sum + p.amount, 0);

    const thisMonthExpectedPayments = accessibleSubscriptions
        .filter(s => s.status === 'ACTIVE' && isWithinInterval(parseISO(s.nextBillingAt), { start: startOfMo, end: endOfMo }))
        .reduce((sum, s) => sum + (s.product.includes('홈페이지') && s.product.includes('블로그') ? 500000 : 300000), 0);

    const thisMonthCancellations = accessibleSubscriptions
        .filter(s => s.status === 'CANCELLED' && isWithinInterval(parseISO(s.endAt), { start: startOfMo, end: endOfMo }))
        .length;

    // Product breakdown
    const productStats = useMemo(() => {
        const counts: Record<string, number> = {};
        accessibleSubscriptions.forEach(s => {
            if (s.status === 'ACTIVE') {
                counts[s.product] = (counts[s.product] || 0) + 1;
            }
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [accessibleSubscriptions]);

    // Recent data sets
    const recentLogs = [...accessibleLogs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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
                <Card className="p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <dt className="text-sm font-medium text-gray-500 truncate">총 고객 수</dt>
                        <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <dd className="mt-4 text-3xl font-semibold text-gray-900">{totalCustomers}명</dd>
                </Card>

                <Card className="p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <dt className="text-sm font-medium text-gray-500 truncate">유료 고객 수</dt>
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <dd className="mt-4 text-3xl font-semibold text-gray-900">{paidCustomers}명</dd>
                </Card>

                <Card className="p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <dt className="text-sm font-medium text-gray-500 truncate">체험 고객 수</dt>
                        <Box className="w-5 h-5 text-amber-500" />
                    </div>
                    <dd className="mt-4 text-3xl font-semibold text-gray-900">{trialCustomers}명</dd>
                </Card>

                <Card className="p-6 shadow-sm cursor-pointer hover:bg-gray-50" onClick={() => navigate('/inquiries')}>
                    <div className="flex items-start justify-between">
                        <dt className="text-sm font-medium text-gray-500 truncate">이번 달 문의 수</dt>
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                    </div>
                    <dd className="mt-4 text-3xl font-semibold text-gray-900">{thisMonthInquiries}건</dd>
                </Card>

                {/* Sales / Financial KPIs (Hidden from MANAGER) */}
                {!isManager && (
                    <>
                        <Card className="p-6 shadow-sm cursor-pointer hover:bg-gray-50" onClick={() => navigate('/analytics')}>
                            <div className="flex items-start justify-between">
                                <dt className="text-sm font-medium text-gray-500 truncate">이번 달 매출</dt>
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                            </div>
                            <dd className="mt-4 text-3xl font-semibold text-gray-900">{thisMonthRevenue.toLocaleString()}원</dd>
                        </Card>

                        <Card className="p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <dt className="text-sm font-medium text-gray-500 truncate">이번 달 결제 예정</dt>
                                <CreditCard className="w-5 h-5 text-blue-500" />
                            </div>
                            <dd className="mt-4 text-3xl font-semibold text-gray-900">{thisMonthExpectedPayments.toLocaleString()}원</dd>
                        </Card>

                        <Card className="p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <dt className="text-sm font-medium text-gray-500 truncate">이번 달 해지 예정</dt>
                                <UserX className="w-5 h-5 text-red-500" />
                            </div>
                            <dd className="mt-4 text-3xl font-semibold text-rose-600">{thisMonthCancellations}건</dd>
                        </Card>
                    </>
                )}
            </dl>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Main Chart Area */}
                {!isManager && (
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
                )}

                {/* Product Breakdown */}
                <Card className="p-5 bg-white shadow-sm border border-gray-100">
                    <h3 className="text-base font-bold text-gray-900 mb-6">상품별 고객 수</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} interval={0} tick={{ width: 80 }} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    formatter={(value: any) => [`${value}명`, '고객 수']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Recent Logs (For ADMIN/SALES or All) */}
                <Card className="p-5 bg-white shadow-sm border border-gray-100 col-span-1 lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-bold text-gray-900">최근 활동 로그</h3>
                        {currentRole === 'ADMIN' && (
                            <button onClick={() => navigate('/audit')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">모두 보기</button>
                        )}
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {recentLogs.length === 0 && <p className="text-sm text-gray-500 py-4">최근 활동 내역이 없습니다.</p>}
                        {recentLogs.map((log) => (
                            <li key={log.id} className="py-3 items-center flex justify-between hover:bg-gray-50 -mx-5 px-5 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-900">
                                        <span className="text-indigo-600 mr-2">[{log.actionType}]</span>
                                        {log.actorName} ({log.actorRole})
                                    </span>
                                    <span className="text-xs text-gray-500 mt-1">
                                        {log.targetType} - {log.targetId} {log.meta && JSON.stringify(log.meta)}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">{format(new Date(log.timestamp), 'yy/MM/dd HH:mm')}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};
