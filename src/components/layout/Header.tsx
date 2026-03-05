import React from 'react';
import { RoleSwitcher } from '../../state/role';
import { useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
    const location = useLocation();

    const getPageTitle = (pathname: string) => {
        switch (pathname) {
            case '/dashboard': return 'Dashboard';
            case '/customers': return 'Customers';
            case '/inquiries': return 'Inquiries';
            case '/sales': return 'Sales';
            case '/analytics': return 'Analytics';
            case '/audit': return 'Audit Logs';
            default: return 'Admin Portal';
        }
    };

    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div className="flex flex-1 items-center">
                    <h1 className="text-2xl font-semibold leading-6 text-gray-900">{getPageTitle(location.pathname)}</h1>
                </div>
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <RoleSwitcher />
                </div>
            </div>
        </header>
    );
};
