import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAppContext } from '../App';
import { SalesOrder, ShippingStatus, Customer } from '../types';
import Modal from './common/Modal';
import { SHIPPING_STATUS_OPTIONS, PlusCircleIcon, PencilIcon, EyeIcon, ShoppingCartIcon, DocumentTextIcon } from '../constants';

const initialSalesOrderFormState: Omit<SalesOrder, 'id' | 'totalAmount' | 'documents' | 'linkedInvoiceId'> = {
  customerId: '',
  product: '',
  grade: '',
  quantityKg: 0,
  unitPrice: 0,
  shippingStatus: ShippingStatus.PENDING,
  orderDate: new Date().toISOString().split('T')[0],
};

const SalesOrderForm: React.FC<{ 
    order?: SalesOrder; 
    customers: Customer[];
    onSave: (order: SalesOrder | Omit<SalesOrder, 'id' | 'totalAmount' | 'documents' | 'linkedInvoiceId'>) => void; 
    onClose: () => void 
}> = ({ order, customers, onSave, onClose }) => {
  const [formData, setFormData] = useState<Omit<SalesOrder, 'id' | 'totalAmount' | 'documents' | 'linkedInvoiceId'>>(() => 
    order ? { ...order } : initialSalesOrderFormState
  );

  useEffect(() => {
    if (order) {
      setFormData({ ...order });
    } else {
      setFormData(initialSalesOrderFormState);
    }
  }, [order]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numValue = (name === 'quantityKg' || name === 'unitPrice') ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.customerId === '') {
        alert('Please select a customer.');
        return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">Customer</label>
        <select name="customerId" id="customerId" value={formData.customerId} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2">
          <option value="" disabled>Select Customer</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="product" className="block text-sm font-medium text-gray-700">Product (e.g., Green Coffee Beans)</label>
        <input type="text" name="product" id="product" value={formData.product} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
      </div>
      <div>
        <label htmlFor="grade" className="block text-sm font-medium text-gray-700">Grade (e.g., G1, G2)</label>
        <input type="text" name="grade" id="grade" value={formData.grade} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="quantityKg" className="block text-sm font-medium text-gray-700">Quantity (kg)</label>
          <input type="number" name="quantityKg" id="quantityKg" value={formData.quantityKg} onChange={handleChange} required min="0" step="0.1" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
        </div>
        <div>
          <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">Unit Price (USD)</label>
          <input type="number" name="unitPrice" id="unitPrice" value={formData.unitPrice} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700">Order Date</label>
            <input type="date" name="orderDate" id="orderDate" value={formData.orderDate} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
        </div>
        <div>
            <label htmlFor="shippingStatus" className="block text-sm font-medium text-gray-700">Shipping Status</label>
            <select name="shippingStatus" id="shippingStatus" value={formData.shippingStatus} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2">
                {SHIPPING_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
      </div>
      <div>
        <p className="text-lg font-semibold text-gray-700">Total Amount: USD {(formData.quantityKg * formData.unitPrice).toFixed(2)}</p>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary">Save Order</button>
      </div>
    </form>
  );
};

const SalesPage: React.FC = () => {
  const { salesOrders, addSalesOrder, updateSalesOrder, customers, generateInvoiceForOrder, invoices } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | undefined>(undefined);
  
  const [filterCustomer, setFilterCustomer] = useState<string>('');
  const [filterShippingStatus, setFilterShippingStatus] = useState<string>('');

  const handleAddNewOrder = () => {
    setSelectedOrder(undefined);
    setIsModalOpen(true);
  };

  const handleEditOrder = (order: SalesOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleViewOrderDetails = (order: SalesOrder) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };
  
  const handleSaveOrder = (orderData: SalesOrder | Omit<SalesOrder, 'id' | 'totalAmount' | 'documents' | 'linkedInvoiceId'>) => {
    if ('id' in orderData) {
      updateSalesOrder(orderData as SalesOrder);
    } else {
      addSalesOrder(orderData as Omit<SalesOrder, 'id' | 'totalAmount' | 'documents' | 'linkedInvoiceId'>);
    }
    setIsModalOpen(false);
  };

  const handleGenerateInvoice = (order: SalesOrder) => {
    generateInvoiceForOrder(order);
    // Optionally, refresh selectedOrder if detail modal is open
    if(selectedOrder && selectedOrder.id === order.id) {
        const updatedOrder = salesOrders.find(o => o.id === order.id);
        if(updatedOrder) setSelectedOrder(updatedOrder);
    }
  };

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.companyName || 'Unknown Customer';
  };
  
  const filteredSalesOrders = salesOrders.filter(order => {
    const customerMatch = filterCustomer ? order.customerId === filterCustomer : true;
    const shippingStatusMatch = filterShippingStatus ? order.shippingStatus === filterShippingStatus : true;
    return customerMatch && shippingStatusMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-primary flex items-center"><ShoppingCartIcon className="w-8 h-8 mr-2"/>Sales Log</h1>
        <button onClick={handleAddNewOrder} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary flex items-center">
          <PlusCircleIcon className="w-5 h-5 mr-2" /> Create New Order
        </button>
      </div>

      <div className="p-4 bg-surface rounded-md shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="filterCustomer" className="block text-sm font-medium text-gray-700">Filter by Customer</label>
            <select id="filterCustomer" value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filterShippingStatus" className="block text-sm font-medium text-gray-700">Filter by Shipping Status</label>
            <select id="filterShippingStatus" value={filterShippingStatus} onChange={e => setFilterShippingStatus(e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
              <option value="">All Statuses</option>
              {SHIPPING_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
      </div>
      
      {filteredSalesOrders.length === 0 && <p className="text-center text-gray-500">No sales orders found.</p>}
      
      <div className="bg-surface shadow overflow-x-auto rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSalesOrders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id.substring(0,8)}...</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCustomerName(order.customerId)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.product} ({order.grade})</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">USD {order.totalAmount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.shippingStatus === ShippingStatus.DELIVERED ? 'bg-green-100 text-green-800' :
                        order.shippingStatus === ShippingStatus.SHIPPED ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800' // Pending
                    }`}>{order.shippingStatus}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => handleViewOrderDetails(order)} className="text-accent hover:text-primary"><EyeIcon className="w-5 h-5 inline"/></button>
                  <button onClick={() => handleEditOrder(order)} className="text-secondary hover:text-primary"><PencilIcon className="w-5 h-5 inline"/></button>
                  {!order.linkedInvoiceId && (
                    <button onClick={() => handleGenerateInvoice(order)} title="Generate Invoice" className="text-green-600 hover:text-green-800"><DocumentTextIcon className="w-5 h-5 inline"/></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedOrder ? 'Edit Sales Order' : 'Create New Sales Order'} size="lg">
        <SalesOrderForm order={selectedOrder} customers={customers} onSave={handleSaveOrder} onClose={() => setIsModalOpen(false)} />
      </Modal>

      {selectedOrder && (
        <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Order Details" size="md">
          <div className="space-y-3">
            <p><strong>Order ID:</strong> {selectedOrder.id}</p>
            <p><strong>Customer:</strong> {getCustomerName(selectedOrder.customerId)}</p>
            <p><strong>Product:</strong> {selectedOrder.product} (Grade: {selectedOrder.grade})</p>
            <p><strong>Quantity:</strong> {selectedOrder.quantityKg} kg</p>
            <p><strong>Unit Price:</strong> USD {selectedOrder.unitPrice.toFixed(2)}</p>
            <p><strong>Total Amount:</strong> USD {selectedOrder.totalAmount.toFixed(2)}</p>
            <p><strong>Order Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
            <p><strong>Shipping Status:</strong> {selectedOrder.shippingStatus}</p>
            <p><strong>Linked Invoice ID:</strong> {selectedOrder.linkedInvoiceId || 'N/A'}</p>
            <div>
                <strong>Documents:</strong>
                {selectedOrder.documents.length > 0 ? (
                    <ul className="list-disc list-inside ml-4">
                        {selectedOrder.documents.map(doc => <li key={doc.name}>{doc.name} ({doc.type})</li>)}
                    </ul>
                ) : (<p className="text-sm text-gray-500">No documents uploaded.</p>)}
                 <div className="mt-2">
                    <label htmlFor="docUpload" className="text-sm text-gray-600">Upload Document (mock):</label>
                    <input type="file" id="docUpload" className="text-sm" onChange={() => alert('File upload is a demo feature.')}/>
                </div>
            </div>
             {!selectedOrder.linkedInvoiceId && (
                <div className="pt-4 border-t mt-4">
                    <button 
                        onClick={() => {
                            handleGenerateInvoice(selectedOrder);
                             // Optimistically update the view
                             const updatedOrder = { ...selectedOrder, linkedInvoiceId: invoices.find(inv => inv.orderId === selectedOrder.id)?.id || "pending..." };
                             setSelectedOrder(updatedOrder);
                        }} 
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center">
                        <DocumentTextIcon className="w-5 h-5 mr-2"/> Generate Invoice
                    </button>
                </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SalesPage;
