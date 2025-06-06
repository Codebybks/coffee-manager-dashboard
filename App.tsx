import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext
} from 'react';
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { supabase } from './supabaseClient';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import CrmPage from './components/CrmPage';
import SalesPage from './components/SalesPage';
import InvoicesPage from './components/InvoicesPage';
import ExpensesPage from './components/ExpensesPage';
import {
  Customer,
  SalesOrder,
  Invoice,
  Expense,
  NavItem,
  Interaction,
  AppContextType,
  CoffeeOrigin,
  CustomerStatus,
  ShippingStatus,
  InvoiceStatus,
  ExpenseType,
  Certification,
  PaymentMethod
} from './types';
import {
  HomeIcon,
  UsersIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ChartBarIcon
} from './constants';

const initialCustomers: Customer[] = [
  // … your initial customer data …
];

const initialSalesOrders: SalesOrder[] = [
  // … your initial sales order data …
];

const initialInvoices: Invoice[] = [
  // … your initial invoice data …
];

const initialExpenses: Expense[] = [
  // … your initial expense data …
];

export const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContext');
  return ctx;
};

const App: React.FC = () => {
  // ─── 1) ALL HOOKS UP FRONT (always called on every render) ───
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(initialSalesOrders);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  const location = useLocation();
  const navigate = useNavigate();

  // Fetch existing session and listen for changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        navigate('/'); // send back to login
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  // Unique ID generator helper
  const generateId = (prefix: string) =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // ─── 2) ALL useCallback HOOKS (also always called, never inside a conditional) ───
  const addCustomer = useCallback((customerData: Omit<Customer, 'id' | 'interactions'>) => {
    setCustomers((prev) => [
      ...prev,
      { ...customerData, id: generateId('cust'), interactions: [] }
    ]);
  }, []);

  const updateCustomer = useCallback((updatedCustomer: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );
  }, []);

  const logInteraction = useCallback(
    (customerId: string, interactionData: Omit<Interaction, 'id'>) => {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? { ...c, interactions: [...c.interactions, { ...interactionData, id: generateId('int') }] }
            : c
        )
      );
    },
    []
  );

  const addSalesOrder = useCallback(
    (orderData: Omit<SalesOrder, 'id' | 'totalAmount' | 'documents' | 'linkedInvoiceId'>): string => {
      const newOrder: SalesOrder = {
        ...orderData,
        id: generateId('ord'),
        totalAmount: orderData.quantityKg * orderData.unitPrice,
        documents: []
      };
      setSalesOrders((prev) => [...prev, newOrder]);
      return newOrder.id;
    },
    []
  );

  const updateSalesOrder = useCallback((updatedOrder: SalesOrder) => {
    setSalesOrders((prev) =>
      prev.map((o) =>
        o.id === updatedOrder.id
          ? { ...updatedOrder, totalAmount: updatedOrder.quantityKg * updatedOrder.unitPrice }
          : o
      )
    );
  }, []);

  const addInvoice = useCallback(
    (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
      const newInvoiceNumber = `INV-${new Date().getFullYear()}-${(invoices.length + 1)
        .toString()
        .padStart(3, '0')}`;
      setInvoices((prev) => [
        ...prev,
        { ...invoiceData, id: generateId('inv'), invoiceNumber: newInvoiceNumber }
      ]);
    },
    [invoices.length]
  );

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    setInvoices((prev) => prev.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i)));
  }, []);

  const generateInvoiceForOrder = useCallback(
    (order: SalesOrder) => {
      if (order.linkedInvoiceId && invoices.find((inv) => inv.id === order.linkedInvoiceId)) {
        alert('Invoice already exists for this order.');
        return;
      }
      const newInvoiceId = generateId('inv');
      const newInvoiceNumber = `INV-${new Date().getFullYear()}-${(invoices.length + 1)
        .toString()
        .padStart(3, '0')}`;
      const dueDate = new Date(order.orderDate);
      dueDate.setDate(dueDate.getDate() + 30);

      const newInvoice: Invoice = {
        id: newInvoiceId,
        orderId: order.id,
        customerId: order.customerId,
        invoiceNumber: newInvoiceNumber,
        dateIssued: new Date().toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        amountDue: order.totalAmount,
        amountPaid: 0,
        status: InvoiceStatus.UNPAID,
        paymentMethod: PaymentMethod.WIRE,
        datePaid: ''
      };
      setInvoices((prev) => [...prev, newInvoice]);
      setSalesOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, linkedInvoiceId: newInvoiceId } : o))
      );
    },
    [invoices]
  );

  const addExpense = useCallback((expenseData: Omit<Expense, 'id'>) => {
    setExpenses((prev) => [...prev, { ...expenseData, id: generateId('exp') }]);
  }, []);

  const updateExpense = useCallback((updatedExpense: Expense) => {
    setExpenses((prev) => prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e)));
  }, []);

  // ─── 3) NOW DO EARLY RETURN FOR AUTH STATES ───
  if (loadingAuth) {
    return <div style={{ padding: 20 }}>Loading…</div>;
  }
  if (!session) {
    return <LoginPage />;
  }

  // ─── 4) BUILD CONTEXT & RENDER THE REST ───
  const appContextValue: AppContextType = {
    session,
    customers,
    setCustomers,
    addCustomer,
    updateCustomer,
    logInteraction,
    salesOrders,
    setSalesOrders,
    addSalesOrder,
    updateSalesOrder,
    invoices,
    setInvoices,
    addInvoice,
    updateInvoice,
    generateInvoiceForOrder,
    expenses,
    setExpenses,
    addExpense,
    updateExpense
  };

  const navItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: <ChartBarIcon className="w-5 h-5 mr-2" /> },
    { path: '/crm', label: 'CRM', icon: <UsersIcon className="w-5 h-5 mr-2" /> },
    { path: '/sales', label: 'Sales Log', icon: <ShoppingCartIcon className="w-5 h-5 mr-2" /> },
    { path: '/invoices', label: 'Invoices', icon: <DocumentTextIcon className="w-5 h-5 mr-2" /> },
    { path: '/expenses', label: 'Expenses', icon: <CreditCardIcon className="w-5 h-5 mr-2" /> }
  ];

  return (
    <AppContext.Provider value={appContextValue}>
      <div className="min-h-screen flex flex-col bg-light-gray">
        <header className="bg-primary text-white shadow-md">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <HomeIcon className="w-8 h-8 mr-3 text-accent" />
              <h1 className="text-2xl font-semibold">Coffee Export Manager</h1>
            </div>
            <nav className="flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out ${
                    location.pathname === item.path
                      ? 'bg-accent text-primary'
                      : 'text-gray-200 hover:bg-secondary hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-grow container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/crm" element={<CrmPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
          </Routes>
        </main>
        <footer className="bg-primary text-white text-center py-4">
          <p>&copy; {new Date().getFullYear()} Coffee Export Solutions. All rights reserved.</p>
          <p className="text-xs text-gray-400 mt-1">
            Data is stored in-memory and will be lost on page refresh (Demo purposes).
          </p>
        </footer>
      </div>
    </AppContext.Provider>
  );
};

export default App;
