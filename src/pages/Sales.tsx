import React, { useState } from 'react';
import { useAppStore } from '../state/store';
import { useRole } from '../state/role';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Drawer } from '../components/ui/Drawer';
import { format } from 'date-fns';
import { Badge, getSubscriptionBadgeVariant, SubscriptionStatusKR, getPaymentBadgeVariant, PaymentStatusKR } from '../components/ui/Badge';
import { Navigate } from 'react-router-dom';

export const Sales: React.FC = () => {
    const { sales, customers, payments, subscriptions } = useAppStore();
    const { currentRole } = useRole();
    const [selectedSalesId, setSelectedSalesId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'PERFORMANCE' | 'SETTLEMENTS'>('CUSTOMERS');

    // Hard block for non-admins (already filtered in Sidebar, but good to have)
    if (currentRole !== 'SUPER_ADMIN') {
        return <Navigate to="/" replace />;
    }

    const List = sales.map(s => {
        const assignedCusts = customers.filter(c => c.assignedSalesId === s.salesId);
        const assignedCustIds = new Set(assignedCusts.map(c => c.customerId));

        const assignedPayments = payments.filter(p => assignedCustIds.has(p.customerId) && p.status === 'PAID');
        const totalRev = assignedPayments.reduce((acc, p) => acc + p.amount, 0);

        return {
            ...s,
            totalCustomers: assignedCusts.length,
            totalRevenue: totalRev,
        };
    });

    const selectedSales = List.find(s => s.salesId === selectedSalesId);
    const selectedSalesCustomers = customers.filter(c => c.assignedSalesId === selectedSalesId);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">영업점 관리</h2>
            </div>

            <Table>
                <Thead>
                    <Tr>
                        <Th>영업자명</Th>
                        <Th>전화번호</Th>
                        <Th>담당 고객 수</Th>
                        <Th>총 매출 (연누적)</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {List.map(item => (
                        <Tr key={item.salesId} onClick={() => setSelectedSalesId(item.salesId)} className="cursor-pointer">
                            <Td className="font-medium text-gray-900">{item.name}</Td>
                            <Td>{item.phone}</Td>
                            <Td>{item.totalCustomers}명</Td>
                            <Td>{item.totalRevenue.toLocaleString()}원</Td>
                        </Tr>
                    ))}
                    {List.length === 0 && (
                        <Tr>
                            <Td colSpan={4} className="text-center py-8 text-gray-500">데이터가 없습니다.</Td>
                        </Tr>
                    )}
                </Tbody>
            </Table>

            <Drawer
                isOpen={selectedSalesId !== null}
                onClose={() => { setSelectedSalesId(null); setActiveTab('CUSTOMERS'); }}
                title="영업자 상세 정보"
            >
                {selectedSales && (
                    <div className="flex flex-col h-full -mx-4 sm:-mx-6 px-4 sm:px-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{selectedSales.name}</h3>
                            <p className="text-sm text-gray-500">{selectedSales.phone} / {selectedSales.salesId}</p>
                        </div>

                        {/* UI Tabs */}
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                {[
                                    { id: 'CUSTOMERS', name: '담당 고객' },
                                    { id: 'PERFORMANCE', name: '성과 요약' },
                                    { id: 'SETTLEMENTS', name: '정산 내역' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`
                       whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                       ${activeTab === tab.id
                                                ? 'border-indigo-500 text-indigo-600'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                            }
                     `}
                                    >
                                        {tab.name}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="pt-6 flex-1 overflow-y-auto">
                            {activeTab === 'CUSTOMERS' && (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded flex items-start">
                                        ℹ️ 현재 관리 중인 고객 목록입니다. 고객 할당은 신규 가입 시 자동 매핑되거나 Super Admin이 수동 등록합니다.
                                    </div>
                                    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500">고객명</th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500">구독/결제 상태</th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500">가입일</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {selectedSalesCustomers.map(c => {
                                                    const sub = subscriptions.find(s => s.customerId === c.customerId);
                                                    const pay = payments.filter(p => p.customerId === c.customerId).sort((a, b) => b.paidAt.localeCompare(a.paidAt))[0];
                                                    return (
                                                        <tr key={c.customerId}>
                                                            <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                                                            <td className="px-4 py-3 flex gap-1">
                                                                <Badge variant={getSubscriptionBadgeVariant(sub?.status || '')}>
                                                                    {SubscriptionStatusKR[sub?.status || ''] || '-'}
                                                                </Badge>
                                                                <Badge variant={getPaymentBadgeVariant(pay?.status || '')}>
                                                                    {PaymentStatusKR[pay?.status || ''] || '-'}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-500 text-xs">{format(new Date(c.joinedAt), 'yy/MM/dd')}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'PERFORMANCE' && (
                                <div className="space-y-6">
                                    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <Card className="px-4 py-5 sm:p-6 bg-gray-50 shadow-none border border-gray-200">
                                            <dt className="truncate text-sm font-medium text-gray-500">총 고객 수</dt>
                                            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{selectedSales.totalCustomers}명</dd>
                                        </Card>
                                        <Card className="px-4 py-5 sm:p-6 bg-gray-50 shadow-none border border-gray-200">
                                            <dt className="truncate text-sm font-medium text-gray-500">발생 매출 합계</dt>
                                            <dd className="mt-1 text-3xl font-semibold tracking-tight text-indigo-600">{selectedSales.totalRevenue.toLocaleString()}원</dd>
                                        </Card>
                                    </dl>
                                </div>
                            )}

                            {activeTab === 'SETTLEMENTS' && (
                                <div className="text-center py-12 text-sm text-gray-500 border border-dashed border-gray-300 rounded bg-gray-50">
                                    <p className="mb-2">정산 내역 Placeholder 데이터</p>
                                    <p className="text-xs text-gray-400">이번 달 정산 예정액: {(selectedSales.totalRevenue * 0.1).toLocaleString()}원 (10% 커미션 기준)</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Drawer>

        </div>
    );
};
