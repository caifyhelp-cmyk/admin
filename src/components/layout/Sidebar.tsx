import React from 'react';
import { NavLink } from 'react-router-dom';
import { useRole } from '../../state/role';
import { LayoutDashboard, Users, MessageSquare, Briefcase, BarChart2, ClipboardList, Repeat, CreditCard } from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
    const { currentRole } = useRole();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'SALES_BRANCH'] },
        { name: 'Customers', href: '/customers', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'SALES_BRANCH'] },
        { name: 'Subscriptions', href: '/subscriptions', icon: Repeat, roles: ['SUPER_ADMIN', 'ADMIN', 'SALES_BRANCH'] },
        { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'SALES_BRANCH'] },
        { name: 'Inquiries', href: '/inquiries', icon: MessageSquare, roles: ['SUPER_ADMIN', 'ADMIN', 'SALES_BRANCH'] },
        { name: 'Sales', href: '/sales', icon: Briefcase, roles: ['SUPER_ADMIN'] }, // Sales page visible to SUPER_ADMIN only
        { name: 'Analytics', href: '/analytics', icon: BarChart2, roles: ['SUPER_ADMIN', 'ADMIN', 'SALES_BRANCH'] },
        { name: 'Audit Logs', href: '/audit', icon: ClipboardList, roles: ['SUPER_ADMIN', 'ADMIN'] },
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
