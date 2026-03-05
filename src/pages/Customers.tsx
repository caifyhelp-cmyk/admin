import React, { useState, useMemo } from 'react';
import { useCustomerStore } from '../state/customers';
import { useSubscriptionStore } from '../state/subscriptions';
import { usePaymentStore } from '../state/payments';
import { useSalesStore } from '../state/sales';
import { useRole } from '../state/role';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Badge, getSubscriptionBadgeVariant, SubscriptionStatusKR, getPaymentBadgeVariant, PaymentStatusKR } from '../components/ui/Badge';
import { format } from 'date-fns';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const Customers: React.FC = () => {
    const customers = useCustomerStore(state => state.customers);
    const subscriptions = useSubscriptionStore(state => state.subscriptions);
    const payments = usePaymentStore(state => state.payments);
    const sales = useSalesStore(state => state.sales);
    const { currentRole, currentSalesId } = useRole();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Filters from URL
    const [filterName, setFilterName] = useState(searchParams.get('name') || '');
    const [filterAccountId, setFilterAccountId] = useState(searchParams.get('accountId') || '');
    const [filterSubStatus, setFilterSubStatus] = useState(searchParams.get('subscriptionStatus') || '');
    const [filterPayStatus, setFilterPayStatus] = useState(searchParams.get('paymentStatus') || '');
    const [filterSalesId, setFilterSalesId] = useState(searchParams.get('assignedSalesId') || '');

    // Removed local selectedCustomerId state

    // Role Base filtering
    let baseCustomers = customers;
    if (currentRole === 'SALES_BRANCH') {
        baseCustomers = textFiltered(customers.filter(c => c.assignedSalesId === currentSalesId));
    } else {
        baseCustomers = textFiltered(baseCustomers);
    }

    function textFiltered(list: typeof customers) {
        return list.filter(c => {
            const matchName = filterName ? c.name.includes(filterName) : true;
            const matchAccount = filterAccountId ? c.accountId.includes(filterAccountId) : true;
            const matchSales = filterSalesId ? c.assignedSalesId === filterSalesId : true;

            const subInfo = subscriptions.find(s => s.customerId === c.customerId);
            const matchSub = filterSubStatus ? subInfo?.status === filterSubStatus : true;

            // For payment, find the most recent payment
            const custPayments = payments.filter(p => p.customerId === c.customerId).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
            const latestPay = custPayments[0];
            const matchPay = filterPayStatus ? latestPay?.status === filterPayStatus : true;

            return matchName && matchAccount && matchSales && matchSub && matchPay;
        });
    }

    // Derived list
    const displayList = useMemo(() => {
        return baseCustomers.map(c => {
            const subInfo = subscriptions.find(s => s.customerId === c.customerId);
            const custPayments = payments.filter(p => p.customerId === c.customerId).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
            const latestPay = custPayments[0];
            const salesAgent = sales.find(s => s.salesId === c.assignedSalesId);

            return {
                ...c,
                subscriptionStatus: subInfo?.status,
                paymentStatus: latestPay?.status,
                salesName: salesAgent?.name || '-',
            };
        }).sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
    }, [baseCustomers, subscriptions, payments, sales]);

    // Detail variables and status handlers moved to CustomerDetail

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">고객 관리</h2>
            </div>

            <Card className="p-4 bg-gray-50 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <input
                        type="text"
                        placeholder="고객명"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 text-sm focus:ring-2 focus:ring-indigo-600"
                    />
                    <input
                        type="text"
                        placeholder="Account ID"
                        value={filterAccountId}
                        onChange={(e) => setFilterAccountId(e.target.value)}
                        className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 text-sm focus:ring-2 focus:ring-indigo-600"
                    />
                    <select
                        value={filterSubStatus}
                        onChange={(e) => setFilterSubStatus(e.target.value)}
                        className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 text-sm focus:ring-2 focus:ring-indigo-600"
                    >
                        <option value="">구독 상태 전체</option>
                        {Object.entries(SubscriptionStatusKR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select
                        value={filterPayStatus}
                        onChange={(e) => setFilterPayStatus(e.target.value)}
                        className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 text-sm focus:ring-2 focus:ring-indigo-600"
                    >
                        <option value="">결제 상태 전체</option>
                        {Object.entries(PaymentStatusKR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    {(currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN') && (
                        <select
                            value={filterSalesId}
                            onChange={(e) => setFilterSalesId(e.target.value)}
                            className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 text-sm focus:ring-2 focus:ring-indigo-600"
                        >
                            <option value="">담당 영업자 전체</option>
                            {sales.map(s => <option key={s.salesId} value={s.salesId}>{s.name}</option>)}
                        </select>
                    )}
                </div>
            </Card>

            <Table>
                <Thead>
                    <Tr>
                        <Th>고객명</Th>
                        <Th>Account ID</Th>
                        <Th>업종</Th>
                        <Th>구독 상태</Th>
                        <Th>결제 상태</Th>
                        <Th>가입일</Th>
                        <Th>담당 영업자</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {displayList.map(item => (
                        <Tr key={item.customerId} onClick={() => navigate(`/customers/${item.customerId}`)} className="cursor-pointer hover:bg-gray-50">
                            <Td className="font-medium text-gray-900">{item.name}</Td>
                            <Td>{item.accountId}</Td>
                            <Td>{item.industry}</Td>
                            <Td>
                                {item.subscriptionStatus && (
                                    <Badge variant={getSubscriptionBadgeVariant(item.subscriptionStatus)}>
                                        {SubscriptionStatusKR[item.subscriptionStatus] || item.subscriptionStatus}
                                    </Badge>
                                )}
                            </Td>
                            <Td>
                                {item.paymentStatus && (
                                    <Badge variant={getPaymentBadgeVariant(item.paymentStatus)}>
                                        {PaymentStatusKR[item.paymentStatus] || item.paymentStatus}
                                    </Badge>
                                )}
                            </Td>
                            <Td>{format(new Date(item.joinedAt), 'yyyy-MM-dd')}</Td>
                            <Td>{item.salesName}</Td>
                        </Tr>
                    ))}
                    {displayList.length === 0 && (
                        <Tr>
                            <Td colSpan={7} className="text-center py-8 text-gray-500">데이터가 없습니다.</Td>
                        </Tr>
                    )}
                </Tbody>
            </Table>

            {/* Drawer removed in favor of CustomerDetail routing */}

        </div>
    );
};
