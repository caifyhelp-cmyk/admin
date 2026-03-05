import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaymentStore } from '../state/payments';
import { useCustomerStore } from '../state/customers';
import { useSubscriptionStore } from '../state/subscriptions';
import { useRole } from '../state/role';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Badge, getPaymentBadgeVariant, PaymentStatusKR } from '../components/ui/Badge';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';

export const Payments: React.FC = () => {
    const { payments, processRefund } = usePaymentStore();
    const { customers } = useCustomerStore();
    const { subscriptions } = useSubscriptionStore();
    const { currentRole, currentSalesId } = useRole();
    const navigate = useNavigate();

    const [filterStatus, setFilterStatus] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const displayList = useMemo(() => {
        let baseList = payments;

        if (currentRole === 'SALES_BRANCH') {
            const allowedIds = new Set(customers.filter(c => c.assignedSalesId === currentSalesId).map(c => c.customerId));
            baseList = payments.filter(p => allowedIds.has(p.customerId));
        }

        return baseList
            .filter(p => {
                const matchStatus = filterStatus ? p.status === filterStatus : true;
                let matchDate = true;
                if (startDate && endDate) {
                    const payDate = parseISO(p.paidAt);
                    matchDate = isWithinInterval(payDate, {
                        start: startOfDay(parseISO(startDate)),
                        end: endOfDay(parseISO(endDate))
                    });
                }
                return matchStatus && matchDate;
            })
            .map(p => {
                const customer = customers.find(c => c.customerId === p.customerId);
                const sub = subscriptions.find(s => s.subscriptionId === p.subscriptionId);
                return {
                    ...p,
                    customerName: customer?.name || 'Unknown',
                    product: sub?.product || 'Unknown'
                };
            })
            .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
    }, [payments, customers, subscriptions, currentRole, currentSalesId, filterStatus, startDate, endDate]);

    const handleRefund = (paymentId: string) => {
        if (window.confirm('정말 이 결제를 환불 요청 처리하시겠습니까?')) {
            processRefund(paymentId, currentRole, 'Current User');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">결제 내역 관리</h2>
            </div>

            <Card className="p-4 bg-gray-50 border border-gray-200">
                <div className="flex flex-wrap gap-4 items-center">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 text-sm focus:ring-2 focus:ring-indigo-600 sm:max-w-xs"
                    >
                        <option value="">결제 상태 전체</option>
                        {Object.entries(PaymentStatusKR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>

                    <div className="flex gap-2 items-center">
                        <span className="text-sm text-gray-600">결제일:</span>
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
                </div>
            </Card>

            <Card className="p-4">
                <Table>
                    <Thead>
                        <Tr>
                            <Th>결제일</Th>
                            <Th>고객명</Th>
                            <Th>상품</Th>
                            <Th>결제 금액</Th>
                            <Th>상태</Th>
                            <Th>수단</Th>
                            <Th>액션</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {displayList.map(p => (
                            <Tr key={p.paymentId}>
                                <Td>{format(new Date(p.paidAt), 'yyyy-MM-dd HH:mm')}</Td>
                                <Td
                                    className="font-medium text-indigo-600 cursor-pointer hover:underline"
                                    onClick={() => navigate(`/customers/${p.customerId}`)}
                                >
                                    {p.customerName}
                                </Td>
                                <Td>{p.product}</Td>
                                <Td className={p.status === 'REFUND' ? 'text-red-500' : 'text-gray-900'}>
                                    {p.status === 'REFUND' ? '-' : ''}{p.amount.toLocaleString()}원
                                </Td>
                                <Td>
                                    <Badge variant={p.status === 'REFUND_REQUESTED' ? 'warning' : getPaymentBadgeVariant(p.status)}>
                                        {p.status === 'REFUND_REQUESTED' ? '환불요청' : PaymentStatusKR[p.status] || p.status}
                                    </Badge>
                                </Td>
                                <Td>{p.method}</Td>
                                <Td>
                                    {p.status === 'PAID' && currentRole !== 'SALES_BRANCH' && (
                                        <button
                                            onClick={() => handleRefund(p.paymentId)}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium border border-gray-200 bg-white shadow-sm px-2 py-1 rounded"
                                        >
                                            환불
                                        </button>
                                    )}
                                </Td>
                            </Tr>
                        ))}
                        {displayList.length === 0 && (
                            <Tr>
                                <Td colSpan={7} className="text-center py-8 text-gray-500">결제 내역이 없습니다.</Td>
                            </Tr>
                        )}
                    </Tbody>
                </Table>
            </Card>
        </div>
    );
};
