import React, { useState, useEffect, ChangeEvent, FormEvent, useCallback, useMemo } from 'react';
import { useAppContext } from '../App'; // Assuming useAppContext is in App.js or App.tsx
import { Invoice, InvoiceStatus, PaymentMethod, Customer, SalesOrder } from '../types'; // Assuming types are defined here
import Modal from './common/Modal'; // Assuming Modal component is here
// Import icons and constants
import { INVOICE_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS, PlusCircleIcon, PencilIcon, EyeIcon, DocumentTextIcon } from '../constants';
import { TrashIcon } from '@heroicons/react/24/outline'; // Import TrashIcon for delete button


// Initial state for a new invoice form, omitting fields managed by the system upon creation
const initialInvoiceFormState: Omit<Invoice, 'id' | 'invoiceNumber'> = {
  orderId: '',
  customerId: '',
  dateIssued: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default due in 30 days
  amountDue: 0,
  amountPaid: 0,
  paymentMethod: undefined, // Use undefined for optional fields when no value is selected
  datePaid: undefined,
  status: InvoiceStatus.UNPAID,
};

interface InvoiceFormProps {
  invoice?: Invoice;
  customers: Customer[];
  salesOrders: SalesOrder[];
  onSave: (invoiceData: Invoice | Omit<Invoice, 'id' | 'invoiceNumber'>) => void;
  onClose: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = React.memo(({ invoice, customers, salesOrders, onSave, onClose }) => {
  // Use a functional update for useState initialization
  const [formData, setFormData] = useState<Omit<Invoice, 'id' | 'invoiceNumber'>>(() =>
    // Initialize form state with existing invoice data if editing, otherwise use initial state
    invoice ? {
      orderId: invoice.orderId,
      customerId: invoice.customerId,
      dateIssued: invoice.dateIssued,
      dueDate: invoice.dueDate,
      amountDue: invoice.amountDue,
      amountPaid: invoice.amountPaid,
      paymentMethod: invoice.paymentMethod,
      datePaid: invoice.datePaid,
      status: invoice.status,
    } : initialInvoiceFormState
  );
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});


  // Effect to update form data if the 'invoice' prop changes (e.g., when opening the modal for editing)
  // And reset validation errors when the modal opens/closes (invoice prop changes)
  useEffect(() => {
    if (invoice) {
      setFormData({
        orderId: invoice.orderId,
        customerId: invoice.customerId,
        dateIssued: invoice.dateIssued,
        dueDate: invoice.dueDate,
        amountDue: invoice.amountDue,
        amountPaid: invoice.amountPaid,
        paymentMethod: invoice.paymentMethod,
        datePaid: invoice.datePaid,
        status: invoice.status,
      });
    } else {
      setFormData(initialInvoiceFormState);
    }
    // Reset validation errors whenever the invoice prop changes (modal opens/closes)
    setValidationErrors({});
  }, [invoice]);

  // Use useCallback for event handlers
  const handleOrderChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const orderId = e.target.value;
    const selectedOrder = salesOrders.find(o => o.id === orderId);

    setFormData(prev => {
      if (selectedOrder) {
          // Link amount due to order total.
          // Business rule: Keep amountPaid but adjust status based on new amountDue.
          const newAmountDue = selectedOrder.totalAmount ?? 0;
          const currentAmountPaid = prev.amountPaid ?? 0; // Use current paid amount

          let newStatus = InvoiceStatus.UNPAID;
           if (currentAmountPaid >= newAmountDue && newAmountDue > 0) {
               newStatus = InvoiceStatus.PAID;
           } else if (currentAmountPaid > 0 && currentAmountPaid < newAmountDue) {
               newStatus = InvoiceStatus.PARTIAL;
           } else if (newAmountDue <= 0 && currentAmountPaid > 0) {
               // Case for credit/zero due amounts that have been paid
               newStatus = InvoiceStatus.PAID;
           } else {
              newStatus = InvoiceStatus.UNPAID;
           }

          return {
              ...prev,
              orderId: selectedOrder.id,
              customerId: selectedOrder.customerId, // Set customerId from the selected order
              amountDue: newAmountDue,
              amountPaid: currentAmountPaid, // Keep existing paid amount
              status: newStatus, // Update status based on new amountDue and existing amountPaid
              // Do not reset datePaid or paymentMethod here
          };
      } else {
           // Handle case where order is deselected (value is '')
           // Keep current amountPaid and status, but reset amountDue and customerId
           return {
               ...prev,
               orderId: '',
               customerId: '', // Reset customer when order is deselected
               amountDue: 0,
               // Keep existing amountPaid, status, paymentMethod, datePaid
           };
      }
    });
    // Clear validation error for orderId and customerId when order changes
    setValidationErrors(prev => ({ ...prev, orderId: '', customerId: '' }));
  }, [salesOrders]); // salesOrders is a dependency

  // Helper function to update status and datePaid based on payment amounts
  // This is called *only* when amountDue or amountPaid changes via handleChange
  const updatePaymentStatus = useCallback((prevFormData: Omit<Invoice, 'id' | 'invoiceNumber'>, newAmountPaid: number, newAmountDue: number) => {
      const newState = { ...prevFormData }; // Create a copy to modify

      // Business logic choice: Status is primarily driven by payment amounts
      // Manual status selection via the dropdown might be overridden by subsequent amount changes.
      // If you need manual overrides to stick, this logic needs modification
      // (e.g., only auto-update if the current status is UNPAID, PARTIAL, or PAID).
      // Current implementation: Always auto-update if amountPaid/amountDue changes.

      if (newAmountDue > 0) {
           if (newAmountPaid === 0) {
                newState.status = InvoiceStatus.UNPAID;
           } else if (newAmountPaid < newAmountDue) {
                newState.status = InvoiceStatus.PARTIAL;
           } else { // newAmountPaid >= newAmountDue
                newState.status = InvoiceStatus.PAID;
           }
      } else { // Amount due is 0 or less (e.g., a credit)
          newState.status = newAmountPaid > 0 ? InvoiceStatus.PAID : InvoiceStatus.UNPAID; // If amountPaid > 0 for a zero/negative due, consider it PAID
      }


      // Auto-set datePaid when status becomes PAID and datePaid is not already set
      // Business logic choice: Clear datePaid if status changes away from PAID due to amount change
      if (newState.status === InvoiceStatus.PAID && !newState.datePaid) {
          newState.datePaid = new Date().toISOString().split('T')[0];
      } else if (newState.status !== InvoiceStatus.PAID && prevFormData.status === InvoiceStatus.PAID) {
          // If status was PAID and is now not PAID (due to amount change), clear datePaid
          newState.datePaid = undefined;
      }

      return newState;
  }, []);


  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => {
        let processedValue: string | number | undefined = value;
        const isNumericField = name === 'amountDue' || name === 'amountPaid';
        const isDateField = name === 'dateIssued' || name === 'dueDate' || name === 'datePaid';
        const isOptionalField = name === 'paymentMethod' || name === 'datePaid'; // Fields that can be explicitly empty

        if (isNumericField) {
            // Use Number() for stricter parsing. If value is empty, treat as 0. If NaN, treat as 0.
            const numValue = Number(value);
            processedValue = isNaN(numValue) ? 0 : numValue;
        } else if (isOptionalField && value === '') {
             // For optional fields like paymentMethod and datePaid, empty input means undefined value
             processedValue = undefined;
        }
        // For other types (select, text, date), processedValue is just value (or empty string if cleared)
        // Note: Date fields like 'dateIssued', 'dueDate' should probably not be optional according to 'required' attribute

        // Start building the new state with the processed value
        let newState = { ...prev, [name]: processedValue };

        // Ensure amountDue and amountPaid are always numbers (or 0) in the state for subsequent logic
        const currentAmountDue = Number(newState.amountDue); // Number(0) is 0, Number('5') is 5, Number('') is 0, Number(undefined) is NaN -> 0 via isNaN check
        const currentAmountPaid = Number(newState.amountPaid);
        newState.amountDue = isNaN(currentAmountDue) ? 0 : currentAmountDue;
        newState.amountPaid = isNaN(currentAmountPaid) ? 0 : currentAmountPaid;


        // --- Auto-update status and datePaid if amountPaid or amountDue changed ---
        // This applies the payment status logic whenever a numeric amount field is changed.
        if (isNumericField && (name === 'amountPaid' || name === 'amountDue')) {
             // Use the cleaned up numeric values for status update logic
             newState = updatePaymentStatus(newState as typeof initialInvoiceFormState, newState.amountPaid, newState.amountDue);
        } else if (name === 'status') {
            // If the status is manually changed by the user, do NOT auto-update datePaid here.
            // The updatePaymentStatus helper handles datePaid based on amount changes.
            // If datePaid should sync with *manual* status change, add logic here.
            // Business rule: For now, datePaid is only auto-set/cleared by AMOUNT changes.
             // If a user manually sets status to PAID, they must also manually set datePaid.
        } else if (name === 'datePaid' && processedValue !== undefined) {
             // If datePaid is manually set, ensure status is PAID if amountPaid covers amountDue
             // unless a different status was already manually selected. This gets complex.
             // Sticking to the simpler rule: Amount changes drive status/datePaid sync.
        }


        return newState as typeof initialInvoiceFormState; // Cast to correct type
    });

     // Clear validation error for the field that is changing
     setValidationErrors(prev => ({ ...prev, [name]: '' }));

  }, [updatePaymentStatus]); // Depends on the extracted helper

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();

    const errors: { [key: string]: string } = {};

    const finalAmountDue = Number(formData.amountDue);
    const finalAmountPaid = Number(formData.amountPaid);

    // Validation checks
    if (!formData.orderId) {
        errors.orderId = 'Related Order is required.';
    }
    // The customerId is derived from the orderId. If orderId is selected, customerId should be populated.
    // The original validation message "Customer is required (select an order)" implies selecting an order fulfills this.
    // We keep the check on customerId, but the fix ensures it's populated when orderId is selected.
    // If orderId is selected but customerId is NOT populated (e.g., data inconsistency), this check will still catch it.
    if (!formData.customerId) {
        errors.customerId = 'Customer is required (select an order).';
    }
    if (!formData.dateIssued) {
        errors.dateIssued = 'Date Issued is required.';
    }
     if (!formData.dueDate) {
        errors.dueDate = 'Due Date is required.';
    }
     if (isNaN(finalAmountDue) || finalAmountDue < 0) { // Amount due can be 0 in some scenarios
        errors.amountDue = 'Amount Due must be a non-negative number.';
    }
     if (isNaN(finalAmountPaid) || finalAmountPaid < 0) { // Allow amount paid to be 0
        errors.amountPaid = 'Amount Paid must be a non-negative number.';
    }

    // Add validation for datePaid if status is manually set to PAID but amountPaid is 0
    // This adds complexity - let's keep the amount-driven datePaid logic for simplicity for now.
    // If the user manually selects PAID status, we assume they will also manually enter datePaid if needed.
    // The auto-update logic handles datePaid sync *only* when amounts change.

    if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        // Instead of alert, validation messages are shown inline
        return;
    }

    setValidationErrors({}); // Clear errors if validation passes

    // Prepare data for saving - ensure amounts are numbers
     const dataToSave: Omit<Invoice, 'id' | 'invoiceNumber'> = {
        ...formData,
        amountDue: finalAmountDue,
        amountPaid: finalAmountPaid,
        // Explicitly handle optional fields - formData might have '' if not using undefined logic
        // However, handleChange already sets them to undefined for optional fields on empty string
        paymentMethod: formData.paymentMethod === '' ? undefined : formData.paymentMethod,
        datePaid: formData.datePaid === '' ? undefined : formData.datePaid,
     };


    // If editing, include the invoice ID and number for the update function
    if (invoice) {
      // Cast is safe because we are adding id and invoiceNumber which makes it conform to Invoice type
      onSave({ ...dataToSave, id: invoice.id, invoiceNumber: invoice.invoiceNumber } as Invoice);
    } else {
      // This conforms to the Omit<Invoice, ...> part of the union type
      onSave(dataToSave);
    }
  }, [formData, invoice, onSave]); // Depend on formData, invoice, and onSave

  const isEditing = !!invoice;
  const customerForOrder = useMemo(() => {
      if (!formData.orderId) return undefined;
      const order = salesOrders.find(o => o.id === formData.orderId);
      if (!order) return undefined;
      return customers.find(c => c.id === order.customerId);
  }, [formData.orderId, salesOrders, customers]);


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="orderId" className="block text-sm font-medium text-gray-700">Related Order</label>
        {/* Sales Order Select - Filter out orders that already have a linked invoice,
            unless it's the order linked to the current invoice being edited */}
        <select name="orderId" id="orderId" value={formData.orderId} onChange={handleOrderChange} required className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 ${isEditing ? 'bg-gray-100 cursor-not-allowed' : ''} ${validationErrors.orderId ? 'border-red-500' : ''}`} disabled={isEditing}>
          <option value="" disabled>Select Order</option>
          {salesOrders
            // Filter logic: show orders without a linked invoice OR the order currently linked to this invoice if editing
            .filter(o => !o.linkedInvoiceId || (isEditing && o.id === invoice?.orderId))
            .map(o => {
                const customer = customers.find(c=>c.id === o.customerId);
                return (
                  <option key={o.id} value={o.id}>
                    {o.id.substring(0,8)}... - {customer?.companyName || 'Unknown Customer'}
                  </option>
              );
            })}
        </select>
        {isEditing && <p className="text-xs text-gray-500 mt-1 text-yellow-600">Order is linked to this invoice and cannot be changed.</p>}
         {validationErrors.orderId && <p className="text-xs text-red-600 mt-1">{validationErrors.orderId}</p>}
        {/* Add warning if orderId is selected but customerId is not found - indicates data inconsistency */}
        {formData.orderId && !customerForOrder && (
             <p className="text-xs text-red-600 mt-1">Warning: Customer for selected order not found.</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Customer</label>
        {/* Display customer name based on selected order's customerId */}
        <input
            type="text"
            value={customerForOrder?.companyName || ''}
            readOnly
            disabled
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-700 sm:text-sm p-2 cursor-not-allowed"
        />
         {/* The validation error for customerId is now correctly handled because selecting an order populates customerId */}
         {validationErrors.customerId && <p className="text-xs text-red-600 mt-1">{validationErrors.customerId}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="dateIssued" className="block text-sm font-medium text-gray-700">Date Issued</label>
            <input type="date" name="dateIssued" id="dateIssued" value={formData.dateIssued || ''} onChange={handleChange} required className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 ${validationErrors.dateIssued ? 'border-red-500' : ''}`}/>
             {validationErrors.dateIssued && <p className="text-xs text-red-600 mt-1">{validationErrors.dateIssued}</p>}
        </div>
        <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
            <input type="date" name="dueDate" id="dueDate" value={formData.dueDate || ''} onChange={handleChange} required className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 ${validationErrors.dueDate ? 'border-red-500' : ''}`}/>
             {validationErrors.dueDate && <p className="text-xs text-red-600 mt-1">{validationErrors.dueDate}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="amountDue" className="block text-sm font-medium text-gray-700">Amount Due (USD)</label>
            {/* Amount Due is read-only if editing, as it's tied to the order */}
            <input
                type="number"
                name="amountDue"
                id="amountDue"
                value={formData.amountDue ?? ''} // Use '' for controlled number input empty state
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm p-2 ${isEditing ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : 'focus:ring-primary focus:border-primary'} ${validationErrors.amountDue ? 'border-red-500' : ''}`}
                readOnly={isEditing}
                disabled={isEditing}
            />
             {validationErrors.amountDue && <p className="text-xs text-red-600 mt-1">{validationErrors.amountDue}</p>}
        </div>
        <div>
            <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700">Amount Paid (USD)</label>
            <input
                type="number"
                name="amountPaid"
                id="amountPaid"
                value={formData.amountPaid ?? ''} // Use '' for controlled number input empty state
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 ${validationErrors.amountPaid ? 'border-red-500' : ''}`}
            />
             {validationErrors.amountPaid && <p className="text-xs text-red-600 mt-1">{validationErrors.amountPaid}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select
                name="paymentMethod"
                id="paymentMethod"
                value={formData.paymentMethod ?? ''} // Use '' for select input empty state
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"
            >
                <option value="">Select Method</option>
                {PAYMENT_METHOD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="datePaid" className="block text-sm font-medium text-gray-700">Date Paid</label>
            <input
                type="date"
                name="datePaid"
                id="datePaid"
                value={formData.datePaid ?? ''} // Use '' for date input empty state
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"
            />
        </div>
      </div>
       <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            {/* Status can be manually overridden, but amount changes will sync it to PAID/PARTIAL/UNPAID */}
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
});


const InvoicesPage: React.FC = () => {
  // Add deleteInvoice to the context destructuring
  const { invoices, addInvoice, updateInvoice, deleteInvoice, customers, salesOrders } = useAppContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>(undefined);

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCustomer, setFilterCustomer] = useState<string>('');

  // Memoize a map from orderId to customerId for quick lookup
  const orderIdToCustomerIdMap = useMemo(() => {
      const map: { [key: string]: string } = {};
      salesOrders.forEach(order => {
          map[order.id] = order.customerId;
      });
      return map;
  }, [salesOrders]);

  // Memoize customer names into a map for efficient lookup
  const customerNameMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    customers.forEach(c => {
      map[c.id] = c.companyName || 'Unnamed Customer'; // Provide a default name
    });
    return map;
  }, [customers]);

   // Memoized function to get customer name based on invoice's orderId
   // This uses the salesOrders -> customerId -> customerName path as requested
   const getCustomerNameForInvoice = useCallback((invoiceOrderId: string) => {
       const customerId = orderIdToCustomerIdMap[invoiceOrderId];
       if (!customerId) {
           return 'Unknown Customer (Order Not Found)'; // Handle case where linked order is missing
       }
       return customerNameMap[customerId] || 'Unknown Customer'; // Handle case where customer ID is in order but not in customer list
   }, [orderIdToCustomerIdMap, customerNameMap]);


  // Calculate today's date once as a Date object for robust comparison
  const todayDate = useMemo(() => {
      const date = new Date();
      // Reset time component to midnight UTC for consistent date-only comparison
      date.setUTCHours(0, 0, 0, 0);
      return date;
    }, []);


  // Memoize the filtered invoices list
  const filteredInvoices = useMemo(() => {
      return invoices
        .map(inv => {
          // Calculate effective status, marking unpaid/partial past due invoices as OVERDUE
          // Use Date objects for comparison
          const dueDate = new Date(inv.dueDate);
          // Reset time component of dueDate to midnight UTC for consistent date-only comparison
          dueDate.setUTCHours(0, 0, 0, 0);

          const effectiveStatus = (inv.status === InvoiceStatus.UNPAID || inv.status === InvoiceStatus.PARTIAL) && dueDate < todayDate
            ? InvoiceStatus.OVERDUE
            : inv.status;

          // Return a new invoice object with the effective status
          return {...inv, status: effectiveStatus};
        })
        .filter(invoice => {
          // Apply status filter
          // Note: The filter value should match the effectiveStatus calculated above or the original status if not overdue
          const statusMatch = filterStatus ? invoice.status === filterStatus : true;
          // Apply customer filter
          // The filter uses invoice.customerId, which is populated from the DB and matches the customerId on the linked order.
          // This is consistent with the filter dropdown source.
          const customerMatch = filterCustomer ? invoice.customerId === filterCustomer : true;
          return statusMatch && customerMatch;
        });
  }, [invoices, todayDate, filterStatus, filterCustomer]); // Dependencies for memoization

  const getStatusColor = useCallback((status: InvoiceStatus) => {
    switch(status) {
        case InvoiceStatus.PAID: return 'bg-green-100 text-green-800';
        case InvoiceStatus.PARTIAL: return 'bg-yellow-100 text-yellow-800';
        case InvoiceStatus.UNPAID: return 'bg-red-100 text-red-800';
        case InvoiceStatus.OVERDUE: return 'bg-pink-200 text-pink-800 font-bold'; // Use a distinct color for OVERDUE
        default: return 'bg-gray-100 text-gray-800'; // Default color for unknown status
    }
  }, []); // No dependencies

  // Handlers for opening modals and selecting invoices
  const handleAddNewInvoice = useCallback(() => {
    setSelectedInvoice(undefined); // Clear selected invoice for 'add' mode
    setIsModalOpen(true);
  }, []);

  const handleEditInvoice = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice); // Set selected invoice for 'edit' mode
    setIsModalOpen(true);
  }, []);

  const handleViewInvoiceDetails = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice); // Set selected invoice for 'view' mode
    setIsDetailModalOpen(true);
  }, []);

   // Handler for deleting an invoice
   const handleDeleteInvoice = useCallback(async (invoiceId: string) => {
      const isConfirmed = window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.");
      if (!isConfirmed) {
        return; // Stop if the user cancels
      }
      try {
        // Call the delete function from context
        // Assumes deleteInvoice exists in useAppContext and handles Supabase deletion and state update
        await deleteInvoice(invoiceId);
        // Optional: Show a success message (e.g., using a toast notification library)
        console.log(`Invoice ${invoiceId} deleted successfully.`);
      } catch (error) {
        // Optional: Show an error message
        console.error("Error deleting invoice:", error);
        alert("Failed to delete invoice. Please try again."); // Simple alert for error feedback
      }
    }, [deleteInvoice]); // Depends on deleteInvoice function from context

  // Handler for saving the invoice data received from the form
  const handleSaveInvoice = useCallback((invoiceData: Invoice | Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    if ('id' in invoiceData) {
      // Use the update function from context
      updateInvoice(invoiceData as Invoice);
    } else {
      // Use the add function from context
      addInvoice(invoiceData);
    }
    setIsModalOpen(false); // Close the form modal after saving
    setIsDetailModalOpen(false); // Ensure detail modal is also closed if open (e.g. editing from detail view)
    setSelectedInvoice(undefined); // Clear selected invoice after saving
  }, [addInvoice, updateInvoice]); // Depend on context functions

  // Handlers for filter changes
  const handleStatusFilterChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
      setFilterStatus(e.target.value);
  }, []);

  const handleCustomerFilterChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
      setFilterCustomer(e.target.value);
  }, []);


  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-primary flex items-center"><DocumentTextIcon className="w-8 h-8 mr-2"/>Invoices & Payments</h1>
        <button onClick={handleAddNewInvoice} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary flex items-center transition duration-150 ease-in-out">
          <PlusCircleIcon className="w-5 h-5 mr-2" /> Create New Invoice
        </button>
      </div>

      {/* Filter Section */}
      <div className="p-4 bg-surface rounded-md shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700">Status</label>
            <select id="filterStatus" value={filterStatus} onChange={handleStatusFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm">
              <option value="">All Statuses</option>
              {/* Include all relevant status options including the calculated OVERDUE and PARTIAL */}
              {['Unpaid', 'Partial', 'Paid', 'Overdue'].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filterCustomer" className="block text-sm font-medium text-gray-700">Customer</label>
            <select id="filterCustomer" value={filterCustomer} onChange={handleCustomerFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm">
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Invoice List Table */}
      {filteredInvoices.length === 0 && <p className="text-center text-gray-500 py-8">No invoices found matching your criteria.</p>}

      {filteredInvoices.length > 0 && (
        <div className="bg-surface shadow overflow-hidden rounded-lg">
          <div className="overflow-x-auto"> {/* Container for horizontal scrolling */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Revert key back to invoice.id if it's truly unique across all invoices (which it should be).
                    Using index as key can lead to issues with list reordering or filtering. */}
                {filteredInvoices.map((invoice) => {
                  return (
                    <tr key={invoice.id} className={`hover:bg-gray-50 ${invoice.status === InvoiceStatus.UNPAID || invoice.status === InvoiceStatus.OVERDUE ? 'border-l-4 border-red-500' : invoice.status === InvoiceStatus.PARTIAL ? 'border-l-4 border-yellow-500' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                      {/* Use the new helper to get customer name based on orderId */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCustomerNameForInvoice(invoice.orderId)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">USD {invoice.amountDue != null ? invoice.amountDue.toFixed(2) : "0.00"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">USD {invoice.amountPaid != null ? invoice.amountPaid.toFixed(2) : "0.00"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                             {invoice.status}
                         </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button type="button" onClick={() => handleViewInvoiceDetails(invoice)} className="text-accent hover:text-primary p-1 rounded-full hover:bg-gray-200 transition duration-150 ease-in-out" aria-label="View Invoice Details"><EyeIcon className="w-5 h-5 inline"/></button>
                        <button type="button" onClick={() => handleEditInvoice(invoice)} className="text-secondary hover:text-primary p-1 rounded-full hover:bg-gray-200 transition duration-150 ease-in-out" aria-label="Edit Invoice"><PencilIcon className="w-5 h-5 inline"/></button>
                        {/* Add Delete Button */}
                        <button type="button" onClick={() => handleDeleteInvoice(invoice.id)} className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-gray-200 transition duration-150 ease-in-out" aria-label="Delete Invoice">
                            <TrashIcon className="w-5 h-5 inline"/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Form Modal (Add/Edit) */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedInvoice(undefined); }} title={selectedInvoice ? 'Edit Invoice' : 'Create New Invoice'} size="lg">
         {/* Render form only when modal is open to ensure state is correct */}
        {isModalOpen && (
            <InvoiceForm
                invoice={selectedInvoice}
                customers={customers}
                salesOrders={salesOrders}
                onSave={handleSaveInvoice}
                onClose={() => { setIsModalOpen(false); setSelectedInvoice(undefined); }}n            />
        )}
      </Modal>

 {/* Invoice Details Modal */}
      {selectedInvoice && ( // Only render detail modal content if an invoice is selected
        <Modal isOpen={isDetailModalOpen} onClose={() => { setIsDetailModalOpen(false); setSelectedInvoice(undefined); }} title="Invoice Details" size="md">
          <div className="space-y-3 text-gray-700">
            <p><strong>Invoice Number:</strong> {selectedInvoice.invoiceNumber}</p>
            <p><strong>Order ID:</strong> {selectedInvoice.orderId}</p>
            {/* Use the new helper to get customer name based on orderId */}
            <p><strong>Customer:</strong> {getCustomerNameForInvoice(selectedInvoice.orderId)}</p>
            <p><strong>Date Issued:</strong> {new Date(selectedInvoice.dateIssued).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> {new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
             <p><strong>Amount Due:</strong> USD {selectedInvoice.amountDue != null ? selectedInvoice.amountDue.toFixed(2) : "0.00"}</p>
             <p><strong>Amount Paid:</strong> USD {selectedInvoice.amountPaid != null ? selectedInvoice.amountPaid.toFixed(2) : "0.00"}</p>
             <p><strong>Status:</strong> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedInvoice.status)}`}>{selectedInvoice.status}</span></p>
             {selectedInvoice.paymentMethod && <p><strong>Payment Method:</strong> {selectedInvoice.paymentMethod}</p>}
             {selectedInvoice.datePaid && <p><strong>Date Paid:</strong> {new Date(selectedInvoice.datePaid).toLocaleDateString()}</p>}
          </div>
           {/* Option to edit from details modal */}
          <div className="flex justify-end mt-4">
             <button
               onClick={() => { setIsDetailModalOpen(false); handleEditInvoice(selectedInvoice); }}
               className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary"
             >
               Edit Invoice
             </button>
           </div>
        </Modal>
      )}    </div>
  );
};

export default InvoicesPage;
