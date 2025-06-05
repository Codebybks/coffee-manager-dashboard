import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAppContext } from '../App';
import { Invoice, InvoiceStatus, PaymentMethod, Customer, SalesOrder } from '../types';
import Modal from './common/Modal';
import { INVOICE_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS, PlusCircleIcon, PencilIcon, EyeIcon, DocumentTextIcon } from '../constants';

const initialInvoiceFormState: Omit<Invoice, 'id' | 'invoiceNumber'> = {
  orderId: '',
  customerId: '',
  dateIssued: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default due in 30 days
  amountDue: 0,
  amountPaid: 0,
  paymentMethod: undefined,
  datePaid: undefined,
  status: InvoiceStatus.UNPAID,
};


const InvoiceForm: React.FC<{ 
    invoice?: Invoice;
    customers: Customer[];
    salesOrders: SalesOrder[];
    onSave: (invoice: Invoice | Omit<Invoice, 'id' | 'invoiceNumber'>) => void; 
    onClose: () => void 
}> = ({ invoice, customers, salesOrders, onSave, onClose }) => {
  const [formData, setFormData] = useState<Omit<Invoice, 'id' | 'invoiceNumber'>>(() => 
    invoice ? { ...invoice } : initialInvoiceFormState
  );

  useEffect(() => {
    if (invoice) {
      setFormData({ ...invoice });
    } else {
      setFormData(initialInvoiceFormState);
    }
  }, [invoice]);

  const handleOrderChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const orderId = e.target.value;
    const selectedOrder = salesOrders.find(o => o.id === orderId);
    if (selectedOrder) {
        setFormData(prev => ({
            ...prev,
            orderId: selectedOrder.id,
            customerId: selectedOrder.customerId,
            amountDue: selectedOrder.totalAmount,
        }));
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numValue = (name === 'amountDue' || name === 'amountPaid') ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: numValue }));

    if (name === 'amountPaid' && formData.amountDue > 0) {
        const paid = parseFloat(value);
        if (paid === 0) {
            setFormData(prev => ({ ...prev, status: InvoiceStatus.UNPAID }));
        } else if (paid < formData.amountDue) {
            setFormData(prev => ({ ...prev, status: InvoiceStatus.PARTIAL }));
        } else {
            setFormData(prev => ({ ...prev, status: InvoiceStatus.PAID }));
        }
    }
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.orderId === '' || formData.customerId === '') {
        alert('Please select an order and customer.');
        return;
    }
    onSave(formData);
  };

  const isEditing = !!invoice;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="orderId" className="block text-sm font-medium text-gray-700">Related Order</label>
        <select name="orderId" id="orderId" value={formData.orderId} onChange={handleOrderChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2" disabled={isEditing}>
          <option value="" disabled>Select Order</option>
          {salesOrders.filter(o => !o.linkedInvoiceId || (invoice && o.id === invoice.orderId)).map(o => <option key={o.id} value={o.id}>{o.id.substring(0,8)}... - {customers.find(c=>c.id === o.customerId)?.companyName}</option>)}
        </select>
        {isEditing && <p className="text-xs text-gray-500 mt-1">Order cannot be changed after invoice creation.</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Customer</label>
        <input type="text" value={customers.find(c => c.id === formData.customerId)?.companyName || 'N/A'} readOnly className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm p-2"/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="dateIssued" className="block text-sm font-medium text-gray-700">Date Issued</label>
            <input type="date" name="dateIssued" id="dateIssued" value={formData.dateIssued} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
        </div>
        <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
            <input type="date" name="dueDate" id="dueDate" value={formData.dueDate} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="amountDue" className="block text-sm font-medium text-gray-700">Amount Due (USD)</label>
            <input type="number" name="amountDue" id="amountDue" value={formData.amountDue} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm p-2" readOnly={isEditing}/>
        </div>
        <div>
            <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700">Amount Paid (USD)</label>
            <input type="number" name="amountPaid" id="amountPaid" value={formData.amountPaid} onChange={handleChange} min="0" step="0.01" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select name="paymentMethod" id="paymentMethod" value={formData.paymentMethod || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2">
                <option value="">Select Method</option>
                {PAYMENT_METHOD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="datePaid" className="block text-sm font-medium text-gray-700">Date Paid</label>
            <input type="date" name="datePaid" id="datePaid" value={formData.datePaid || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
        </div>
      </div>
       <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2">
                {INVOICE_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
      <div className="flex justify-end space-x-2 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary">Save Invoice</button>
      </div>
    </form>
  );
};

const InvoicesPage: React.FC = () => {
  const { invoices, addInvoice, updateInvoice, customers, salesOrders } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>(undefined);
  
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCustomer, setFilterCustomer] = useState<string>('');

  const handleAddNewInvoice = () => {
    setSelectedInvoice(undefined);
    setIsModalOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };
  
  const handleViewInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const handleSaveInvoice = (invoiceData: Invoice | Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    if ('id' in invoiceData) {
      updateInvoice(invoiceData as Invoice);
    } else {
      addInvoice(invoiceData as Omit<Invoice, 'id' | 'invoiceNumber'>);
    }
    setIsModalOpen(false);
  };

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.companyName || 'Unknown Customer';
  };

  const today = new Date().toISOString().split('T')[0];
  
  const filteredInvoices = invoices.map(inv => {
    // Auto-update status to Overdue if unpaid and past due date
    if ((inv.status === InvoiceStatus.UNPAID || inv.status === InvoiceStatus.PARTIAL) && inv.dueDate < today) {
      return {...inv, status: InvoiceStatus.OVERDUE};
    }
    return inv;
  }).filter(invoice => {
    const statusMatch = filterStatus ? invoice.status === filterStatus : true;
    const customerMatch = filterCustomer ? invoice.customerId === filterCustomer : true;
    return statusMatch && customerMatch;
  });

  const getStatusColor = (status: InvoiceStatus) => {
    switch(status) {
        case InvoiceStatus.PAID: return 'bg-green-100 text-green-800';
        case InvoiceStatus.PARTIAL: return 'bg-yellow-100 text-yellow-800';
        case InvoiceStatus.UNPAID: return 'bg-red-100 text-red-800';
        case InvoiceStatus.OVERDUE: return 'bg-pink-200 text-pink-800 font-bold';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-primary flex items-center"><DocumentTextIcon className="w-8 h-8 mr-2"/>Invoices & Payments</h1>
        <button onClick={handleAddNewInvoice} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary flex items-center">
          <PlusCircleIcon className="w-5 h-5 mr-2" /> Create New Invoice
        </button>
      </div>
      
      <div className="p-4 bg-surface rounded-md shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700">Filter by Status</label>
            <select id="filterStatus" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
              <option value="">All Statuses</option>
              {INVOICE_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filterCustomer" className="block text-sm font-medium text-gray-700">Filter by Customer</label>
            <select id="filterCustomer" value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>
        </div>
      </div>

      {filteredInvoices.length === 0 && <p className="text-center text-gray-500">No invoices found.</p>}

      <div className="bg-surface shadow overflow-x-auto rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.map(invoice => (
              <tr key={invoice.id} className={`hover:bg-gray-50 ${invoice.status === InvoiceStatus.UNPAID || invoice.status === InvoiceStatus.OVERDUE ? 'border-l-4 border-red-500' : invoice.status === InvoiceStatus.PARTIAL ? 'border-l-4 border-yellow-500' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCustomerName(invoice.customerId)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">USD {invoice.amountDue.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">USD {invoice.amountPaid.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                       {invoice.status}
                   </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => handleViewInvoiceDetails(invoice)} className="text-accent hover:text-primary"><EyeIcon className="w-5 h-5 inline"/></button>
                  <button onClick={() => handleEditInvoice(invoice)} className="text-secondary hover:text-primary"><PencilIcon className="w-5 h-5 inline"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedInvoice ? 'Edit Invoice' : 'Create New Invoice'} size="lg">
        <InvoiceForm invoice={selectedInvoice} customers={customers} salesOrders={salesOrders} onSave={handleSaveInvoice} onClose={() => setIsModalOpen(false)} />
      </Modal>

      {selectedInvoice && (
        <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Invoice Details" size="md">
          <div className="space-y-3">
            <p><strong>Invoice Number:</strong> {selectedInvoice.invoiceNumber}</p>
            <p><strong>Order ID:</strong> {selectedInvoice.orderId}</p>
            <p><strong>Customer:</strong> {getCustomerName(selectedInvoice.customerId)}</p>
            <p><strong>Date Issued:</strong> {new Date(selectedInvoice.dateIssued).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> {new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
            <p><strong>Amount Due:</strong> USD {selectedInvoice.amountDue.toFixed(2)}</p>
            <p><strong>Amount Paid:</strong> USD {selectedInvoice.amountPaid.toFixed(2)}</p>
            <p><strong>Remaining Balance:</strong> USD {(selectedInvoice.amountDue - selectedInvoice.amountPaid).toFixed(2)}</p>
            <p><strong>Payment Method:</strong> {selectedInvoice.paymentMethod || 'N/A'}</p>
            <p><strong>Date Paid:</strong> {selectedInvoice.datePaid ? new Date(selectedInvoice.datePaid).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Status:</strong> <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedInvoice.status)}`}>{selectedInvoice.status}</span></p>
            {selectedInvoice.status === InvoiceStatus.OVERDUE && <p className="text-red-600 font-bold">This invoice is overdue!</p>}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InvoicesPage;
