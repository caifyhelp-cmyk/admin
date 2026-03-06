export type Role = 'ADMIN' | 'MANAGER' | 'SALES';

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
  customerId: string;
  name: string; // 고객명
  industry: string; // 업종
  contact: string;
  accountId: string;
  joinedAt: string; // ISO date string
  assignedSalesId: string | null;
  serviceStatus?: ServiceStatus;
  trialEndDate?: string;
  trialCount?: number;
  prompt?: string;
  memo?: string;
}

export interface SalesLead {
  leadId: string;
  salesId: string; // 기준 키
  salesName: string; // 표시/서치용
  salesPhone: string; // 표시/서치용
  customerName: string;
  customerPhone: string; // 매칭용 고객 번호
  industry: string;
  trialGrantFlag: boolean;
  status: 'CONTACTED' | 'TRIAL' | 'CONVERTED' | 'DROPPED';
  createdAt: string;
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
  id: string;
  actorRole: Role;
  actorName: string;
  actionType: string;
  targetType: 'PAYMENT' | 'SUBSCRIPTION' | 'INQUIRY' | 'CUSTOMER' | 'SALES' | 'SALES_LEAD' | string;
  targetId: string;
  meta?: {
    amount?: number;
    prevStatus?: string;
    newStatus?: string;
    reason?: string;
    field?: string;
    oldValue?: any;
    newValue?: any;
    [key: string]: any;
  };
  before?: any;
  after?: any;
  timestamp: string;
}
