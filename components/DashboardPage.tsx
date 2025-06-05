
import React from 'react';
import { useAppContext } from '../App';
import { InvoiceStatus, Expense, CustomerStatus } from '../types'; // Added CustomerStatus for active customer filter
import { ChartBarIcon, CreditCardIcon, DocumentTextIcon, UsersIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '../constants';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>; // Changed type here
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color = 'bg-primary' }) => (
  <div className={`${color} text-white p-6 rounded-xl shadow-lg flex items-center space-x-4 transform hover:scale-105 transition-transform duration-200`}>
    <div className="p-3 bg-white bg-opacity-20 rounded-full">
      {React.cloneElement(icon, { className: "w-8 h-8 text-white" })}
    </div>
    <div>
      <p className="text-sm uppercase tracking-wide">{title}</p>
      <p className="text-3xl font-bold">{typeof value === 'number' && !title.toLowerCase().includes("customer") && !title.toLowerCase().includes("active") ? `USD ${value.toFixed(2)}` : value}</p>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { salesOrders, invoices, expenses, customers, updateExpense } = useAppContext();

  const monthlyRevenue = salesOrders.reduce((acc, order) => {
    const invoice = invoices.find(inv => inv.orderId === order.id);
    if (invoice && (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.PARTIAL)) {
        return acc + invoice.amountPaid;
    }
    return acc;
  }, 0);

  const outstandingPayments = invoices
    .filter(inv => inv.status === InvoiceStatus.UNPAID || inv.status === InvoiceStatus.PARTIAL || inv.status === InvoiceStatus.OVERDUE)
    .reduce((acc, inv) => acc + (inv.amountDue - inv.amountPaid), 0);

  const totalExpensesThisMonth = expenses
    .filter(exp => new Date(exp.date).getMonth() === new Date().getMonth() && new Date(exp.date).getFullYear() === new Date().getFullYear() && exp.isApproved) // Only approved expenses
    .reduce((acc, exp) => acc + exp.amount, 0);
    
  const topPerformingCustomers = customers
    .map(customer => {
        const customerSales = salesOrders
            .filter(order => order.customerId === customer.id)
            .reduce((sum, order) => {
                const invoice = invoices.find(inv => inv.orderId === order.id && (inv.status === InvoiceStatus.PAID || inv.status === InvoiceStatus.PARTIAL));
                return sum + (invoice ? invoice.amountPaid : 0); // Sum based on paid/partial invoices
            }, 0);
        return { name: customer.companyName, totalSales: customerSales };
    })
    .filter(c => c.totalSales > 0)
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5);

  const today = new Date();
  const thirtyDaysFromDueDate = new Date();
  thirtyDaysFromDueDate.setDate(today.getDate() - 30); // An invoice is "older than 30 days past due" if its due date is before this date
  
  const overdueInvoicesAlerts = invoices.filter(
    inv => (inv.status === InvoiceStatus.UNPAID || inv.status === InvoiceStatus.PARTIAL || inv.status === InvoiceStatus.OVERDUE) && new Date(inv.dueDate) < thirtyDaysFromDueDate && new Date(inv.dueDate) < today
  );

  const highValueExpensesToApprove = expenses.filter(exp => !exp.isApproved && exp.amount > 500); 

  const profitPerShipment = salesOrders.map(order => {
    const relatedExpenses = expenses.filter(exp => exp.relatedOrderId === order.id && exp.isApproved).reduce((sum, exp) => sum + exp.amount, 0); // Only approved expenses
    const invoice = invoices.find(inv => inv.orderId === order.id && (inv.status === InvoiceStatus.PAID || inv.status === InvoiceStatus.PARTIAL));
    const revenueFromOrder = invoice ? invoice.amountPaid : 0; // Use actual paid amount for profit calculation
    const profit = revenueFromOrder - relatedExpenses;
    return { orderId: order.id, product: order.product, profit, totalRevenue: revenueFromOrder, totalExpenses: relatedExpenses };
  }).filter(item => item.totalRevenue > 0 || item.totalExpenses > 0);

  const handleToggleExpenseApproval = (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
      updateExpense({ ...expense, isApproved: !expense.isApproved });
    }
  };


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-primary flex items-center"><ChartBarIcon className="w-8 h-8 mr-2"/>Manager Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Monthly Revenue (Paid/Partial)" value={monthlyRevenue} icon={<DocumentTextIcon />} color="bg-green-500" />
        <MetricCard title="Outstanding Payments" value={outstandingPayments} icon={<CreditCardIcon />} color="bg-yellow-500" />
        <MetricCard title="Total Approved Expenses (This Month)" value={totalExpensesThisMonth} icon={<CreditCardIcon />} color="bg-red-500" />
        <MetricCard title="Active Customers" value={customers.filter(c=>c.status === CustomerStatus.ACTIVE || c.status === CustomerStatus.REPEAT).length} icon={<UsersIcon />} color="bg-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-primary mb-4">Profit Per Shipment (Based on Paid Invoices & Approved Expenses)</h2>
          {profitPerShipment.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {profitPerShipment.map(item => (
                <div key={item.orderId} className="p-3 bg-gray-50 rounded-md text-sm">
                  <p className="font-medium">{item.product} (Order: {item.orderId.substring(0,6)}...)</p>
                  <p>Revenue (Paid): <span className="text-green-600">USD {item.totalRevenue.toFixed(2)}</span></p>
                  <p>Approved Expenses: <span className="text-red-600">USD {item.totalExpenses.toFixed(2)}</span></p>
                  <p>Profit: <span className={`font-bold ${item.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>USD {item.profit.toFixed(2)}</span></p>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500">No shipment data with paid invoices to display profit.</p>}
        </div>

        <div className="bg-surface p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-primary mb-4">Top Performing Customers (by Paid Sales)</h2>
          {topPerformingCustomers.length > 0 ? (
          <ul className="space-y-2">
            {topPerformingCustomers.map(customer => (
              <li key={customer.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-md text-sm">
                <span className="font-medium text-secondary">{customer.name}</span>
                <span className="text-green-600 font-semibold">USD {customer.totalSales.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          ) : <p className="text-gray-500">No customer sales data (paid invoices) available.</p>}
        </div>
      </div>

      <div className="bg-surface p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-primary mb-4 flex items-center"><ExclamationTriangleIcon className="w-6 h-6 mr-2 text-red-500"/> Alerts & Approvals</h2>
        
        <div className="mb-6">
            <h3 className="text-lg font-medium text-yellow-600 mb-2">Unpaid Invoices (Older than 30 days past due)</h3>
            {overdueInvoicesAlerts.length > 0 ? (
                <ul className="space-y-2 text-sm">
                {overdueInvoicesAlerts.map(inv => (
                    <li key={inv.id} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
                    Invoice <span className="font-semibold">{inv.invoiceNumber}</span> for {customers.find(c=>c.id === inv.customerId)?.companyName} (USD {(inv.amountDue - inv.amountPaid).toFixed(2)}) due on {new Date(inv.dueDate).toLocaleDateString()}.
                    </li>
                ))}
                </ul>
            ) : <p className="text-gray-500 text-sm">No invoices older than 30 days past due.</p>}
        </div>

        <div>
            <h3 className="text-lg font-medium text-blue-600 mb-2">High-Value Expenses Awaiting Approval (>{'USD 500'})</h3>
            {highValueExpensesToApprove.length > 0 ? (
                <ul className="space-y-2 text-sm">
                {highValueExpensesToApprove.map(exp => (
                    <li key={exp.id} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md flex justify-between items-center">
                    <div>
                        Expense for <span className="font-semibold">{exp.paidTo}</span> (USD {exp.amount.toFixed(2)}) on {new Date(exp.date).toLocaleDateString()} - {exp.description}.
                    </div>
                    <button 
                        onClick={() => handleToggleExpenseApproval(exp.id)} 
                        className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 text-xs flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1"/> Approve
                    </button>
                    </li>
                ))}
                </ul>
            ) : <p className="text-gray-500 text-sm">No high-value expenses awaiting approval.</p>}
        </div>
         <div className="mt-6">
            <h3 className="text-lg font-medium text-green-600 mb-2">Recently Approved High-Value Expenses</h3>
             {expenses.filter(exp => exp.isApproved && exp.amount > 500).slice(-5).reverse().map(exp => ( // Show last 5 approved, newest first
                 <li key={exp.id} className="p-3 bg-green-50 border-l-4 border-green-400 rounded-md flex justify-between items-center text-sm">
                    <div>
                        Expense for <span className="font-semibold">{exp.paidTo}</span> (USD {exp.amount.toFixed(2)}) on {new Date(exp.date).toLocaleDateString()} - {exp.description}.
                    </div>
                    <span className="text-green-700 flex items-center"><CheckCircleIcon className="w-4 h-4 mr-1"/> Approved</span>
                 </li>
             ))}
             {expenses.filter(exp => exp.isApproved && exp.amount > 500).length === 0 && <p className="text-gray-500 text-sm">No high-value expenses recently approved.</p>}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
