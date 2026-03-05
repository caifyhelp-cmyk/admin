import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useSalesStore } from '../state/sales';
import { useCustomerStore } from '../state/customers';
import { useRole } from '../state/role';
import { Card } from '../components/ui/Card';
import { format } from 'date-fns';
import { usePaymentStore } from '../state/payments';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';

export const SalesDetail: React.FC = () => {
    const { salesId } = useParams<{ salesId: string }>();
    const navigate = useNavigate();
    const { currentRole } = useRole();

    const salesAgent = useSalesStore(state => state.getSalesById(salesId!));
    const customers = useCustomerStore(state => state.getCustomersBySalesId(salesId!));
    const paymentsStore = usePaymentStore(state => state.payments);

    // Sales detail is only visible to SUPER_ADMIN
    if (currentRole !== 'SUPER_ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }

    if (!salesAgent) return <div className="p-8 text-center text-gray-500">영업자 정보를 찾을 수 없습니다.</div>;

    const assignedCustomerIds = new Set(customers.map(c => c.customerId));
    const agentPayments = paymentsStore.filter(p => assignedCustomerIds.has(p.customerId));

    const totalRevenue = agentPayments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">{salesAgent.name} 영업사원 상세</h2>

            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <Card className="p-6">
                    <dt className="text-sm font-medium text-gray-500">담당 고객 수</dt>
                    <dd className="mt-2 text-3xl font-semibold text-gray-900">{customers.length}명</dd>
                </Card>
                <Card className="p-6">
                    <dt className="text-sm font-medium text-gray-500">누적 발생 매출 (유효 결제)</dt>
                    <dd className="mt-2 text-3xl font-semibold text-green-600">{totalRevenue.toLocaleString()}원</dd>
                </Card>
                <Card className="p-6">
                    <dt className="text-sm font-medium text-gray-500">전화번호</dt>
                    <dd className="mt-2 text-xl font-semibold text-gray-900">{salesAgent.phone}</dd>
                </Card>
            </dl>

            <Card className="p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4">담당 고객 목록</h3>
                <Table>
                    <Thead>
                        <Tr>
                            <Th>고객명</Th>
                            <Th>Account ID</Th>
                            <Th>업종</Th>
                            <Th>가입일</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {customers.map(c => (
                            <Tr key={c.customerId} onClick={() => navigate(`/customers/${c.customerId}`)} className="cursor-pointer hover:bg-gray-50">
                                <Td className="font-medium text-gray-900">{c.name}</Td>
                                <Td>{c.accountId}</Td>
                                <Td>{c.industry}</Td>
                                <Td>{format(new Date(c.joinedAt), 'yyyy-MM-dd')}</Td>
                            </Tr>
                        ))}
                        {customers.length === 0 && (
                            <Tr>
                                <Td colSpan={4} className="text-center py-8 text-gray-500">담당하는 고객이 없습니다.</Td>
                            </Tr>
                        )}
                    </Tbody>
                </Table>
            </Card>
        </div>
    );
};
