
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAppContext } from '../App';
import { Customer, CoffeeOrigin, CustomerStatus, Certification, Interaction, OptionType } from '../types';
import Modal from './common/Modal';
import { COFFEE_ORIGINS_OPTIONS, CUSTOMER_STATUS_OPTIONS, CERTIFICATION_OPTIONS, INTERACTION_TYPE_OPTIONS, PlusCircleIcon, PencilIcon, EyeIcon, UsersIcon, ChevronDownIcon } from '../constants';

const initialCustomerFormState: Omit<Customer, 'id' | 'interactions'> = {
  companyName: '',
  contactPerson: '',
  country: '',
  email: '',
  phone: '',
  preferredOrigin: CoffeeOrigin.SIDAMA,
  certificationsRequired: [],
  status: CustomerStatus.LEAD,
  assignedSalesRep: '',
  notes: '',
  nextFollowUpDate: undefined,
};

const initialInteractionFormState: Omit<Interaction, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    type: 'Call',
    notes: '',
};

const CustomerForm: React.FC<{ customer?: Customer; onSave: (customer: Customer | Omit<Customer, 'id' | 'interactions'>) => void; onClose: () => void }> = ({ customer, onSave, onClose }) => {
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'interactions'>>(() => customer ? { ...customer } : initialCustomerFormState);

  useEffect(() => {
    if (customer) {
      setFormData({ ...customer });
    } else {
      setFormData(initialCustomerFormState);
    }
  }, [customer]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const value: Certification[] = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push(options[i].value as Certification);
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (customer) {
      onSave({ ...customer, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
        <input type="text" name="companyName" id="companyName" value={formData.companyName} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">Contact Person</label>
          <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
          <input type="text" name="country" id="country" value={formData.country} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
          <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="preferredOrigin" className="block text-sm font-medium text-gray-700">Preferred Coffee Origin</label>
          <select name="preferredOrigin" id="preferredOrigin" value={formData.preferredOrigin} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2">
            {COFFEE_ORIGINS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Customer Status</label>
          <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2">
            {CUSTOMER_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>
       <div>
        <label htmlFor="certificationsRequired" className="block text-sm font-medium text-gray-700">Certifications Required</label>
        <select 
            name="certificationsRequired" 
            id="certificationsRequired" 
            multiple 
            value={formData.certificationsRequired} 
            onChange={handleMultiSelectChange} 
            className="mt-1 block w-full h-32 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"
        >
            {CERTIFICATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="assignedSalesRep" className="block text-sm font-medium text-gray-700">Assigned Sales Rep</label>
          <input type="text" name="assignedSalesRep" id="assignedSalesRep" value={formData.assignedSalesRep} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
        </div>
        <div>
          <label htmlFor="nextFollowUpDate" className="block text-sm font-medium text-gray-700">Next Follow-Up Date</label>
          <input type="date" name="nextFollowUpDate" id="nextFollowUpDate" value={formData.nextFollowUpDate || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
        </div>
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"></textarea>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">Cancel</button>
        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent">Save Customer</button>
      </div>
    </form>
  );
};

const InteractionForm: React.FC<{ customerId: string; onClose: () => void }> = ({ customerId, onClose }) => {
    const { logInteraction } = useAppContext();
    const [formData, setFormData] = useState<Omit<Interaction, 'id'>>(initialInteractionFormState);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        logInteraction(customerId, formData);
        onClose();
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"/>
            </div>
            <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                <select name="type" id="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2">
                   {INTERACTION_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} required rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2"></textarea>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary">Log Interaction</button>
            </div>
        </form>
    );
};


const CrmPage: React.FC = () => {
  const { customers, addCustomer, updateCustomer } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [currentCustomerForInteraction, setCurrentCustomerForInteraction] = useState<string | undefined>(undefined);

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterOrigin, setFilterOrigin] = useState<string>('');
  const [viewLayout, setViewLayout] = useState<'list' | 'card'>('card');

  const handleAddNewCustomer = () => {
    setSelectedCustomer(undefined);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailViewOpen(true);
  };

  const handleSaveCustomer = (customerData: Customer | Omit<Customer, 'id' | 'interactions'>) => {
    if ('id' in customerData) {
      updateCustomer(customerData as Customer);
    } else {
      addCustomer(customerData as Omit<Customer, 'id' | 'interactions'>);
    }
    setIsModalOpen(false);
  };

  const handleLogInteraction = (customerId: string) => {
    setCurrentCustomerForInteraction(customerId);
    setIsInteractionModalOpen(true);
  };
  
  const filteredCustomers = customers.filter(customer => {
    const statusMatch = filterStatus ? customer.status === filterStatus : true;
    const originMatch = filterOrigin ? customer.preferredOrigin === filterOrigin : true;
    return statusMatch && originMatch;
  });
  
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-primary flex items-center"><UsersIcon className="w-8 h-8 mr-2"/>Customer Relationship Management</h1>
        <button onClick={handleAddNewCustomer} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary flex items-center">
          <PlusCircleIcon className="w-5 h-5 mr-2" /> Add New Customer
        </button>
      </div>

      <div className="p-4 bg-surface rounded-md shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700">Filter by Status</label>
            <select id="filterStatus" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
              <option value="">All Statuses</option>
              {CUSTOMER_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filterOrigin" className="block text-sm font-medium text-gray-700">Filter by Origin</label>
            <select id="filterOrigin" value={filterOrigin} onChange={e => setFilterOrigin(e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
              <option value="">All Origins</option>
              {COFFEE_ORIGINS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">View Layout</label>
            <div className="mt-1 flex rounded-md shadow-sm">
                <button onClick={() => setViewLayout('list')} className={`px-3 py-2 rounded-l-md border border-gray-300 ${viewLayout === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>List</button>
                <button onClick={() => setViewLayout('card')} className={`px-3 py-2 rounded-r-md border border-gray-300 -ml-px ${viewLayout === 'card' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Card</button>
            </div>
          </div>
        </div>
      </div>

      {filteredCustomers.length === 0 && <p className="text-center text-gray-500">No customers found.</p>}

      {viewLayout === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map(customer => (
            <div key={customer.id} className="bg-surface rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-200">
              <div className="p-5">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-semibold text-primary mb-1">{customer.companyName}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.status === CustomerStatus.ACTIVE ? 'bg-green-100 text-green-700' :
                        customer.status === CustomerStatus.LEAD ? 'bg-yellow-100 text-yellow-700' :
                        customer.status === CustomerStatus.REPEAT ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700' // Dormant
                    }`}>{customer.status}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{customer.contactPerson} - {customer.country}</p>
                <p className="text-sm text-gray-500 mb-3">{customer.email} | {customer.phone}</p>
                
                <div className="mb-3">
                    <p className="text-xs text-gray-500">Origin: <span className="font-medium text-secondary">{customer.preferredOrigin}</span></p>
                    {customer.certificationsRequired.length > 0 && <p className="text-xs text-gray-500">Certs: <span className="font-medium text-secondary">{customer.certificationsRequired.join(', ')}</span></p>}
                </div>
                
                {customer.nextFollowUpDate && (
                    <p className={`text-sm mb-3 ${customer.nextFollowUpDate < today ? 'text-red-500 font-semibold' : 'text-gray-700'}`}>
                        Follow-up: {new Date(customer.nextFollowUpDate).toLocaleDateString()}
                        {customer.nextFollowUpDate < today && <span className="ml-1">(Overdue)</span>}
                    </p>
                )}

                <div className="flex space-x-2">
                  <button onClick={() => handleViewDetails(customer)} className="text-sm bg-accent text-primary px-3 py-1 rounded-md hover:opacity-80 flex items-center"><EyeIcon className="w-4 h-4 mr-1"/> Details</button>
                  <button onClick={() => handleEditCustomer(customer)} className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 flex items-center"><PencilIcon className="w-4 h-4 mr-1"/> Edit</button>
                  <button onClick={() => handleLogInteraction(customer.id)} className="text-sm bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 flex items-center"><PlusCircleIcon className="w-4 h-4 mr-1"/> Log</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface shadow overflow-x-auto rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Follow-Up</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.companyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.contactPerson}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        customer.status === CustomerStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                        customer.status === CustomerStatus.LEAD ? 'bg-yellow-100 text-yellow-800' :
                        customer.status === CustomerStatus.REPEAT ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                    }`}>{customer.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.preferredOrigin}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${customer.nextFollowUpDate && customer.nextFollowUpDate < today ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {customer.nextFollowUpDate ? new Date(customer.nextFollowUpDate).toLocaleDateString() : 'N/A'}
                    {customer.nextFollowUpDate && customer.nextFollowUpDate < today && " (Overdue)"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleViewDetails(customer)} className="text-accent hover:text-primary"><EyeIcon className="w-5 h-5 inline"/></button>
                    <button onClick={() => handleEditCustomer(customer)} className="text-secondary hover:text-primary"><PencilIcon className="w-5 h-5 inline"/></button>
                    <button onClick={() => handleLogInteraction(customer.id)} className="text-blue-600 hover:text-blue-800"><PlusCircleIcon className="w-5 h-5 inline"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedCustomer ? 'Edit Customer' : 'Add New Customer'}>
        <CustomerForm customer={selectedCustomer} onSave={handleSaveCustomer} onClose={() => setIsModalOpen(false)} />
      </Modal>

      {currentCustomerForInteraction && (
        <Modal isOpen={isInteractionModalOpen} onClose={() => setIsInteractionModalOpen(false)} title="Log Interaction">
            <InteractionForm customerId={currentCustomerForInteraction} onClose={() => setIsInteractionModalOpen(false)} />
        </Modal>
      )}

      {selectedCustomer && (
        <Modal isOpen={isDetailViewOpen} onClose={() => setIsDetailViewOpen(false)} title={`${selectedCustomer.companyName} - Details`} size="lg">
          <div className="space-y-4">
            <p><strong>Contact Person:</strong> {selectedCustomer.contactPerson}</p>
            <p><strong>Country:</strong> {selectedCustomer.country}</p>
            <p><strong>Email:</strong> {selectedCustomer.email}</p>
            <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
            <p><strong>Preferred Origin:</strong> {selectedCustomer.preferredOrigin}</p>
            <p><strong>Certifications:</strong> {selectedCustomer.certificationsRequired.join(', ') || 'None'}</p>
            <p><strong>Status:</strong> {selectedCustomer.status}</p>
            <p><strong>Sales Rep:</strong> {selectedCustomer.assignedSalesRep}</p>
            {selectedCustomer.nextFollowUpDate && <p className={selectedCustomer.nextFollowUpDate < today ? 'text-red-500 font-bold' : ''}><strong>Next Follow-Up:</strong> {new Date(selectedCustomer.nextFollowUpDate).toLocaleDateString()} {selectedCustomer.nextFollowUpDate < today ? '(Overdue Reminder!)' : ''}</p>}
            <p><strong>Notes:</strong> {selectedCustomer.notes || 'N/A'}</p>
            
            <h4 className="text-lg font-semibold text-primary mt-4 pt-4 border-t">Interaction History</h4>
            {selectedCustomer.interactions.length > 0 ? (
              <ul className="space-y-3 max-h-60 overflow-y-auto">
                {[...selectedCustomer.interactions].reverse().map(interaction => ( // Show newest first
                  <li key={interaction.id} className="p-3 bg-gray-50 rounded-md">
                    <p className="font-semibold text-secondary">{interaction.type} - {new Date(interaction.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">{interaction.notes}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No interactions logged yet.</p>
            )}
            <div className="mt-4 flex justify-end">
                 <button onClick={() => { handleLogInteraction(selectedCustomer.id); setIsDetailViewOpen(false); }} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center">
                    <PlusCircleIcon className="w-5 h-5 mr-2" /> Add New Interaction
                </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CrmPage;