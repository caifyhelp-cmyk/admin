import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const routeMap: Record<string, string> = {
    'dashboard': '대시보드',
    'customers': '고객 관리',
    'subscriptions': '구독 관리',
    'payments': '결제 내역 관리',
    'inquiries': '고객 문의 관리',
    'sales': '영업 관리',
    'analytics': '매출 분석',
    'audit': '운영 로그',
};

export const Breadcrumb: React.FC = () => {
    const location = useLocation();
    const paths = location.pathname.split('/').filter(Boolean);

    if (paths.length === 0) return null;

    return (
        <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
                <li>
                    <Link to="/" className="hover:text-gray-900">홈</Link>
                </li>
                {paths.map((path, index) => {
                    const isLast = index === paths.length - 1;
                    const to = `/${paths.slice(0, index + 1).join('/')}`;

                    let label = routeMap[path] || path;

                    if (index > 0) {
                        const prevPath = paths[index - 1];
                        if (['customers', 'inquiries', 'sales'].includes(prevPath)) {
                            label = prevPath === 'customers' ? '고객 상세' :
                                prevPath === 'inquiries' ? '문의 상세' :
                                    '영업사원 상세';
                        }
                    }

                    return (
                        <li key={to} className="flex items-center">
                            <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
                            {isLast ? (
                                <span className="font-semibold text-gray-900">{label}</span>
                            ) : (
                                <Link to={to} className="hover:text-gray-900">{label}</Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};
