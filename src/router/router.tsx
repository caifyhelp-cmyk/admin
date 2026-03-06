import { createHashRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Dashboard } from '../pages/Dashboard';
import { Customers } from '../pages/Customers';
import { Inquiries } from '../pages/Inquiries';
import { Sales } from '../pages/Sales';
import { Analytics } from '../pages/Analytics';
import { AuditLogs } from '../pages/AuditLogs';
import { CustomerDetail } from '../pages/CustomerDetail';
import { InquiryDetail } from '../pages/InquiryDetail';
import { SalesDetail } from '../pages/SalesDetail';
import { Subscriptions } from '../pages/Subscriptions';
import { Payments } from '../pages/Payments';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'customers', element: <Customers /> },
      { path: 'customers/:customerId', element: <CustomerDetail /> },
      { path: 'subscriptions', element: <Subscriptions /> },
      { path: 'payments', element: <Payments /> },
      { path: 'inquiries', element: <Inquiries /> },
      { path: 'inquiries/:inquiryId', element: <InquiryDetail /> },
      { path: 'sales', element: <Sales /> },
      { path: 'sales/:salesId', element: <SalesDetail /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'audit', element: <AuditLogs /> },
    ],
  },
]);