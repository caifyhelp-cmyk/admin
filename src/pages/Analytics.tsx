import React, { useState, useMemo } from 'react';
import { useAppStore } from '../state/store';
import { useRole } from '../state/role';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Badge, getPaymentBadgeVariant, PaymentStatusKR } from '../components/ui/Badge';
import { format, isToday, isThisMonth, parseISO, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSearchParams } from 'react-router-dom';

type PeriodFilter = 'ALL' | 'TODAY' | 'THIS_MONTH' | 'CUSTOM';

export const Analytics: React.FC = () => {
    const { payments, customers, subscriptions, sales } = useAppStore();
    const { currentRole, currentSalesId } = useRole();
    const [searchParams] = useSearchParams();

    const [period, setPeriod] = useState<PeriodFilter>((searchParams.get('period') === 'thisMonth' ? 'THIS_MONTH' : 'ALL') as PeriodFilter);
    // Simple custom range state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // 1. Role Base filtering
    let basePayments = payments;
    if (currentRole === 'SALES_BRANCH') {
        const assignedCustIds = new Set(customers.filter(c => c.assignedSalesId === currentSalesId).map(c => c.customerId));
        basePayments = payments.filter(p => assignedCustIds.has(p.customerId));
    }

    // 2. Filter by period & PAID status only
    const filteredPayments = useMemo(() => {
        return basePayments.filter(p => {
            if (p.status !== 'PAID' && p.status !== 'REFUND') return false; // FAILED and PENDING are excluded from revenue calculation

            const date = parseISO(p.paidAt);
            if (period === 'TODAY') return isToday(date);
            if (period === 'THIS_MONTH') return isThisMonth(date);
            if (period === 'CUSTOM' && startDate && endDate) {
                return isWithinInterval(date, { start: parseISO(startDate), end: parseISO(endDate) });
            }
            return true; // if ALL
        }).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
    }, [basePayments, period, startDate, endDate]);

    const totalRevenue = filteredPayments.reduce((sum, p) => p.status === 'REFUND' ? sum - p.amount : sum + p.amount, 0);

    // By Product
    const productRevMap = new Map<string, number>();
    filteredPayments.forEach(p => {
        const sub = subscriptions.find(s => s.subscriptionId === p.subscriptionId);
        if (sub) {
            const prev = productRevMap.get(sub.product) || 0;
            productRevMap.set(sub.product, p.status === 'REFUND' ? prev - p.amount : prev + p.amount);
        }
    });

    // By Sales Agent
    const salesRevMap = new Map<string, number>();
    filteredPayments.forEach(p => {
        const cust = customers.find(c => c.customerId === p.customerId);
        const agent = sales.find(s => s.salesId === cust?.assignedSalesId);
        const label = agent ? agent.name : '직접 가입 (영업자 없음)';
        const prev = salesRevMap.get(label) || 0;
        salesRevMap.set(label, p.status === 'REFUND' ? prev - p.amount : prev + p.amount);
    });

    // Prepare Chart Data (group by date)
    const chartDataMap = new Map<string, number>();
    filteredPayments.forEach(p => {
        const day = format(parseISO(p.paidAt), 'MM/dd');
        const prev = chartDataMap.get(day) || 0;
        chartDataMap.set(day, p.status === 'REFUND' ? prev - p.amount : prev + p.amount);
    });
    const chartData = Array.from(chartDataMap.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date)); // Very naive string sort, usually requires date parsing for proper x-axis sorting


    // Highest grossing product logic
    let bestProduct = '데이터 없음';
    let bestProductRev = 0;
    productRevMap.forEach((rev, name) => {
        if (rev > bestProductRev) { bestProductRev = rev; bestProduct = name; }
    });

    let bestSales = '데이터 없음';
    let bestSalesRev = 0;
    salesRevMap.forEach((rev, name) => {
        if (rev > bestSalesRev) { bestSalesRev = rev; bestSales = name; }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">매출 분석</h2>
            </div>

            <Card className="p-4 bg-gray-50 border border-gray-200">
                <div className="flex flex-wrap gap-4 items-center">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as any)}
                        className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 text-sm focus:ring-2 focus:ring-indigo-600 sm:max-w-xs"
                    >
                        <option value="ALL">전체 기간</option>
                        <option value="TODAY">오늘</option>
                        <option value="THIS_MONTH">이번 달</option>
                        <option value="CUSTOM">기간 지정</option>
                    </select>
                    {period === 'CUSTOM' && (
                        <div className="flex gap-2 items-center">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 text-sm"
                            />
                            <span className="text-gray-500">~</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 text-sm"
                            />
                        </div>
                    )}
                </div>
            </Card>

            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <Card className="px-4 py-5 sm:p-6 shadow-sm border border-gray-100">
                    <dt className="truncate text-sm font-medium text-gray-500">총 매출 (선택 기간)</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{totalRevenue.toLocaleString()}원</dd>
                </Card>
                <Card className="px-4 py-5 sm:p-6 shadow-sm border border-gray-100">
                    <dt className="truncate text-sm font-medium text-gray-500">가장 많이 팔린 상품</dt>
                    <dd className="mt-1 text-2xl font-semibold tracking-tight text-indigo-600 truncate">{bestProduct}</dd>
                    <dd className="text-sm font-medium text-gray-500 mt-1">{bestProductRev.toLocaleString()}원</dd>
                </Card>
                <Card className="px-4 py-5 sm:p-6 shadow-sm border border-gray-100">
                    <dt className="truncate text-sm font-medium text-gray-500">최고의 영업/유입 경로</dt>
                    <dd className="mt-1 text-2xl font-semibold tracking-tight text-green-600 truncate">{bestSales}</dd>
                    <dd className="text-sm font-medium text-gray-500 mt-1">{bestSalesRev.toLocaleString()}원</dd>
                </Card>
            </dl>

            <Card className="p-4 border border-gray-100 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 mb-4">매출 추이</h3>
                <div className="h-72 w-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value.toLocaleString()}`} />
                                <Tooltip
                                    formatter={(value: any) => [`${Number(value).toLocaleString()}원`, '매출']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">해당 기간의 결제 데이터가 없습니다.</div>
                    )}
                </div>
            </Card>

            <div className="pt-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4">결제 목록 (해당 기간 유효/환불 결제만 표시)</h3>
                <Table>
                    <Thead>
                        <Tr>
                            <Th>결제일</Th>
                            <Th>고객명</Th>
                            <Th>결제 상품</Th>
                            <Th>결제 금액</Th>
                            <Th>상태</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredPayments.map(p => {
                            const c = customers.find(c => c.customerId === p.customerId);
                            const s = subscriptions.find(s => s.subscriptionId === p.subscriptionId);
                            return (
                                <Tr key={p.paymentId}>
                                    <Td>{format(parseISO(p.paidAt), 'yyyy-MM-dd HH:mm')}</Td>
                                    <Td className="font-medium text-gray-900">{c?.name || p.customerId}</Td>
                                    <Td>{s?.product || '알 수 없음'}</Td>
                                    <Td className={p.status === 'REFUND' ? 'text-red-500' : 'text-gray-900'}>
                                        {p.status === 'REFUND' ? '-' : ''}{p.amount.toLocaleString()}원
                                    </Td>
                                    <Td>
                                        <Badge variant={getPaymentBadgeVariant(p.status)}>{PaymentStatusKR[p.status]}</Badge>
                                    </Td>
                                </Tr>
                            )
                        })}
                        {filteredPayments.length === 0 && (
                            <Tr>
                                <Td colSpan={5} className="text-center py-8 text-gray-500">데이터가 없습니다.</Td>
                            </Tr>
                        )}
                    </Tbody>
                </Table>
            </div>

        </div>
    );
};
