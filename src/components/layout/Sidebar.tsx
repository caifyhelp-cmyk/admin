import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../state/auth';
import { LayoutDashboard, Users, MessageSquare, Briefcase, BarChart2, ClipboardList, Repeat, CreditCard } from 'lucide-react';
import { clsx } from 'clsx';
import { BREADCRUMB_LABELS } from '../../constants/labels';

export const Sidebar: React.FC = () => {
    const { currentRole } = useAuthStore();

    const navigation = [
        { name: '대시보드', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'SALES_BRANCH'] },
        { name: BREADCRUMB_LABELS['customers'] || '고객 관리', href: '/customers', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'SALES_BRANCH'] },
        { name: BREADCRUMB_LABELS['subscriptions'] || '구독 관리', href: '/subscriptions', icon: Repeat, roles: ['SUPER_ADMIN', 'ADMIN', 'SALES_BRANCH'] },
        { name: BREADCRUMB_LABELS['payments'] || '결제 내역', href: '/payments', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'SALES_BRANCH'] },
        { name: BREADCRUMB_LABELS['inquiries'] || '문의 관리', href: '/inquiries', icon: MessageSquare, roles: ['SUPER_ADMIN', 'ADMIN', 'SALES_BRANCH'] },
        { name: BREADCRUMB_LABELS['sales'] || '영업점 관리', href: '/sales', icon: Briefcase, roles: ['SUPER_ADMIN'] },
        { name: '매출 분석', href: '/analytics', icon: BarChart2, roles: ['SUPER_ADMIN', 'ADMIN', 'SALES_BRANCH'] },
        { name: '감사 로그', href: '/audit', icon: ClipboardList, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ];

    const filteredNav = navigation.filter(item => item.roles.includes(currentRole));

    return (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
                <span className="text-2xl font-bold text-indigo-600">SaaS Admin</span>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {filteredNav.map((item) => (
                                <li key={item.name}>
                                    <NavLink
                                        to={item.href}
                                        className={({ isActive }) =>
                                            clsx(
                                                isActive
                                                    ? 'bg-gray-50 text-indigo-600'
                                                    : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                            )
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <item.icon
                                                    className={clsx(
                                                        isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                                                        'h-6 w-6 shrink-0'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                {item.name}
                                            </>
                                        )}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </li>
                </ul>
            </nav>
        </div>
    );
};
