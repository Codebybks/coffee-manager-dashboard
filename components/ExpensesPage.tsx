
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAppContext } from '../App';
import { Expense, ExpenseType, SalesOrder } from '../types';
import Modal from './common/Modal';
import { EXPENSE_TYPE_OPTIONS, PlusCircleIcon, PencilIcon, EyeIcon, CreditCardIcon, CheckCircleIcon, XCircleIcon } from '../constants';

const initialExpenseFormState: Omit<Expense, 'id'> = {
  expenseType: ExpenseType.LOGISTICS,
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  paidTo: '',
  relatedOrderId: undefined,
  receiptUrl: undefined,
  isApproved: false,
  description: '',
};

const ExpenseForm: React.FC<{ 
    expense?: Expense; 
    salesOrders: SalesOrder[];
    onSave: (expense: Expense | Omit<Expense, 'id'>) => void; 
    onClose: () => void 
}> = ({ expense, salesOrders, onSave, onClose }) => {
  const [formData, setFormData] = useState<Omit<Expense, 'id'>>(() => 
    expense ? { ...expense } : initialExpenseFormState
  );

  useEffect(() => {
    if (expense) {
      setFormData({ ...expense });
    } else {
      setFormData(initialExpenseFormState);
    }
  }, [expense]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        const numValue = name === 'amount' ? parseFloat(value) : value;
        setFormData(prev => ({ ...prev, [name]: numValue }));
    }
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="expenseType" className="block text-sm font-medium text-gray-700">Expense Type</label>
            <select name="expenseType" id="expenseType" value={formData.expenseType} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2">
                {EXPENSE_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
            <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (USD)</label>
            <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
        </div>
        <div>
            <label htmlFor="paidTo" className="block text-sm font-medium text-gray-700">Paid To</label>
            <input type="text" name="paidTo" id="paidTo" value={formData.paidTo} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
        </div>
      </div>
      <div>
        <label htmlFor="relatedOrderId" className="block text-sm font-medium text-gray-700">Related Order (Optional)</label>
        <select name="relatedOrderId" id="relatedOrderId" value={formData.relatedOrderId || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2">
            <option value="">None</option>
            {salesOrders.map(o => <option key={o.id} value={o.id}>{o.id.substring(0,8)}... ({o.product})</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"></textarea>
      </div>
      <div>
        <label htmlFor="receiptUrl" className="block text-sm font-medium text-gray-700">Upload Receipt (mock)</label>
        <input type="file" name="receiptUrl" id="receiptUrl" onChange={() => alert('File upload is a demo feature. Path will not be stored.')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-primary hover:file:bg-secondary"/>
      </div>
      <div className="flex items-center">
        <input type="checkbox" name="isApproved" id="isApproved" checked={formData.isApproved} onChange={handleChange} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-accent"/>
        <label htmlFor="isApproved" className="ml-2 block text-sm text-gray-900">Mark as Approved</label>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary">Save Expense</button>
      </div>
    </form>
  );
};

const ExpensesPage: React.FC = () => {
  const { expenses, addExpense, updateExpense, salesOrders } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>(undefined);

  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>(''); // YYYY-MM for month, YYYY for year
  const [filterOrder, setFilterOrder] = useState<string>('');

  const handleAddNewExpense = () => {
    setSelectedExpense(undefined);
    setIsModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const handleViewExpenseDetails = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDetailModalOpen(true);
  };

  const handleSaveExpense = (expenseData: Expense | Omit<Expense, 'id'>) => {
    if ('id' in expenseData) {
      updateExpense(expenseData as Expense);
    } else {
      addExpense(expenseData as Omit<Expense, 'id'>);
    }
    setIsModalOpen(false);
  };

  const toggleApproval = (expense: Expense) => {
    updateExpense({ ...expense, isApproved: !expense.isApproved });
  };

  const filteredExpenses = expenses.filter(expense => {
    const categoryMatch = filterCategory ? expense.expenseType === filterCategory : true;
    const dateMatch = filterDate ? expense.date.startsWith(filterDate) : true; // Simple prefix match for YYYY or YYYY-MM
    const orderMatch = filterOrder ? expense.relatedOrderId === filterOrder : true;
    return categoryMatch && dateMatch && orderMatch;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by most recent first

  const monthlySummary = filteredExpenses.reduce((acc, curr) => {
    const monthYear = curr.date.substring(0, 7); // YYYY-MM
    acc[monthYear] = (acc[monthYear] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const yearlySummary = filteredExpenses.reduce((acc, curr) => {
    const year = curr.date.substring(0, 4); // YYYY
    acc[year] = (acc[year] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-primary flex items-center"><CreditCardIcon className="w-8 h-8 mr-2"/>Expenses Management</h1>
        <button onClick={handleAddNewExpense} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary flex items-center">
          <PlusCircleIcon className="w-5 h-5 mr-2" /> Log New Expense
        </button>
      </div>

       <div className="p-4 bg-surface rounded-md shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="filterCategory" className="block text-sm font-medium text-gray-700">Filter by Category</label>
            <select id="filterCategory" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
              <option value="">All Categories</option>
              {EXPENSE_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filterDate" className="block text-sm font-medium text-gray-700">Filter by Date (YYYY or YYYY-MM)</label>
            <input type="text" id="filterDate" placeholder="e.g. 2024 or 2024-07" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="filterOrder" className="block text-sm font-medium text-gray-700">Filter by Related Order</label>
            <select id="filterOrder" value={filterOrder} onChange={e => setFilterOrder(e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
              <option value="">All Orders</option>
              {salesOrders.map(o => <option key={o.id} value={o.id}>{o.id.substring(0,8)}... ({o.product})</option>)}
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-surface p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-primary mb-2">Monthly Summary</h3>
            {Object.keys(monthlySummary).length > 0 ? (
                <ul className="text-sm space-y-1">
                    {Object.entries(monthlySummary).map(([month, total]) => (
                        <li key={month} className="flex justify-between"><span>{month}:</span> <span className="font-medium">USD {total.toFixed(2)}</span></li>
                    ))}
                </ul>
            ) : <p className="text-sm text-gray-500">No expenses for summary.</p>}
        </div>
        <div className="bg-surface p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-primary mb-2">Yearly Summary</h3>
            {Object.keys(yearlySummary).length > 0 ? (
                <ul className="text-sm space-y-1">
                    {Object.entries(yearlySummary).map(([year, total]) => (
                        <li key={year} className="flex justify-between"><span>{year}:</span> <span className="font-medium">USD {total.toFixed(2)}</span></li>
                    ))}
                </ul>
            ) : <p className="text-sm text-gray-500">No expenses for summary.</p>}
        </div>
      </div>

      {filteredExpenses.length === 0 && <p className="text-center text-gray-500">No expenses found.</p>}

      <div className="bg-surface shadow overflow-x-auto rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredExpenses.map(expense => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(expense.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.expenseType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">USD {expense.amount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.paidTo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button onClick={() => toggleApproval(expense)} className={`p-1 rounded-full ${expense.isApproved ? 'text-success' : 'text-error'}`}>
                    {expense.isApproved ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => handleViewExpenseDetails(expense)} className="text-accent hover:text-primary"><EyeIcon className="w-5 h-5 inline"/></button>
                  <button onClick={() => handleEditExpense(expense)} className="text-secondary hover:text-primary"><PencilIcon className="w-5 h-5 inline"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedExpense ? 'Edit Expense' : 'Log New Expense'} size="lg">
        <ExpenseForm expense={selectedExpense} salesOrders={salesOrders} onSave={handleSaveExpense} onClose={() => setIsModalOpen(false)} />
      </Modal>

      {selectedExpense && (
        <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Expense Details" size="md">
          <div className="space-y-3">
            <p><strong>Date:</strong> {new Date(selectedExpense.date).toLocaleDateString()}</p>
            <p><strong>Type:</strong> {selectedExpense.expenseType}</p>
            <p><strong>Amount:</strong> USD {selectedExpense.amount.toFixed(2)}</p>
            <p><strong>Paid To:</strong> {selectedExpense.paidTo}</p>
            <p><strong>Description:</strong> {selectedExpense.description || 'N/A'}</p>
            <p><strong>Related Order ID:</strong> {selectedExpense.relatedOrderId || 'N/A'}</p>
            <p><strong>Approved:</strong> {selectedExpense.isApproved ? <CheckCircleIcon className="w-5 h-5 inline text-success"/> : <XCircleIcon className="w-5 h-5 inline text-error"/>}</p>
            {selectedExpense.receiptUrl && <p><strong>Receipt:</strong> <a href={selectedExpense.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">View Receipt (mock)</a></p>}
            {!selectedExpense.isApproved && selectedExpense.amount > 1000 && ( // Example high-value
                <div className="pt-4 border-t mt-4">
                    <button 
                        onClick={() => {
                            toggleApproval(selectedExpense);
                            // Optimistically update this view
                            setSelectedExpense(prev => prev ? {...prev, isApproved: !prev.isApproved} : undefined);
                        }} 
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center">
                        <CheckCircleIcon className="w-5 h-5 mr-2"/> Approve Expense
                    </button>
                </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExpensesPage;