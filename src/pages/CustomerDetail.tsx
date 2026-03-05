import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomerStore } from '../state/customers';
import { useSubscriptionStore } from '../state/subscriptions';
import { usePaymentStore } from '../state/payments';
import { useInquiryStore } from '../state/inquiries';
import { useSalesStore } from '../state/sales';
import { Card } from '../components/ui/Card';
import { Badge, getSubscriptionBadgeVariant, SubscriptionStatusKR, getPaymentBadgeVariant, PaymentStatusKR, getInquiryBadgeVariant, InquiryStatusKR } from '../components/ui/Badge';
import { format } from 'date-fns';

export const CustomerDetail: React.FC = () => {
    const { customerId } = useParams<{ customerId: string }>();
    const navigate = useNavigate();

    const customer = useCustomerStore(state => state.getCustomerById(customerId!));
    const subscription = useSubscriptionStore(state => state.getSubscriptionByCustomerId(customerId!));
    const payments = usePaymentStore(state => state.getPaymentsByCustomerId(customerId!))
        .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
    const inquiries = useInquiryStore(state => state.getInquiriesByCustomerId(customerId!))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const salesAgent = useSalesStore(state => customer?.assignedSalesId ? state.getSalesById(customer.assignedSalesId) : undefined);

    if (!customer) {
        return <div className="p-8 text-center text-gray-500">고객 정보를 찾을 수 없습니다.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">{customer.name} 상세 정보</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">기본 정보</h3>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-gray-500">Account ID</dt>
                            <dd className="font-medium text-gray-900 mt-1">{customer.accountId}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">업종</dt>
                            <dd className="font-medium text-gray-900 mt-1">{customer.industry}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">연락처</dt>
                            <dd className="font-medium text-gray-900 mt-1">{customer.contact}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">가입일</dt>
                            <dd className="font-medium text-gray-900 mt-1">{format(new Date(customer.joinedAt), 'yyyy-MM-dd HH:mm')}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">담당 영업자</dt>
                            <dd className="font-medium text-gray-900 mt-1">
                                {salesAgent ? (
                                    <span
                                        className="text-indigo-600 cursor-pointer hover:underline"
                                        onClick={() => navigate(`/sales/${salesAgent.salesId}`)}
                                    >
                                        {salesAgent.name}
                                    </span>
                                ) : '없음'}
                            </dd>
                        </div>
                    </dl>
                </Card>

                {subscription && (
                    <Card className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">구독 정보</h3>
                        <dl className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <dt className="text-gray-500">상품</dt>
                                <dd className="font-medium text-gray-900 mt-1">{subscription.product}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">상태</dt>
                                <dd className="font-medium text-gray-900 mt-1">
                                    <Badge variant={getSubscriptionBadgeVariant(subscription.status)}>
                                        {SubscriptionStatusKR[subscription.status] || subscription.status}
                                    </Badge>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">시작일</dt>
                                <dd className="font-medium text-gray-900 mt-1">{format(new Date(subscription.startAt), 'yyyy-MM-dd')}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">다음 결제예정일</dt>
                                <dd className="font-medium text-gray-900 mt-1">{format(new Date(subscription.nextBillingAt), 'yyyy-MM-dd')}</dd>
                            </div>
                        </dl>
                    </Card>
                )}
            </div>

            <Card className="p-6">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-lg font-medium text-gray-900">최근 결제</h3>
                    <button onClick={() => navigate('/payments')} className="text-sm text-indigo-600 hover:text-indigo-800">전체 보기</button>
                </div>
                <div className="space-y-3">
                    {payments.length === 0 && <p className="text-sm text-gray-500">결제 내역이 없습니다.</p>}
                    {payments.slice(0, 5).map(p => (
                        <div key={p.paymentId} className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-100 text-sm">
                            <div>
                                <p className="font-medium text-gray-900">{p.amount.toLocaleString()}원</p>
                                <p className="text-gray-500 text-xs mt-1">{format(new Date(p.paidAt), 'yyyy-MM-dd HH:mm')} / {p.method}</p>
                            </div>
                            <Badge variant={getPaymentBadgeVariant(p.status)}>{PaymentStatusKR[p.status] || p.status}</Badge>
                        </div>
                    ))}
                </div>
            </Card>

            <Card className="p-6">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-lg font-medium text-gray-900">최근 문의</h3>
                    <button onClick={() => navigate('/inquiries')} className="text-sm text-indigo-600 hover:text-indigo-800">전체 보기</button>
                </div>
                <div className="space-y-3">
                    {inquiries.length === 0 && <p className="text-sm text-gray-500">문의 내역이 없습니다.</p>}
                    {inquiries.slice(0, 5).map(inq => (
                        <div
                            key={inq.inquiryId}
                            onClick={() => navigate(`/inquiries/${inq.inquiryId}`)}
                            className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 cursor-pointer p-3 rounded-md border border-gray-100 text-sm transition-colors"
                        >
                            <div className="flex-1 min-w-0 pr-4">
                                <p className="font-medium text-gray-900 truncate">{inq.title}</p>
                                <p className="text-gray-500 text-xs mt-1">{format(new Date(inq.createdAt), 'yyyy-MM-dd')}</p>
                            </div>
                            <Badge variant={getInquiryBadgeVariant(inq.status)}>{InquiryStatusKR[inq.status] || inq.status}</Badge>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};
