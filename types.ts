
export enum CoffeeOrigin {
  SIDAMA = 'Sidama',
  YIRGACHEFFE = 'Yirgacheffe',
  GUJI = 'Guji',
  HARRAR = 'Harrar',
  LIMU = 'Limu',
  OTHER = 'Other',
}

export enum CustomerStatus {
  LEAD = 'Lead',
  ACTIVE = 'Active',
  REPEAT = 'Repeat',
  DORMANT = 'Dormant',
}

export enum Certification {
  ORGANIC = 'Organic',
  FAIR_TRADE = 'Fair Trade',
  RAINFOREST_ALLIANCE = 'Rainforest Alliance',
  UTZ = 'UTZ Certified',
}

export interface Interaction {
  id: string;
  date: string;
  type: 'Call' | 'Sample' | 'Email' | 'Meeting';
  notes: string;
}

export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  country: string;
  email: string;
  phone: string;
  preferredOrigin: CoffeeOrigin;
  certificationsRequired: Certification[];
  status: CustomerStatus;
  assignedSalesRep: string;
  notes: string;
  nextFollowUpDate?: string;
  interactions: Interaction[];
}

export enum ShippingStatus {
  PENDING = 'Pending',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
}

export interface SalesOrder {
  id: string;
  customerId: string;
  product: string; // e.g., Green Coffee Beans Grade 1
  grade: string; // e.g., G1, G2
  quantityKg: number;
  unitPrice: number;
  totalAmount: number;
  shippingStatus: ShippingStatus;
  orderDate: string;
  linkedInvoiceId?: string;
  documents: { name: string; type: string }[]; // Simplified doc tracking
}

export enum PaymentMethod {
  LC = 'Letter of Credit',
  WIRE = 'Wire Transfer',
  CASH = 'Cash',
}

export enum InvoiceStatus {
  PAID = 'Paid',
  PARTIAL = 'Partial',
  UNPAID = 'Unpaid',
  OVERDUE = 'Overdue',
}

export interface Invoice {
  id: string;
  orderId: string;
  customerId: string;
  invoiceNumber: string;
  dateIssued: string;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  paymentMethod?: PaymentMethod;
  datePaid?: string;
  status: InvoiceStatus;
}

export enum ExpenseType {
  LOGISTICS = 'Logistics',
  FARMER_PAYMENT = 'Farmer Payment',
  ADMIN = 'Admin',
  PACKAGING = 'Packaging',
  MARKETING = 'Marketing',
  OTHER = 'Other',
}

export interface Expense {
  id: string;
  expenseType: ExpenseType;
  date: string;
  amount: number;
  paidTo: string;
  relatedOrderId?: string;
  receiptUrl?: string; // For mock upload
  isApproved: boolean;
  description: string;
}

export type NavItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
};

export type AppContextType = {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  addCustomer: (customer: Omit<Customer, 'id' | 'interactions'>) => void;
  updateCustomer: (customer: Customer) => void;
  logInteraction: (customerId: string, interaction: Omit<Interaction, 'id'>) => void;

  salesOrders: SalesOrder[];
  setSalesOrders: React.Dispatch<React.SetStateAction<SalesOrder[]>>;
  addSalesOrder: (order: Omit<SalesOrder, 'id' | 'totalAmount' | 'documents' | 'linkedInvoiceId'>) => string; // Returns new orderId
  updateSalesOrder: (order: SalesOrder) => void;

  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => void;
  updateInvoice: (invoice: Invoice) => void;
  generateInvoiceForOrder: (order: SalesOrder) => void;
  
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
};

export type OptionType = {
  value: string;
  label: string;
};