import React, { createContext, useContext, useState } from 'react';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SALES_BRANCH';

interface RoleContextType {
  currentRole: Role;
  setRole: (role: Role) => void;
  currentSalesId: string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setRole] = useState<Role>('SUPER_ADMIN');
  const currentSalesId = 'sales_001';

  return (
    <RoleContext.Provider value={{ currentRole, setRole, currentSalesId }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleSwitcher: React.FC = () => {
  const { currentRole, setRole } = useRole();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="role-switcher" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Role Simulator:
      </label>
      <select
        id="role-switcher"
        value={currentRole}
        onChange={(e) => setRole(e.target.value as Role)}
        className="block w-40 rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
      >
        <option value="SUPER_ADMIN">Super Admin</option>
        <option value="ADMIN">Admin</option>
        <option value="SALES_BRANCH">Sales Branch</option>
      </select>
    </div>
  );
};
