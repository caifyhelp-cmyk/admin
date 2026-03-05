import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInquiryStore } from '../state/inquiries';
import { useCustomerStore } from '../state/customers';
import { useRole } from '../state/role';
import { Card } from '../components/ui/Card';
import { Badge, getInquiryBadgeVariant, InquiryStatusKR } from '../components/ui/Badge';
import { format } from 'date-fns';

export const InquiryDetail: React.FC = () => {
    const { inquiryId } = useParams<{ inquiryId: string }>();
    const navigate = useNavigate();
    const { currentRole, currentSalesId } = useRole();

    const inquiry = useInquiryStore(state => state.getInquiryById(inquiryId!));
    const customer = useCustomerStore(state => inquiry ? state.getCustomerById(inquiry.customerId) : undefined);
    const updateInquiryStatus = useInquiryStore(state => state.updateInquiryStatus);

    const [answerInput, setAnswerInput] = useState(inquiry?.answer?.content || '');

    if (!inquiry) return <div className="p-8 text-center text-gray-500">문의 정보를 찾을 수 없습니다.</div>;

    // Check SALES_BRANCH exact access
    if (currentRole === 'SALES_BRANCH' && customer?.assignedSalesId !== currentSalesId) {
        return <div className="p-8 text-center text-red-500 font-medium">접근 권한이 없습니다 (담당 고객이 아님).</div>;
    }

    const handleAnswerSubmit = () => {
        if (!answerInput.trim()) return;
        updateInquiryStatus(inquiry.inquiryId, 'ANSWERED', answerInput, currentRole, 'Current User');
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">문의 상세</h2>
                <Badge variant={getInquiryBadgeVariant(inquiry.status)}>{InquiryStatusKR[inquiry.status]}</Badge>
            </div>

            <Card className="p-6">
                <div className="border-b pb-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">{inquiry.title}</h1>
                    <div className="mt-2 text-sm text-gray-500 flex gap-4">
                        <span>작성일: {format(new Date(inquiry.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                        {customer && (
                            <span>
                                고객명: <span onClick={() => navigate(`/customers/${customer.customerId}`)} className="text-indigo-600 hover:underline cursor-pointer">{customer.name}</span>
                            </span>
                        )}
                        <span>유형: {inquiry.type}</span>
                    </div>
                </div>

                <div className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed min-h-[100px]">
                    {inquiry.content}
                </div>
            </Card>

            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">답변 처리</h3>

                {inquiry.answer && (
                    <Card className="p-6 bg-indigo-50 border border-indigo-100">
                        <div className="flex justify-between mb-2">
                            <span className="font-semibold text-indigo-900">기존 답변 ({inquiry.answer.authorRole})</span>
                            <span className="text-xs text-indigo-600">{format(new Date(inquiry.answer.updatedAt), 'yyyy-MM-dd HH:mm')}</span>
                        </div>
                        <div className="whitespace-pre-wrap text-indigo-900 text-sm">
                            {inquiry.answer.content}
                        </div>
                    </Card>
                )}

                <Card className="p-6">
                    <label htmlFor="answer" className="block text-sm font-medium leading-6 text-gray-900 mb-2">
                        {inquiry.answer ? '답변 수정' : '새 답변 작성'}
                    </label>
                    <textarea
                        id="answer"
                        rows={5}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        value={answerInput}
                        onChange={(e) => setAnswerInput(e.target.value)}
                        placeholder="고객에게 전달될 답변을 입력하세요."
                    />
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={handleAnswerSubmit}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            답변 저장 및 완료 처리
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};
