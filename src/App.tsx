import React, { useState, useCallback, createContext, useContext, useEffect } from 'react';
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

// Constants for magic numbers
const INVOICE_DUE_DAYS_DEFAULT = 30;
const INVOICE_NUMBER_PADDING = 3;


export const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// helper: DB row → camelCase SalesOrder
const rowToSalesOrder = (row: any): SalesOrder => ({
  id: row.order_id,
  customerId: row.customer_id,
  product: row.product,
  grade: row.grade,
  quantityKg: row.quantity,
  unitPrice: row.unit_price,
  totalAmount: row.total_amount,
  orderDate: row.order_date,
  shippingStatus: row.shipping_status as ShippingStatus,
  linkedInvoiceId: row.linked_invoice_id,
  documents: row.documents,
});

// helper: DB row → camelCase Invoice
const rowToInvoice = (row: any): Invoice => ({
  // ** FIX: Use row.order_id for Invoice.id as per DB schema PK **
  id: row.order_id,
  orderId: row.order_id, // Assuming invoices.order_id is both PK and FK to sales_orders.order_id
  invoiceNumber: row.invoice_number,
  dateIssued: row.date_issued,
  dueDate: row.due_date,
  amountDue: row.amount_due,
  amountPaid: row.amount_paid,
  status: row.status as InvoiceStatus,
  paymentMethod: row.payment_method as PaymentMethod,
  datePaid: row.date_paid || null,
});

// helper: DB row → camelCase Customer
const rowToCustomer = (row: any): Customer => ({
  id: row.customer_id,
  companyName: row.company_name,
  contactPerson: row.contact_person,
  country: row.country,
  email: row.email,
  phone: row.phone,
  preferredOrigin: row.preferred_origin,
  status: row.status,
  assignedSalesRep: row.assigned_sales_rep,
  nextFollowUpDate: row.next_follow_up_date,
  notes: row.notes,
  certificationsRequired: row.certifications_required
    ? row.certifications_required.split(',').map((s: string) => s.trim())
    : [],
  interactions: [], // Note: Interactions are fetched separately or not in this view
});

// helper: DB row → camelCase Expense
const rowToExpense = (row: any): Expense => ({
  id: row.id,
  expenseType: row.expense_type as ExpenseType,
  date: row.date,
  amount: row.amount,
  paidTo: row.paid_to,
  relatedOrderId: row.related_order_id,
  isApproved: row.is_approved,
  description: row.description,
});


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  // Initialize state with empty arrays consistent with fetching from DB
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  // --- Important Security Note: Row Level Security (RLS) is CRITICAL ---
  // Ensure RLS is enabled and configured on ALL Supabase tables (customers,
  // sales_orders, invoices, expenses, customer_interactions) to restrict data
  // access based on user authentication. Without RLS, any authenticated user
  // could potentially access/modify ALL data using the client-side key.

  // --- Performance Note: Initial data fetching ---
  // Fetching all records from these tables on mount (`.select('*')`) is simple
  // but will become a performance bottleneck for large datasets. Consider implementing
  // pagination, infinite scrolling, or server-side filtering for larger applications.

  // Fetch customers once on mount
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('❌ fetch customers:', error.message);
        // TODO: Provide user feedback (e.g., toast notification)
        return;
      }
      setCustomers(data.map(rowToCustomer));
    };
    load();
  }, []);

  // Fetch sales orders once on mount
  useEffect(() => {
    const loadOrders = async () => {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (error) {
        console.error('❌ fetch orders:', error.message);
        // TODO: Provide user feedback (e.g., toast notification)
        return;
      }
      setSalesOrders(data.map(rowToSalesOrder));
    };

    loadOrders();
  }, []);

  // Fetch invoices once on mount
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        let { data: invoicesData, error } = await supabase
          .from('invoices')
          .select('*');

        if (error) {
          console.error('Error fetching invoices:', error);
          // TODO: Provide user feedback (e.g., toast notification)
        } else {
          // ** FIX: rowToInvoice now correctly maps DB order_id to Invoice.id **
          setInvoices(invoicesData.map(rowToInvoice));
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        // TODO: Provide user feedback (e.g., toast notification)
      }
    };

    fetchInvoices();
  }, []);

  // Fetch expenses once on mount
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        let { data: expensesData, error } = await supabase
          .from('expenses')
          .select('*');

        if (error) {
          console.error('Error fetching expenses:', error);
          // TODO: Provide user feedback (e.g., toast notification)
        } else {
          setExpenses(expensesData.map(rowToExpense));
        }
      } catch (error) {
        console.error('Error fetching expenses:', error);
        // TODO: Provide user feedback (e.g., toast notification)
      }
    };

    fetchExpenses();
  }, []);

  // Auth state handling
  useEffect(() => {
    const getSession = async () => {
      setLoadingAuth(true);
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
      // TODO: Provide user feedback (e.g., toast notification)
    } else {
      setSession(null); // Explicitly set session to null
      // onAuthStateChange will also fire, ensuring navigation
    }
  };

  // Customer Actions
  const addCustomer = useCallback(
    async (c: Omit<Customer, 'id' | 'interactions'>) => {
      /* 1️⃣ camelCase → snake_case for DB */
      const dbRow = {
        company_name: c.companyName,
        contact_person: c.contactPerson,
        country: c.country,
        email: c.email,
        phone: c.phone,
        preferred_origin: c.preferredOrigin,
        status: c.status,
        assigned_sales_rep: c.assignedSalesRep,
        next_follow_up_date: c.nextFollowUpDate || null,
        notes: c.notes,
        certifications_required: (c.certificationsRequired ?? []).join(', ')
      };

      /* 2️⃣ insert into Supabase */
      const { data, error } = await supabase
        .from('customers')
        .insert(dbRow)
        .select('*')
        .single();

      if (error || !data) {
        console.error('❌ insert customer:', error?.message);
        // TODO: Provide user feedback (e.g., toast notification)
        return;
      }

      /* 3️⃣ snake_case → camelCase back into React state */
      const newCustomer = rowToCustomer(data);
      setCustomers(prev => [...prev, newCustomer]);
    },
    []
  );

  const updateCustomer = useCallback(async (updatedCustomer: Customer) => {
    // 1️⃣ Build the snake_case row for Supabase
    const dbRow = {
      company_name: updatedCustomer.companyName,
      contact_person: updatedCustomer.contactPerson,
      country: updatedCustomer.country,
      email: updatedCustomer.email,
      phone: updatedCustomer.phone,
      preferred_origin: updatedCustomer.preferredOrigin,
      status: updatedCustomer.status,
      assigned_sales_rep: updatedCustomer.assignedSalesRep,
      next_follow_up_date: updatedCustomer.nextFollowUpDate || null,
      notes: updatedCustomer.notes,
      certifications_required: (updatedCustomer.certificationsRequired ?? []).join(', ')
    };

    // 2️⃣ Send the update to Supabase
    const { data, error } = await supabase
      .from('customers')
      .update(dbRow)
      .eq('customer_id', updatedCustomer.id)
      .select('*')
      .single();

    if (error || !data) {
      console.error('❌ update customer:', error?.message);
      // TODO: Provide user feedback (e.g., toast notification)
      return;
    }

    // 3️⃣ Sync local state with what came back
    setCustomers(prev =>
      prev.map(c =>
        c.id === updatedCustomer.id ? rowToCustomer(data) : c
      )
    );
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('customer_id', id);

    if (error) {
      console.error('❌ delete customer:', error.message);
      // TODO: Provide user feedback (e.g., toast notification)
      return;
    }

    setCustomers(prev => prev.filter(c => c.id !== id));
  }, []);

  // Interaction Logging (Persistent - requires 'customer_interactions' table)
  const logInteraction = useCallback(
    async (customerId: string, interactionData: Omit<Interaction, 'id'>) => {
      // Insert into a hypothetical 'customer_interactions' table
      const dbRow = {
        customer_id: customerId,
        date: interactionData.date,
        type: interactionData.type,
        notes: interactionData.notes,
        // Assuming created_at timestamp is handled by DB
      };

      const { data, error } = await supabase
        .from('customer_interactions') // Assuming this table exists
        .insert(dbRow)
        .select('*') // Select the inserted row back if needed
        .single(); // Assuming single insertion

      if (error || !data) {
        console.error('❌ log interaction:', error?.message);
        // TODO: Provide user feedback (e.g., toast notification)
        return;
      }

      console.log("Interaction logged successfully:", data);
      // Note: This currently only logs to DB.
      // To show in UI, you'd need to fetch interactions when viewing a customer,
      // likely in the CRM component or a detail view, not here in App.tsx's main state.
    },
    []
  );


  // Sales Order Actions
  const addSalesOrder = useCallback(
    async (o: Omit<SalesOrder, 'id' | 'totalAmount' | 'documents' | 'linkedInvoiceId'>) => {
      // 2. build snake_case row for Supabase
      const dbRow = {
        customer_id: o.customerId,
        product: o.product,
        grade: o.grade,
        quantity: o.quantityKg,
        unit_price: o.unitPrice,
        total_amount: o.quantityKg * o.unitPrice, // Calculate totalAmount here
        order_date: o.orderDate,
        shipping_status: o.shippingStatus,
      };

      // 3. send to Supabase & await the real record
      const { data, error } = await supabase
        .from('sales_orders')
        .insert(dbRow)
        .select('*')
        .single();

      if (error || !data) {
        console.error('❌ insert order:', error?.message);
        // TODO: Provide user feedback (e.g., toast notification)
        return;
      }

      // 4. add the real DB row to local state
      setSalesOrders(prev => [...prev, rowToSalesOrder(data)]);

      return data.order_id; // Return the generated order ID
    },
    []
  );

  const updateSalesOrder = useCallback(
    async (updatedOrder: SalesOrder) => { // Typed parameter
      try {
        const { id: order_id } = updatedOrder; // Destructure id, which maps to DB order_id

        // build payload (snake_case)
        const dbRow = {
          customer_id: updatedOrder.customerId, // Include customer_id in update payload
          product: updatedOrder.product,
          grade: updatedOrder.grade,
          quantity: updatedOrder.quantityKg,
          unit_price: updatedOrder.unitPrice,
          total_amount: updatedOrder.quantityKg * updatedOrder.unitPrice, // Recalculate total
          order_date: updatedOrder.orderDate,
          shipping_status: updatedOrder.shippingStatus,
          linked_invoice_id: updatedOrder.linkedInvoiceId, // Include linked invoice ID
        };

        // patch & grab back the full row
        const { data, error } = await supabase
          .from('sales_orders')
          .update(dbRow)
          .eq('order_id', order_id) // Filter using DB column name
          .select('*')
          .single();

        if (error || !data) {
          console.error('❌ update order:', error?.message);
          // TODO: Provide user feedback (e.g., toast notification)
          return;
        }

        // sync local state
        setSalesOrders(prev =>
          prev.map(x =>
            x.id === data.order_id ? rowToSalesOrder(data) : x
          )
        );
      } catch (err) {
        console.error("Unexpected error updating sales order:", err);
        // TODO: Provide user feedback (e.g., toast notification)
      }
    },
    [] // updateSalesOrder doesn't depend on any state/props from App
  );


    const deleteInvoice = useCallback(async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        // ** FIX: Filter by the DB PK column name 'order_id' **
        .eq('order_id', invoiceId);

      if (error) {
        console.error('❌ delete invoice:', error.message);
        // TODO: Provide user feedback (e.g., toast notification)
        return;
      }

      // Update local state by filtering out the deleted invoice
      // ** FIX: Filter by the Invoice.id (which maps to DB order_id) **
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      console.log(`Invoice ${invoiceId} deleted successfully.`);

      // Optional: Update the linked sales order to remove the linkedInvoiceId
      // This requires finding the sales order linked to this invoice ID
      // ** FIX: Find sales order where linkedInvoiceId matches the invoiceId (which is the invoice's PK / order_id)**
      const linkedOrder = salesOrders.find(order => order.linkedInvoiceId === invoiceId);
      if (linkedOrder) {
          // setSalesOrders needs to be updated to reflect the change
          // This approach directly updates state based on the linked order found in the *current* salesOrders state
          setSalesOrders(prev => prev.map(o => o.id === linkedOrder.id ? { ...o, linkedInvoiceId: null } : o));
      }
    }, [salesOrders, setSalesOrders]); // Dependency on salesOrders is needed to find the linked order


  const deleteSalesOrder = useCallback(async (orderId: string) => {
    // Optional: Check if there's a linked invoice and handle it (e.g., prevent deletion, delete invoice first)
    // For simplicity here, we just delete the order. If RLS and FK constraints are set up
    // correctly in Supabase, attempting to delete an order with a linked invoice might fail
    // depending on the constraint configuration (e.g., RESTRICT, CASCADE).
    // A CASCADE delete on the FK in the 'invoices' table would automatically delete the linked invoice.

    const { error } = await supabase
      .from('sales_orders')
      .delete()
      .eq('order_id', orderId); // Use the DB column name

    if (error) {
      console.error('❌ delete sales order:', error.message);
      // TODO: Provide user feedback (e.g., toast notification)
      return;
    }

    // Update local state by filtering out the deleted order
    setSalesOrders(prev => prev.filter(order => order.id !== orderId));
    console.log(`Sales order ${orderId} deleted successfully.`);

    // Optional: If the invoice linked to this order should also be deleted,
    // and you don't rely on CASCADE delete FK constraints in the DB, you could
    // manually find and delete the linked invoice here.
    const linkedInvoice = invoices.find(inv => inv.orderId === orderId); // find by FK (orderId)
    if (linkedInvoice) {
       // The `deleteInvoice` function relies on `salesOrders` state (which is updated
       // outside this block anyway) and the `setSalesOrders` setter (which is stable),
       // so calling it here is safe even if it wasn't a dependency of THIS useCallback.
       // await deleteInvoice(linkedInvoice.id); // delete by PK (id, which maps to invoice.order_id)
    }

  }, [salesOrders, invoices]); // salesOrders is needed to find the linked order. invoices is needed IF you uncomment the manual deleteInvoice call.


  // Invoice Actions
  const addInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    // Map camelCase to snake_case
    const dbRow = {
      order_id: invoiceData.orderId, // Based on schema, this might be the Invoice PK
      customer_id: invoiceData.customerId,
      date_issued: invoiceData.dateIssued,
      due_date: invoiceData.dueDate,
      amount_due: invoiceData.amountDue,
      amount_paid: invoiceData.amountPaid,
      status: invoiceData.status,
      payment_method: invoiceData.paymentMethod,
      date_paid: invoiceData.datePaid || null,
    };

    // Client-side Invoice Number Generation (Acknowledging potential race conditions)
    // Ideally, this should be handled server-side for uniqueness guarantee
    // This calculation is based on local state size, which is unreliable.
    // Better to fetch the max number from DB or rely on a DB sequence/function.
    // Keeping for now as it was in the original code, but noting the risk.
    const newInvoiceNumber = `INV-${new Date().getFullYear()}-${(invoices.length + 1).toString().padStart(INVOICE_NUMBER_PADDING, '0')}`;

    const { data, error } = await supabase
      .from('invoices')
      // ** NOTE: Schema says order_id is PK. Inserting without an explicitly set order_id will
      // likely rely on a DB default or generator for that column if configured.
      // If order_id is meant to link to sales_orders AND be the PK, the value should come
      // from the related SalesOrder.id (order.id) during generation.
      // Assuming for 'addInvoice' that order_id is being provided in invoiceData.orderId
      // and the DB will handle its PK constraint/generation if needed.
      .insert([{ ...dbRow, invoice_number: newInvoiceNumber }])
      .select('*')
      .single(); // Expecting a single row back

    if (error || !data) {
      console.error('❌ add invoice:', error?.message);
      // TODO: Provide user feedback (e.g., toast notification)
      return;
    }

    // Use rowToInvoice for consistency before updating state
    // ** FIX: rowToInvoice now maps DB order_id to Invoice.id **
    setInvoices(prev => [...prev, rowToInvoice(data)]);
  }, [invoices.length]); // Dependency on invoices.length is for client-side number generation

  const updateInvoice = useCallback(async (updatedInvoice: Invoice) => {
    // Map camelCase to snake_case for update payload
    const dbRow = {
      // ** NOTE: Do not update the PK (order_id) here as per standard practice **
      // order_id: updatedInvoice.orderId, // Remove or keep depending on if orderId can truly change
      customer_id: updatedInvoice.customerId,
      invoice_number: updatedInvoice.invoiceNumber, // Assuming number can be updated? (Unlikely)
      date_issued: updatedInvoice.dateIssued,
      due_date: updatedInvoice.dueDate,
      amount_due: updatedInvoice.amountDue,
      amount_paid: updatedInvoice.amountPaid,
      status: updatedInvoice.status,
      payment_method: updatedInvoice.paymentMethod,
      date_paid: updatedInvoice.datePaid || null,
    };

    const { data, error } = await supabase
      .from('invoices')
      .update(dbRow)
      // ** FIX: Filter by the DB PK column name 'order_id', using the Invoice object's 'id' property **
      .eq('order_id', updatedInvoice.id)
      .select('*')
      .single();

    if (error || !data) {
      console.error('❌ update invoice:', error?.message);
      // TODO: Provide user feedback (e.g., toast notification)
      return;
    }

    // Sync local state with what came back, using rowToInvoice
    // ** FIX: rowToInvoice now maps DB order_id to Invoice.id **
    setInvoices(prev =>
      prev.map(i =>
        // ** FIX: Use Invoice.id (which maps to DB order_id) for comparison **
        i.id === updatedInvoice.id ? rowToInvoice(data) : i
      )
    );
  }, []);


  const generateInvoiceForOrder = useCallback(async (order: SalesOrder) => {
    // Check if an invoice already exists for this order by querying Supabase
    // ** NOTE: Based on the schema where invoice.order_id is PK AND FK to sales_orders.order_id **
    // The check should be whether an invoice exists with its PK (order_id) equal to the Sales Order's PK (order.id).
    const { data: existingInvoice, error: checkError } = await supabase
      .from('invoices')
      .select('order_id') // Selecting the PK column
      .eq('order_id', order.id) // Checking if an invoice exists where its PK equals the Sales Order's PK
      .maybeSingle();

    if (checkError) {
        console.error('Error checking for existing invoice:', checkError);
        // TODO: Provide user feedback (e.g., toast notification)
        return;
    }

    if (existingInvoice) {
        console.warn("Invoice already exists for this order:", existingInvoice.order_id);
        // TODO: Provide user feedback (e.g., toast notification)
        return;
    }

    // Client-side Invoice Number Generation (Acknowledging potential race conditions)
    // See note in addInvoice about this being unreliable client-side.
    const newInvoiceNumber = `INV-${new Date().getFullYear()}-${(invoices.length + 1).toString().padStart(INVOICE_NUMBER_PADDING, '0')}`;

    const dueDate = new Date(order.orderDate);
    dueDate.setDate(dueDate.getDate() + INVOICE_DUE_DAYS_DEFAULT); // Due in X days

    const invoiceDetails = {
      // ** FIX: Use the Sales Order's PK (order.id) as the Invoice's PK (order_id) **
      order_id: order.id,
      customer_id: order.customerId,
      invoice_number: newInvoiceNumber,
      date_issued: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      amount_due: order.totalAmount,
      amount_paid: 0, // Assume initial payment is 0
      status: InvoiceStatus.UNPAID,
      payment_method: '', // Default value
      date_paid: null,
    };

    const { data, error } = await supabase
      .from('invoices')
      .insert([invoiceDetails])
      .select('*')
      .single(); // Expecting the single inserted row

    if (error || !data) {
      console.error('Error creating invoice:', error?.message);
      // TODO: Provide user feedback (e.g., toast notification)
      return;
    }

    // Update local state using rowToInvoice
    // ** FIX: rowToInvoice now maps DB order_id to Invoice.id **
    const newInvoice = rowToInvoice(data);
    setInvoices(prev => [...prev, newInvoice]);

    // Update the linked sales order with the new invoice ID
    // ** FIX: The newInvoice.id now correctly holds the invoice's PK (DB order_id) **
    setSalesOrders(prev => prev.map(o => o.id === order.id ? { ...o, linkedInvoiceId: newInvoice.id } : o));

    console.log("Invoice generated and linked:", newInvoice);

  }, [invoices.length, salesOrders]); // Dependencies needed: invoices.length (for number), salesOrders (to update state)


  // Expense Actions
  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id'>) => {
    // Map camelCase to snake_case
    const dbRow = {
      expense_type: expenseData.expenseType,
      date: expenseData.date,
      amount: expenseData.amount,
      paid_to: expenseData.paidTo,
      related_order_id: expenseData.relatedOrderId,
      is_approved: expenseData.isApproved,
      description: expenseData.description,
    };

    const { data, error } = await supabase.from('expenses').insert(dbRow).select('*').single();
    if (error || !data) {
      console.error('❌ create expense:', error?.message);
      // TODO: Provide user feedback (e.g., toast notification)
      return;
    }
    setExpenses(prev => [...prev, rowToExpense(data)]);
  }, []);

  const updateExpense = useCallback(async (updatedExpense: Expense) => {
    // Map camelCase to snake_case
    const dbRow = {
      expense_type: updatedExpense.expenseType,
      date: updatedExpense.date,
      amount: updatedExpense.amount,
      paid_to: updatedExpense.paidTo,
      related_order_id: updatedExpense.relatedOrderId,
      is_approved: updatedExpense.isApproved,
      description: updatedExpense.description,
    };

    const { data, error } = await supabase
      .from('expenses')
      .update(dbRow)
      .eq('id', updatedExpense.id)
      .select('*')
      .single();

    if (error || !data) {
      console.error('❌ update expense:', error?.message);
      // TODO: Provide user feedback (e.g., toast notification)
      return;
    }

    setExpenses(prev =>
      prev.map(e =>
        e.id === updatedExpense.id ? rowToExpense(data) : e
      )
    );
  }, []);

  const appContextValue: AppContextType = {
    session,
    logout: handleLogout,
    customers, setCustomers, addCustomer, updateCustomer, deleteCustomer, logInteraction,
    salesOrders, setSalesOrders, addSalesOrder, updateSalesOrder, deleteSalesOrder, // Added deleteSalesOrder
    invoices, setInvoices, addInvoice, updateInvoice, deleteInvoice, generateInvoiceForOrder,
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
        {/* Add spinner */}
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
                <HomeIcon className="w-8 h-8 mr-3 text-accent" />
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
              <Route path="/sales" element={<SalesPage /* Removed createInvoice prop, use context */ />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
            </Routes>
          </main>
          <footer className="bg-primary text-white text-center py-4">
            <p>&copy; {new Date().getFullYear()} Coffee Export Solutions. All rights reserved.</p>
            <p className="text-xs text-gray-400 mt-1">Data is fetched from/persists to Supabase.</p>
          </footer>
        </div>
      )}
    </AppContext.Provider>
  );
};

export default App;