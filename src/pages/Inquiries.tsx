import React, { useState } from 'react';
import { useAppStore } from '../state/store';
import { useRole } from '../state/role';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Badge, getInquiryBadgeVariant, InquiryStatusKR } from '../components/ui/Badge';
import { Drawer } from '../components/ui/Drawer';
import { format } from 'date-fns';

export const Inquiries: React.FC = () => {
    const { inquiries, customers, updateInquiryStatus } = useAppStore();
    const { currentRole, currentSalesId } = useRole();
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);

    // States for Answer Edit
    const [answerDraft, setAnswerDraft] = useState('');
    const [isEditingAnswer, setIsEditingAnswer] = useState(false);

    // Role Base filtering
    let baseInquiries = inquiries;
    if (currentRole === 'SALES_BRANCH') {
        const assignedCustIds = new Set(customers.filter(c => c.assignedSalesId === currentSalesId).map(c => c.customerId));
        baseInquiries = inquiries.filter(i => assignedCustIds.has(i.customerId));
    }

    // Final filtered
    const displayList = baseInquiries
        .filter(i => filterStatus ? i.status === filterStatus : true)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(i => {
            const c = customers.find(c => c.customerId === i.customerId);
            return { ...i, customerName: c?.name || '알 수 없음' };
        });

    const selectedInquiry = displayList.find(i => i.inquiryId === selectedInquiryId);

    const handleRowClick = (inqId: string) => {
        setSelectedInquiryId(inqId);
        const inq = inquiries.find(i => i.inquiryId === inqId);
        if (inq?.answer) {
            setAnswerDraft(inq.answer.content);
            setIsEditingAnswer(false);
        } else {
            setAnswerDraft('');
            setIsEditingAnswer(true);
        }
    };

    const handleSaveAnswer = () => {
        if (!selectedInquiry || !answerDraft.trim()) return;
        updateInquiryStatus(selectedInquiry.inquiryId, 'ANSWERED', answerDraft, currentRole);
        setIsEditingAnswer(false);
    };

    const handleResendNotification = () => {
        if (!selectedInquiry) return;
        // By updating with same content, it triggers the audit log update
        // Note: Our store auto-sends ONLY on CREATE. Let's fire a specific custom mock event
        // To keep it simple, we just re-save it to trigger UPDATE_INQUIRY_ANSWER. 
        // In a real app we'd have a specific `resendNotification` action.
        alert('카카오 알림톡을 재전송했습니다! (Mock)');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">문의 내역</h2>
            </div>

            <Card className="p-4 bg-gray-50 border border-gray-200">
                <div className="flex gap-4">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 text-sm focus:ring-2 focus:ring-indigo-600 sm:max-w-xs"
                    >
                        <option value="">상태 전체</option>
                        {Object.entries(InquiryStatusKR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </div>
            </Card>

            <Table>
                <Thead>
                    <Tr>
                        <Th>문의 제목</Th>
                        <Th>고객명</Th>
                        <Th>문의 유형</Th>
                        <Th>작성일</Th>
                        <Th>상태</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {displayList.map(item => (
                        <Tr key={item.inquiryId} onClick={() => handleRowClick(item.inquiryId)} className="cursor-pointer">
                            <Td className="font-medium text-gray-900 truncate max-w-sm">{item.title}</Td>
                            <Td>{item.customerName}</Td>
                            <Td>{item.type}</Td>
                            <Td>{format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm')}</Td>
                            <Td>
                                <Badge variant={getInquiryBadgeVariant(item.status)}>
                                    {InquiryStatusKR[item.status] || item.status}
                                </Badge>
                            </Td>
                        </Tr>
                    ))}
                    {displayList.length === 0 && (
                        <Tr>
                            <Td colSpan={5} className="text-center py-8 text-gray-500">데이터가 없습니다.</Td>
                        </Tr>
                    )}
                </Tbody>
            </Table>

            <Drawer
                isOpen={selectedInquiryId !== null}
                onClose={() => setSelectedInquiryId(null)}
                title="문의 상세"
            >
                {selectedInquiry && (
                    <div className="space-y-6">
                        <section className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 leading-tight">{selectedInquiry.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{selectedInquiry.customerName} · {selectedInquiry.type} · {format(new Date(selectedInquiry.createdAt), 'yyyy-MM-dd HH:mm')}</p>
                                </div>
                                <Badge variant={getInquiryBadgeVariant(selectedInquiry.status)}>
                                    {InquiryStatusKR[selectedInquiry.status]}
                                </Badge>
                            </div>
                            <div className="mt-4 prose prose-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded text-sm">
                                {selectedInquiry.content}
                            </div>
                        </section>

                        <section className="bg-indigo-50/50 p-5 rounded-lg border border-indigo-100">
                            <h3 className="text-md font-semibold text-gray-900 mb-4 flex justify-between items-center">
                                <span>답변 영역</span>
                                {selectedInquiry.answer && !isEditingAnswer && (
                                    <button
                                        onClick={() => setIsEditingAnswer(true)}
                                        className="text-indigo-600 text-sm font-medium hover:underline"
                                    >
                                        수정
                                    </button>
                                )}
                            </h3>

                            {isEditingAnswer && currentRole !== 'SALES_BRANCH' ? (
                                <div className="space-y-3">
                                    <textarea
                                        rows={5}
                                        className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                        placeholder="답변을 작성하세요..."
                                        value={answerDraft}
                                        onChange={e => setAnswerDraft(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setIsEditingAnswer(false)}
                                            className="rounded bg-white px-3 py-1.5 text-sm outline-none font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                        >
                                            취소
                                        </button>
                                        <button
                                            onClick={handleSaveAnswer}
                                            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                        >
                                            저장
                                        </button>
                                    </div>
                                </div>
                            ) : selectedInquiry.answer ? (
                                <div className="space-y-4">
                                    <div className="prose prose-sm text-gray-700 whitespace-pre-wrap p-4 bg-white rounded border border-gray-100">
                                        {selectedInquiry.answer.content}
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>작성: {selectedInquiry.answer.authorRole} · {format(new Date(selectedInquiry.answer.updatedAt), 'yyyy-MM-dd HH:mm')}</span>
                                        {currentRole !== 'SALES_BRANCH' && (
                                            <button
                                                onClick={handleResendNotification}
                                                className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                                            >
                                                알림톡 재전송
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-sm text-gray-500 bg-white rounded border border-dashed border-gray-300">
                                    아직 작성된 답변이 없습니다.
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </Drawer>

        </div>
    );
};
