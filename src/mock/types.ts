export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SALES_BRANCH';

export type SubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAYMENT_FAILED'
  | 'SUSPENDED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'PAID'
  | 'FAILED'
  | 'PENDING'
  | 'REFUND'
  | 'REFUND_REQUESTED';

export type InquiryStatus = 'OPEN' | 'ANSWERED';
export type ServiceStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL';

export interface Customer {
<<<<<<< HEAD
  customerId: string;
  name: string;
  industry: string;
  contact: string;
  accountId: string;
  joinedAt: string;
  assignedSalesId: string | null;
=======
    customerId: string;
    name: string; // 고객명
    industry: string; // 업종
    contact: string;
    accountId: string;
    joinedAt: string; // ISO date string
    assignedSalesId: string | null;
    serviceStatus?: ServiceStatus;
    trialEndDate?: string;
    prompt?: string;
>>>>>>> f453829 (update admin ui)
}

export interface Subscription {
  subscriptionId: string;
  customerId: string;
  product: string;
  status: SubscriptionStatus;
  startAt: string;
  endAt: string;
  nextBillingAt: string;
}

export interface Payment {
  paymentId: string;
  customerId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt: string;
  method: string;
  billingCycleNo: number;
}

export interface Answer {
  content: string;
  authorRole: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Inquiry {
  inquiryId: string;
  customerId: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  status: InquiryStatus;
  answer?: Answer;
}

export interface Sales {
  salesId: string;
  name: string;
  phone: string;
}

export interface Settlement {
  settlementId: string;
  salesId: string;
  periodFrom: string;
  periodTo: string;
  amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PAID';
}

export interface AuditLog {
<<<<<<< HEAD
  id: string;
  actorRole: Role;
  actorName: string;
  actionType: string;
  targetType: 'PAYMENT' | 'SUBSCRIPTION' | 'INQUIRY' | 'CUSTOMER' | 'SALES' | string;
  targetId: string;
  meta?: {
    amount?: number;
    prevStatus?: string;
    newStatus?: string;
    reason?: string;
    [key: string]: any;
  };
  timestamp: string;
}
=======
    id: string;
    actorRole: Role;
    actorName: string;
    actionType: string;
    targetType: 'PAYMENT' | 'SUBSCRIPTION' | 'INQUIRY' | 'CUSTOMER' | 'SALES' | string;
    targetId: string;
    meta?: {
        amount?: number;
        prevStatus?: string;
        newStatus?: string;
        reason?: string;
        [key: string]: any;
    };
    before?: any;
    after?: any;
    timestamp: string;
}
>>>>>>> f453829 (update admin ui)
