// SalesPage.tsx
import React, { useState, useEffect, ChangeEvent, FormEvent, useMemo } from 'react';
import { useAppContext } from '../App';
import { SalesOrder, ShippingStatus, Customer } from '../types';
import Modal from './common/Modal';
import {
  SHIPPING_STATUS_OPTIONS,
  PlusCircleIcon,
  PencilIcon,
  EyeIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  TrashIcon,
} from '../constants';

// --- Constants ---
const UNKNOWN_CUSTOMER = 'Unknown Customer';
const NOT_ASSIGNED_YET = 'Not assigned yet';
const N_A = 'N/A';
const STATUS_PENDING = 'pending…'; // For optimistic invoice update status

// --- Types ---
// Define the shape of the data managed by the form
type SalesOrderEditableFields = Omit<
  SalesOrder,
  'id' | 'totalAmount' | 'documents' | 'linkedInvoiceId'
>;

// Define the data shape passed by the form on save
type SalesOrderFormData = SalesOrderEditableFields & {
  totalAmount: number;
};


/* ------------------------------------------------------------------ */
/*  SALES‑ORDER FORM                                                  */
/* ------------------------------------------------------------------ */

const initialSalesOrderFormState: SalesOrderEditableFields = {
  customerId: '',
  product: '',
  grade: '',
  quantityKg: 0,
  unitPrice: 0,
  shippingStatus: ShippingStatus.PENDING,
  orderDate: new Date().toISOString().split('T')[0],
};

const SalesOrderForm: React.FC<{
  order?: SalesOrder; // Original order object for editing
  customers: Customer[];
  onSave: (formData: SalesOrderFormData) => void;
  onClose: () => void;
}> = ({ order, customers, onSave, onClose }) => {
  const [formData, setFormData] = useState<SalesOrderEditableFields>(() =>
    order
      ? {
          customerId: order.customerId,
          product: order.product,
          grade: order.grade,
          quantityKg: order.quantityKg,
          unitPrice: order.unitPrice,
          shippingStatus: order.shippingStatus,
          orderDate: order.orderDate,
        }
      : initialSalesOrderFormState
  );
  const [validationError, setValidationError] = useState<string | null>(null);


  useEffect(() => {
     // Update form state when the original order prop changes (e.g., opening modal for different order)
    setFormData(
      order
        ? {
            customerId: order.customerId,
            product: order.product,
            grade: order.grade,
            quantityKg: order.quantityKg,
            unitPrice: order.unitPrice,
            shippingStatus: order.shippingStatus,
            orderDate: order.orderDate,
          }
        : initialSalesOrderFormState
    );
    setValidationError(null); // Clear validation errors on order change
  }, [order]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Use type assertion for numeric conversions
    const numValue =
      name === 'quantityKg' || name === 'unitPrice' ? parseFloat(value) : value;

    setFormData((prev) => ({ ...prev, [name]: numValue }));
    setValidationError(null); // Clear error on input change
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
      setValidationError('Please select a customer.');
      return;
    }
    // Basic validation for required fields if HTML `required` isn't enough
    // if (!formData.product || !formData.grade || formData.quantityKg <= 0 || formData.unitPrice <= 0 || !formData.orderDate) {
    //   setValidationError('Please fill all required fields correctly.');
    //   return;
    // }


    // Compute totalAmount before calling onSave
    const totalAmount = formData.quantityKg * formData.unitPrice;

    // Pass only the form data fields + calculated totalAmount
    onSave({ ...formData, totalAmount });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
       {validationError && (
         <div className="text-red-600 text-sm">{validationError}</div>
       )}
      {/* --- Customer --- */}
      <div>
        <label
          htmlFor="customerId"
          className="block text-sm font-medium text-gray-700"
        >
          Customer
        </label>
        <select
          name="customerId"
          id="customerId"
          value={formData.customerId}
          onChange={handleChange}
          required
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"
        >
          <option value="" disabled>
            Select Customer
          </option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName}
            </option>
          ))}
        </select>
      </div>

      {/* --- Product & Grade --- */}
      <div>
        <label
          htmlFor="product"
          className="block text-sm font-medium text-gray-700"
        >
          Product (e.g., Green Coffee Beans)
        </label>
        <input
          type="text"
          name="product"
          id="product"
          value={formData.product}
          onChange={handleChange}
          required
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"
        />
      </div>
      <div>
        <label
          htmlFor="grade"
          className="block text-sm font-medium text-gray-700"
        >
          Grade (e.g., G1, G2)
        </label>
        <input
          type="text"
          name="grade"
          id="grade"
          value={formData.grade}
          onChange={handleChange}
          required
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"
        />
      </div>

      {/* --- Quantity & Unit Price --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="quantityKg"
            className="block text-sm font-medium text-gray-700"
          >
            Quantity (kg)
          </label>
          <input
            type="number"
            name="quantityKg"
            id="quantityKg"
            value={formData.quantityKg}
            onChange={handleChange}
            required
            min="0"
            step="0.1"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"
          />
        </div>
        <div>
          <label
            htmlFor="unitPrice"
            className="block text-sm font-medium text-gray-700"
          >
            Unit Price (USD)
          </label>
          <input
            type="number"
            name="unitPrice"
            id="unitPrice"
            value={formData.unitPrice}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"
          />
        </div>
      </div>

      {/* --- Dates & Shipping Status --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="orderDate"
            className="block text-sm font-medium text-gray-700"
          >
            Order Date
          </label>
          <input
            type="date"
            name="orderDate"
            id="orderDate"
            value={formData.orderDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"
          />
        </div>
        <div>
          <label
            htmlFor="shippingStatus"
            className="block text-sm font-medium text-gray-700"
          >
            Shipping Status
          </label>
          <select
            name="shippingStatus"
            id="shippingStatus"
            value={formData.shippingStatus}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"
          >
            {SHIPPING_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* --- Totals & Buttons --- */}
      <div>
        <p className="text-lg font-semibold text-gray-700">
          Total Amount: USD {(formData.quantityKg * formData.unitPrice).toFixed(2)}
        </p>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary"
        >
          Save Order
        </button>
      </div>
    </form>
  );
};

/* ------------------------------------------------------------------ */
/*  SALES‑PAGE (LIST + DETAIL)                                        */
/* ------------------------------------------------------------------ */

const SalesPage: React.FC = () => {
  const {
    salesOrders,
    addSalesOrder,
    updateSalesOrder,
    deleteSalesOrder, // Assume this is available in context
    customers,
    generateInvoiceForOrder,
    invoices, // Keep for reference if needed, but avoid direct find logic here
  } = useAppContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  // Store the full SalesOrder object for details/editing
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | undefined>(
    undefined
  );

  const [filterCustomer, setFilterCustomer] = useState<string>('');
  const [filterShippingStatus, setFilterShippingStatus] = useState<string>('');

  // Optimize customer name lookup
  const customerLookupMap = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach(c => map.set(c.id, c));
    return map;
  }, [customers]);

  const getCustomerName = (customerId: string) =>
    customerLookupMap.get(customerId)?.companyName || UNKNOWN_CUSTOMER;


  // ------------------------------------------------------------------
  //  Callbacks
  // ------------------------------------------------------------------

  const handleAddNewOrder = () => {
    setSelectedOrder(undefined); // Clear selected order for 'create' mode
    setIsModalOpen(true);
  };

  const handleEditOrder = (order: SalesOrder) => {
    setSelectedOrder(order); // Set selected order for 'edit' mode
    setIsModalOpen(true);
  };

  const handleViewOrderDetails = (order: SalesOrder) => {
    setSelectedOrder(order); // Set selected order for 'detail' mode
    setIsDetailModalOpen(true);
  };

   const handleDeleteOrder = async (orderId: string) => {
     if (window.confirm('Are you sure you want to delete this sales order?')) {
       try {
         // Assuming deleteSalesOrder handles the removal from Supabase and updates context state
         await deleteSalesOrder(orderId);
         // Close detail modal if the deleted order was the selected one
         if (selectedOrder?.id === orderId) {
             setIsDetailModalOpen(false);
             setSelectedOrder(undefined);
         }
         console.log(`Order ${orderId} deleted successfully.`); // Or show a toast notification
       } catch (error) {
         console.error('Error deleting sales order:', error);
         alert('Failed to delete sales order.'); // Or show a toast notification
       }
     }
   };


  const handleSaveOrder = async (formData: SalesOrderFormData) => {
     const baseOrderData: Omit<SalesOrder, 'id' | 'documents' | 'linkedInvoiceId'> = {
         customerId: formData.customerId,
         product: formData.product,
         grade: formData.grade,
         quantityKg: formData.quantityKg,
         unitPrice: formData.unitPrice,
         shippingStatus: formData.shippingStatus,
         orderDate: formData.orderDate,
         totalAmount: formData.totalAmount, // Use calculated amount from form
     };

    try {
        if (selectedOrder?.id) {
           // Editing existing order: include the original ID and potentially existing documents/invoice link
           const updatedOrder: SalesOrder = {
               id: selectedOrder.id,
               ...baseOrderData,
               documents: selectedOrder.documents, // Keep existing documents
               linkedInvoiceId: selectedOrder.linkedInvoiceId, // Keep existing link
           };
           await updateSalesOrder(updatedOrder);
            console.log(`Order ${selectedOrder.id} updated successfully.`); // Or show a toast
        } else {
            // Adding new order: let backend/context assign ID, documents and linkedInvoiceId start empty
            // The context's addSalesOrder should handle assigning the ID and initial empty/null values for documents/linkedInvoiceId
            // We pass the editable fields + totalAmount, and the context constructs the full SalesOrder
            await addSalesOrder(baseOrderData);
             console.log('New order added successfully.'); // Or show a toast
        }
         setIsModalOpen(false);
         setSelectedOrder(undefined); // Clear selected order after save
    } catch (error) {
        console.error('Error saving sales order:', error);
        alert('Failed to save sales order.'); // Or show a toast notification
    }
  };

  const handleGenerateInvoice = async (order: SalesOrder) => {
    if (!order.id) {
      alert('Please save the order before generating an invoice.'); // Use alert for simplicity, improve later
      return;
    }
    try {
        // Assume generateInvoiceForOrder updates the salesOrders context state
        // with the linkedInvoiceId, which will cause a re-render.
        // Avoid optimistic updates directly in component state.
        await generateInvoiceForOrder(order);
         console.log(`Invoice generated for order ${order.id}.`); // Or show a toast notification
    } catch (error) {
        console.error('Error generating invoice:', error);
        alert('Failed to generate invoice.'); // Or show a toast notification
    }
  };

  // ------------------------------------------------------------------
  //  Render Data
  // ------------------------------------------------------------------

  const filteredSalesOrders = salesOrders.filter((order) => {
    const customerMatch = filterCustomer
      ? order.customerId === filterCustomer
      : true;
    const shippingStatusMatch = filterShippingStatus
      ? order.shippingStatus === filterShippingStatus
      : true;
    return customerMatch && shippingStatusMatch;
  });

   // Helper function to get shipping status class
   const getShippingStatusClass = (status: ShippingStatus) => {
       switch (status) {
           case ShippingStatus.DELIVERED: return 'bg-green-100 text-green-800';
           case ShippingStatus.SHIPPED: return 'bg-blue-100 text-blue-800';
           case ShippingStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
           default: return 'bg-gray-100 text-gray-800';
       }
   };


  // ------------------------------------------------------------------
  //  Render
  // ------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* --- Header -------------------------------------------------- */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-primary flex items-center">
          <ShoppingCartIcon className="w-8 h-8 mr-2" />
          Sales Log
        </h1>
        <button
          onClick={handleAddNewOrder}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary flex items-center"
        >
          <PlusCircleIcon className="w-5 h-5 mr-2" /> Create New Order
        </button>
      </div>

      {/* --- Filters ------------------------------------------------- */}
      <div className="p-4 bg-surface rounded-md shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor="filterCustomer"
              className="block text-sm font-medium text-gray-700"
            >
              Filter by Customer
            </label>
            <select
              id="filterCustomer"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filterShippingStatus"
              className="block text-sm font-medium text-gray-700"
            >
              Filter by Shipping Status
            </label>
            <select
              id="filterShippingStatus"
              value={filterShippingStatus}
              onChange={(e) => setFilterShippingStatus(e.target.value)}
              className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"
            >
              <option value="">All Statuses</option>
              {SHIPPING_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- Empty‑state message ------------------------------------ */}
      {filteredSalesOrders.length === 0 && (
        <p className="text-center text-gray-500">No sales orders found.</p>
      )}

      {/* --- Table --------------------------------------------------- */}
      {filteredSalesOrders.length > 0 && (
          <div className="bg-surface shadow overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shipping Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSalesOrders.map((order) => (
                  // Use order.id as the key - assuming salesOrders from context always have IDs
                  <tr key={order.id} className="hover:bg-gray-50">
                    {/* --------------------------------------------------- */}
                    {/*                Order‑ID (guarded)                 */}
                    {/* --------------------------------------------------- */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                       {/* Display truncated ID or a placeholder if ID is missing (shouldn't happen for items in salesOrders list) */}
                      {order.id ? `${order.id.substring(0, 8)}…` : 'Pending'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getCustomerName(order.customerId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.product} ({order.grade})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      USD {order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getShippingStatusClass(order.shippingStatus)}`}
                      >
                        {order.shippingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewOrderDetails(order)}
                        className="text-accent hover:text-primary"
                         title="View Details"
                      >
                        <EyeIcon className="w-5 h-5 inline" />
                      </button>

                      {/* Only allow editing if the order has an ID */}
                      {!!order.id && (
                           <button
                             onClick={() => handleEditOrder(order)}
                             className="text-secondary hover:text-primary"
                              title="Edit Order"
                           >
                             <PencilIcon className="w-5 h-5 inline" />
                           </button>
                       )}


                      {/* Only allow invoice generation once the order has an ID and no linked invoice */}
                      {!!order.id && !order.linkedInvoiceId && (
                        <button
                          onClick={() => handleGenerateInvoice(order)}
                          title="Generate Invoice"
                          className="text-green-600 hover:text-green-800"
                        >
                          <DocumentTextIcon className="w-5 h-5 inline" />
                        </button>
                      )}

                       {/* Add Delete Button - Only if order has an ID */}
                       {!!order.id && (
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              title="Delete Order"
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="w-5 h-5 inline" />
                            </button>
                        )}

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      )}


      {/* --- Create / Edit Order Modal ------------------------------ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {setIsModalOpen(false); setSelectedOrder(undefined);}} // Clear selected order on close
        title={selectedOrder ? 'Edit Sales Order' : 'Create New Sales Order'}
        size="lg"
      >
        <SalesOrderForm
          order={selectedOrder}
          customers={customers}
          onSave={handleSaveOrder}
          onClose={() => {setIsModalOpen(false); setSelectedOrder(undefined);}} // Clear selected order on close
        />
      </Modal>

      {/* --- Detail Modal ------------------------------------------- */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {setIsDetailModalOpen(false); setSelectedOrder(undefined);}} // Clear selected order on close
          title="Order Details"
          size="md"
        >
          <div className="space-y-3">
            <p>
              <strong>Order ID:</strong>{' '}
              {selectedOrder.id || NOT_ASSIGNED_YET}
            </p>
            <p>
              <strong>Customer:</strong> {getCustomerName(selectedOrder.customerId)}
            </p>
            <p>
              <strong>Product:</strong> {selectedOrder.product} (Grade:{' '}
              {selectedOrder.grade})
            </p>
            <p>
              <strong>Quantity:</strong> {selectedOrder.quantityKg} kg
            </p>
            <p>
              <strong>Unit Price:</strong> USD{' '}
              {selectedOrder.unitPrice.toFixed(2)}
            </p>
            <p>
              <strong>Total Amount:</strong> USD{' '}
              {selectedOrder.totalAmount.toFixed(2)}
            </p>
            <p>
              <strong>Order Date:</strong>{' '}
              {new Date(selectedOrder.orderDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Shipping Status:</strong> {selectedOrder.shippingStatus}
            </p>
            <p>
              <strong>Linked Invoice ID:</strong>{' '}
              {selectedOrder.linkedInvoiceId || N_A}
            </p>

            {/* --- Documents section (mock) --- */}
            <div>
              <strong>Documents:</strong>
              {selectedOrder.documents && selectedOrder.documents.length > 0 ? (
                <ul className="list-disc list-inside ml-4">
                  {selectedOrder.documents.map((doc, index) => ( // Use index as key for documents if no unique ID is available
                    <li key={index}>
                      {doc.name} ({doc.type})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No documents uploaded.</p>
              )}

              <div className="mt-2">
                <label
                  htmlFor="docUpload"
                  className="text-sm text-gray-600"
                >
                  Upload Document (mock):
                </label>
                <input
                  type="file"
                  id="docUpload"
                  className="text-sm"
                  onChange={() => alert('File upload is a demo feature.')}
                />
              </div>
            </div>

            {/* --- Generate invoice button (guarded) --- */}
            {/* Only show button if order has an ID and no linked invoice */}
            {!!selectedOrder.id && !selectedOrder.linkedInvoiceId && (
              <div className="pt-4 border-t mt-4">
                <button
                  onClick={() => handleGenerateInvoice(selectedOrder)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center"
                >
                  <DocumentTextIcon className="w-5 h-5 mr-2" /> Generate Invoice
                </button>
              </div>
            )}

             {/* Add Delete Button in Detail Modal - Only if order has an ID */}
             {!!selectedOrder.id && (
                  <div className="pt-4 border-t mt-4">
                      <button
                         onClick={() => handleDeleteOrder(selectedOrder.id)}
                         title="Delete Order"
                         className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center justify-center"
                       >
                         <TrashIcon className="w-5 h-5 mr-2" /> Delete Order
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