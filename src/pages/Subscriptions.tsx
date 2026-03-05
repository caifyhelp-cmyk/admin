import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '../state/subscriptions';
import { useCustomerStore } from '../state/customers';
import { useRole } from '../state/role';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Badge, getSubscriptionBadgeVariant, SubscriptionStatusKR } from '../components/ui/Badge';
import { format } from 'date-fns';
import type { SubscriptionStatus } from '../mock/types';

export const Subscriptions: React.FC = () => {
    const { subscriptions, updateSubscriptionStatus } = useSubscriptionStore();
    const { customers } = useCustomerStore();
    const { currentRole, currentSalesId } = useRole();
    const navigate = useNavigate();

    // Role filtering
    const displayList = useMemo(() => {
        let baseSubs = subscriptions;
        if (currentRole === 'SALES_BRANCH') {
            const allowedCustomerIds = new Set(customers.filter(c => c.assignedSalesId === currentSalesId).map(c => c.customerId));
            baseSubs = subscriptions.filter(s => allowedCustomerIds.has(s.customerId));
        }

        return baseSubs.map(s => {
            const customer = customers.find(c => c.customerId === s.customerId);
            return {
                ...s,
                customerName: customer?.name || 'Unknown',
            };
        }).sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
    }, [subscriptions, customers, currentRole, currentSalesId]);

    const handleStatusChange = (subscriptionId: string, status: string) => {
        updateSubscriptionStatus(subscriptionId, status as SubscriptionStatus, currentRole, 'Current User');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">구독 관리</h2>
            </div>

            <Card className="p-4">
                <Table>
                    <Thead>
                        <Tr>
                            <Th>고객명</Th>
                            <Th>상품</Th>
                            <Th>상태</Th>
                            <Th>시작일</Th>
                            <Th>다음 결제예정일</Th>
                            <Th>관리 액션</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {displayList.map(s => (
                            <Tr key={s.subscriptionId}>
                                <Td
                                    className="font-medium text-indigo-600 cursor-pointer hover:underline"
                                    onClick={() => navigate(`/customers/${s.customerId}`)}
                                >
                                    {s.customerName}
                                </Td>
                                <Td>{s.product}</Td>
                                <Td>
                                    <Badge variant={getSubscriptionBadgeVariant(s.status)}>
                                        {SubscriptionStatusKR[s.status] || s.status}
                                    </Badge>
                                </Td>
                                <Td>{format(new Date(s.startAt), 'yyyy-MM-dd')}</Td>
                                <Td>{format(new Date(s.nextBillingAt), 'yyyy-MM-dd')}</Td>
                                <Td>
                                    <select
                                        value={s.status}
                                        onChange={(e) => handleStatusChange(s.subscriptionId, e.target.value)}
                                        className="rounded-md border-0 py-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-2 text-sm focus:ring-2 focus:ring-indigo-600 w-32"
                                        disabled={currentRole === 'SALES_BRANCH'}
                                        title={currentRole === 'SALES_BRANCH' ? "영업 담당자는 상태를 변경할 수 없습니다." : "상태 변경"}
                                    >
                                        {Object.entries(SubscriptionStatusKR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </Td>
                            </Tr>
                        ))}
                        {displayList.length === 0 && (
                            <Tr>
                                <Td colSpan={6} className="text-center py-8 text-gray-500">구독 데이터가 없습니다.</Td>
                            </Tr>
                        )}
                    </Tbody>
                </Table>
            </Card>
        </div>
    );
};
