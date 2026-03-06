import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useSalesStore } from '../state/sales';
import { useCustomerStore } from '../state/customers';
import { useAuthStore } from '../state/auth';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { format } from 'date-fns';
import { usePaymentStore } from '../state/payments';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import type { Settlement } from '../mock/types';

export const SalesDetail: React.FC = () => {
    const { salesId } = useParams<{ salesId: string }>();
    const navigate = useNavigate();
    const { currentRole } = useAuthStore();

    const salesAgent = useSalesStore(state => state.getSalesById(salesId!));
    const customers = useCustomerStore(state => state.getCustomersBySalesId(salesId!));
    const paymentsStore = usePaymentStore(state => state.payments);

    // Sales detail is only visible to ADMIN
    if (currentRole !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }

    if (!salesAgent)
        return (
            <div className="flex justify-center items-center h-64">
                <EmptyState title="영업자 정보를 찾을 수 없습니다" description="존재하지 않는 영엄사원 ID입니다." />
            </div>
        );

    const assignedCustomerIds = new Set(customers.map(c => c.customerId));
    const agentPayments = paymentsStore.filter(p => assignedCustomerIds.has(p.customerId));

    const totalRevenue = agentPayments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + p.amount, 0);

    // Mock Settlements
    const mockSettlements: Settlement[] = [
        { settlementId: 'stl_005', salesId: salesId!, periodFrom: '2024-02-01', periodTo: '2024-02-29', amount: Math.floor(totalRevenue * 0.15), status: 'PENDING' },
        { settlementId: 'stl_004', salesId: salesId!, periodFrom: '2024-01-01', periodTo: '2024-01-31', amount: 1250000, status: 'CONFIRMED' },
        { settlementId: 'stl_003', salesId: salesId!, periodFrom: '2023-12-01', periodTo: '2023-12-31', amount: 1400000, status: 'PAID' },
        { settlementId: 'stl_002', salesId: salesId!, periodFrom: '2023-11-01', periodTo: '2023-11-30', amount: 980000, status: 'PAID' },
        { settlementId: 'stl_001', salesId: salesId!, periodFrom: '2023-10-01', periodTo: '2023-10-31', amount: 850000, status: 'PAID' },
    ];

    const getSettlementStatusBadge = (status: Settlement['status']) => {
        switch (status) {
            case 'PAID': return <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-emerald-200">정산 완료</span>;
            case 'CONFIRMED': return <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-blue-200">정산 확정</span>;
            case 'PENDING': return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-gray-200">정산 대기 중</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">{salesAgent.name} 영업사원 상세 정보</h2>
                <button onClick={() => navigate('/sales')} className="text-sm border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 font-medium bg-white shadow-sm transition-colors">목록으로</button>
            </div>

            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <Card className="px-5 py-6 bg-white shadow-sm border border-gray-200">
                    <dt className="text-sm font-bold text-gray-500">담당 고객 수</dt>
                    <dd className="mt-2 text-3xl font-extrabold text-gray-900 border-l-4 border-indigo-500 pl-3">{customers.length.toLocaleString()}명</dd>
                </Card>
                <Card className="px-5 py-6 bg-white shadow-sm border border-gray-200">
                    <dt className="text-sm font-bold text-gray-500">누적 발생 매출 (유효 결제)</dt>
                    <dd className="mt-2 text-3xl font-extrabold text-emerald-600 border-l-4 border-emerald-500 pl-3">{totalRevenue.toLocaleString()}원</dd>
                </Card>
                <Card className="px-5 py-6 bg-white shadow-sm border border-gray-200">
                    <dt className="text-sm font-bold text-gray-500">전화번호 / ID</dt>
                    <dd className="mt-2 text-xl font-bold text-gray-900 border-l-4 border-blue-500 pl-3">{salesAgent.phone}</dd>
                    <dd className="mt-1 text-sm font-medium text-gray-400 pl-4">{salesAgent.salesId}</dd>
                </Card>
            </dl>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-5 bg-white shadow-sm border border-gray-200">
                    <div className="border-b pb-3 mb-4">
                        <h3 className="text-lg font-bold text-gray-900">담당 고객 목록</h3>
                    </div>
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
                                <Tr key={c.customerId} onClick={() => navigate(`/customers/${c.customerId}`)} className="cursor-pointer hover:bg-indigo-50 transition-colors">
                                    <Td className="font-bold text-gray-900">{c.name}</Td>
                                    <Td className="text-gray-500 font-mono text-xs">{c.accountId}</Td>
                                    <Td className="text-gray-600 font-medium">{c.industry}</Td>
                                    <Td className="text-gray-500">{format(new Date(c.joinedAt), 'yyyy-MM-dd')}</Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                    {customers.length === 0 && (
                        <EmptyState description="현재 이 영업사원이 담당하고 있는 고객이 없습니다." />
                    )}
                </Card>

                <Card className="p-5 bg-indigo-50 shadow-sm border border-indigo-100">
                    <div className="border-b border-indigo-200 pb-3 mb-4 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-indigo-900">최근 정산 내역</h3>
                        <span className="text-xs font-semibold text-indigo-600 bg-white px-2 py-1 flex items-center rounded-md text-nowrap border border-indigo-200">Mock Data</span>
                    </div>
                    <Table className="bg-white rounded-lg overflow-hidden border border-indigo-100 shadow-sm">
                        <Thead className="bg-indigo-50/50">
                            <Tr>
                                <Th className="text-indigo-900">정산 대상월</Th>
                                <Th className="text-indigo-900 text-right">정산 금액</Th>
                                <Th className="text-indigo-900 text-center">지급 상태</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {mockSettlements.map(stl => (
                                <Tr key={stl.settlementId} className="hover:bg-indigo-50/30">
                                    <Td className="text-indigo-900 font-medium text-sm">
                                        {format(new Date(stl.periodFrom), 'yyyy년 MM월')}
                                    </Td>
                                    <Td className="text-gray-900 font-extrabold text-right">
                                        {stl.amount.toLocaleString()}원
                                    </Td>
                                    <Td className="text-center">
                                        {getSettlementStatusBadge(stl.status)}
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Card>
            </div>
        </div>
    );
};
