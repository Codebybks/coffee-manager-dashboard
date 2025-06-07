import React,  { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Customer, SalesOrder, Invoice, Expense, NavItem, Interaction, AppContextType, CoffeeOrigin, CustomerStatus, ShippingStatus, InvoiceStatus, ExpenseType, Certification, PaymentMethod } from './types';
import CrmPage from './components/CrmPage';
import SalesPage from './components/SalesPage';
import InvoicesPage from './components/InvoicesPage';
import ExpensesPage from './components/ExpensesPage';
import DashboardPage from './components/DashboardPage';
import LoginPage from '../components/LoginPage'; // Import LoginPage
import { HomeIcon, UsersIcon, ShoppingCartIcon, DocumentTextIcon, CreditCardIcon, ChartBarIcon } from './constants';
import { supabase, Session } from '../supabaseClient'; // Import supabase and Session

const initialCustomers: Customer[] = [
  { id: 'cust_1', companyName: 'Beans & Brews', contactPerson: 'Alice Smith', country: 'USA', email: 'alice@bnb.com', phone: '555-1234', preferredOrigin: CoffeeOrigin.YIRGACHEFFE, certificationsRequired: [Certification.ORGANIC, Certification.FAIR_TRADE], status: CustomerStatus.ACTIVE, assignedSalesRep: 'John Doe', notes: 'Loves bright, acidic coffees.', nextFollowUpDate: '2024-08-15', interactions: [{id: 'int_1', date: '2024-07-10', type: 'Call', notes: 'Discussed new Yirgacheffe crop.'}] },
  { id: 'cust_2', companyName: 'Global Coffee Importers', contactPerson: 'Bob Johnson', country: 'Germany', email: 'bob@gci.de', phone: '555-5678', preferredOrigin: CoffeeOrigin.SIDAMA, certificationsRequired: [], status: CustomerStatus.LEAD, assignedSalesRep: 'Jane Roe', notes: 'Interested in bulk Sidama, price sensitive.', interactions: [] },
];

const initialSalesOrders: SalesOrder[] = [
  { id: 'ord_1', customerId: 'cust_1', product: 'Yirgacheffe G1 Washed', grade: 'G1', quantityKg: 500, unitPrice: 8.5, totalAmount: 4250, shippingStatus: ShippingStatus.SHIPPED, orderDate: '2024-07-01', documents: [], linkedInvoiceId: 'inv_1' },
];

const initialInvoices: Invoice[] = [
  { id: 'inv_1', orderId: 'ord_1', customerId: 'cust_1', invoiceNumber: 'INV-2024-001', dateIssued: '2024-07-02', dueDate: '2024-08-01', amountDue: 4250, amountPaid: 2000, status: InvoiceStatus.PARTIAL, paymentMethod: PaymentMethod.WIRE, datePaid: '2024-07-15' },
];

const initialExpenses: Expense[] = [
  { id: 'exp_1', expenseType: ExpenseType.LOGISTICS, date: '2024-07-03', amount: 300, paidTo: 'Global Shipping Co.', relatedOrderId: 'ord_1', isApproved: true, description: 'Shipping for ORD_1' },
  { id: 'exp_2', expenseType: ExpenseType.FARMER_PAYMENT, date: '2024-06-20', amount: 2000, paidTo: 'Yirgacheffe Coop', isApproved: true, description: 'Payment for Yirgacheffe beans' },
];


export const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(initialSalesOrders);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const location = useLocation();
  const navigate = useNavigate();


  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setLoadingAuth(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) { // If user logs out or session expires, navigate to login
        navigate('/'); // Assuming '/' is the login page when not authenticated
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]);
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
      alert(`Error logging out: ${error.message}`);
    } else {
      setSession(null); // Explicitly set session to null
      // onAuthStateChange will also fire, ensuring navigation
    }
  };

  const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const addCustomer = useCallback((customerData: Omit<Customer, 'id' | 'interactions'>) => {
    setCustomers(prev => [...prev, { ...customerData, id: generateId('cust'), interactions: [] }]);
  }, []);

  const updateCustomer = useCallback((updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  }, []);
  
  const logInteraction = useCallback((customerId: string, interactionData: Omit<Interaction, 'id'>) => {
    setCustomers(prev => prev.map(c => 
      c.id === customerId 
        ? { ...c, interactions: [...c.interactions, { ...interactionData, id: generateId('int') }] } 
        : c
    ));
  }, []);

  const addSalesOrder = useCallback((orderData: Omit<SalesOrder, 'id' | 'totalAmount' | 'documents' | 'linkedInvoiceId'>): string => {
    const newOrder: SalesOrder = {
      ...orderData,
      id: generateId('ord'),
      totalAmount: orderData.quantityKg * orderData.unitPrice,
      documents: [],
    };
    setSalesOrders(prev => [...prev, newOrder]);
    return newOrder.id;
  }, []);
  
  const updateSalesOrder = useCallback((updatedOrder: SalesOrder) => {
    setSalesOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...updatedOrder, totalAmount: updatedOrder.quantityKg * updatedOrder.unitPrice } : o));
  }, []);

  const addInvoice = useCallback((invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const newInvoiceNumber = `INV-${new Date().getFullYear()}-${(invoices.length + 1).toString().padStart(3, '0')}`;
    setInvoices(prev => [...prev, { ...invoiceData, id: generateId('inv'), invoiceNumber: newInvoiceNumber }]);
  }, [invoices.length]);

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    setInvoices(prev => prev.map(i => i.id === updatedInvoice.id ? updatedInvoice : i));
  }, []);

  const generateInvoiceForOrder = useCallback((order: SalesOrder) => {
    if (order.linkedInvoiceId && invoices.find(inv => inv.id === order.linkedInvoiceId)) {
        alert("Invoice already exists for this order.");
        return;
    }
    const newInvoiceId = generateId('inv');
    const newInvoiceNumber = `INV-${new Date().getFullYear()}-${(invoices.length + 1).toString().padStart(3, '0')}`;
    const dueDate = new Date(order.orderDate);
    dueDate.setDate(dueDate.getDate() + 30); // Due in 30 days

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
    };
    setInvoices(prev => [...prev, newInvoice]);
    setSalesOrders(prev => prev.map(o => o.id === order.id ? { ...o, linkedInvoiceId: newInvoiceId } : o));
  }, [invoices]);


  const addExpense = useCallback((expenseData: Omit<Expense, 'id'>) => {
    setExpenses(prev => [...prev, { ...expenseData, id: generateId('exp') }]);
  }, []);

  const updateExpense = useCallback((updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  }, []);

  const appContextValue: AppContextType = {
    session, // Add session to context
    logout: handleLogout, // Add logout to context
    customers, setCustomers, addCustomer, updateCustomer, logInteraction,
    salesOrders, setSalesOrders, addSalesOrder, updateSalesOrder,
    invoices, setInvoices, addInvoice, updateInvoice, generateInvoiceForOrder,
    expenses, setExpenses, addExpense, updateExpense,
  };

  const navItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: <ChartBarIcon className="w-5 h-5 mr-2" /> },
    { path: '/crm', label: 'CRM', icon: <UsersIcon className="w-5 h-5 mr-2" /> },
    { path: '/sales', label: 'Sales Log', icon: <ShoppingCartIcon className="w-5 h-5 mr-2" /> },
    { path: '/invoices', label: 'Invoices', icon: <DocumentTextIcon className="w-5 h-5 mr-2" /> },
    { path: '/expenses', label: 'Expenses', icon: <CreditCardIcon className="w-5 h-5 mr-2" /> },
  ];
  
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-gray">
        <p className="text-xl text-primary">Loading application...</p>
        {/* You can add a spinner here */}
      </div>
    );
  }

  return (
    <AppContext.Provider value={appContextValue}>
      {!session ? (
        <LoginPage />
      ) : (
        <div className="min-h-screen flex flex-col bg-light-gray">
          <header className="bg-primary text-white shadow-md">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <div className="flex items-center">
                <HomeIcon className="w-8 h-8 mr-3 text-accent"/>
                <h1 className="text-2xl font-semibold">Coffee Export Manager</h1>
              </div>
              <div className="flex items-center space-x-4">
                <nav className="flex space-x-1">
                  {navItems.map(item => (
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
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-error hover:bg-red-700 text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="flex-grow container mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/crm" element={<CrmPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              {/* Add a catch-all or redirect if needed for unauthenticated access to specific paths,
                  though the top-level session check should handle most cases. */}
            </Routes>
          </main>
          <footer className="bg-primary text-white text-center py-4">
            <p>&copy; {new Date().getFullYear()} Coffee Export Solutions. All rights reserved.</p>
            <p className="text-xs text-gray-400 mt-1">Data is stored in-memory and will be lost on page refresh (Demo purposes).</p>
          </footer>
        </div>
      )}
    </AppContext.Provider>
  );
};

export default App;
