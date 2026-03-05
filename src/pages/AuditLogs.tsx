import React, { useState } from 'react';
import { useAppStore } from '../state/store';
import { useRole } from '../state/role';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { format, parseISO } from 'date-fns';
import { Navigate } from 'react-router-dom';

export const AuditLogs: React.FC = () => {
    const { auditLogs } = useAppStore();
    const { currentRole } = useRole();
    const [filterType, setFilterType] = useState('');
    const [filterRole, setFilterRole] = useState('');

    // Access check
    if (currentRole === 'SALES_BRANCH') {
        return <Navigate to="/" replace />;
    }

    const displayLogs = auditLogs.filter(log => {
        const matchType = filterType ? log.actionType.includes(filterType) : true;
        const matchRole = filterRole ? log.actorRole === filterRole : true;
        return matchType && matchRole;
    }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">시스템 감사 로그</h2>
            </div>

            <Card className="p-4 bg-gray-50 border border-gray-200">
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Action Type 검색"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 text-sm focus:ring-2 focus:ring-indigo-600 sm:max-w-xs"
                    />
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 px-3 text-sm focus:ring-2 focus:ring-indigo-600 sm:max-w-xs"
                    >
                        <option value="">모든 권한</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SYSTEM">SYSTEM</option>
                        <option value="SALES_BRANCH">SALES_BRANCH</option>
                    </select>
                </div>
            </Card>

            <Table>
                <Thead>
                    <Tr>
                        <Th>일시</Th>
                        <Th>액션</Th>
                        <Th>작업자 (권한)</Th>
                        <Th>대상</Th>
                        <Th>변경 내용 개요</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {displayLogs.map(log => {
                        const changeSummary = log.after ? JSON.stringify(log.after) : '변경/실행 완료';
                        return (
                            <Tr key={log.logId}>
                                <Td className="whitespace-nowrap">{format(parseISO(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</Td>
                                <Td className="font-medium text-gray-900 break-words whitespace-normal">{log.actionType}</Td>
                                <Td>
                                    {log.actorName} <span className="text-gray-400 text-xs">({log.actorRole})</span>
                                </Td>
                                <Td className="text-gray-500">{log.targetType} <span className="text-xs">[{log.targetId}]</span></Td>
                                <Td className="text-xs text-gray-500 font-mono break-words whitespace-normal max-w-sm">
                                    {changeSummary}
                                </Td>
                            </Tr>
                        )
                    })}
                    {displayLogs.length === 0 && (
                        <Tr>
                            <Td colSpan={5} className="text-center py-8 text-gray-500">조회된 로그가 없습니다.</Td>
                        </Tr>
                    )}
                </Tbody>
            </Table>
        </div>
    );
};
