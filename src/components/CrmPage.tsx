import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import { Customer, CoffeeOrigin, CustomerStatus, Certification, Interaction } from '../types';
import Modal from './common/Modal';
import { COFFEE_ORIGINS_OPTIONS, CUSTOMER_STATUS_OPTIONS, CERTIFICATION_OPTIONS, INTERACTION_TYPE_OPTIONS, PlusCircleIcon, PencilIcon, EyeIcon, UsersIcon } from '../constants';

const CrmPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentCustomerForInteraction, setCurrentCustomerForInteraction] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase.from('customers').select('*');
    if (!error && data) {
      setCustomers(data);
    } else {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSaveCustomer = async (customer: Omit<Customer, 'id'> | Customer) => {
    if ('id' in customer) {
      await supabase.from('customers').update(customer).eq('id', customer.id);
    } else {
      await supabase.from('customers').insert(customer);
    }
    setIsModalOpen(false);
    fetchCustomers();
  };

  const handleAddNewCustomer = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleLogInteraction = (customerId: string) => {
    setCurrentCustomerForInteraction(customerId);
    setIsInteractionModalOpen(true);
  };

  const handleSaveInteraction = async (interaction: Omit<Interaction, 'id'>) => {
    await supabase.from('interactions').insert(interaction);
    setIsInteractionModalOpen(false);
    fetchCustomers();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <UsersIcon className="w-8 h-8 mr-2" /> CRM Dashboard
      </h1>
      <button onClick={handleAddNewCustomer} className="bg-primary text-white px-4 py-2 rounded-md mb-4">
        <PlusCircleIcon className="w-5 h-5 inline mr-2" /> Add Customer
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <div key={customer.id} className="p-4 bg-white rounded-md shadow">
            <h2 className="text-xl font-semibold mb-1">{customer.companyName}</h2>
            <p className="text-sm">{customer.contactPerson} | {customer.email}</p>
            <div className="mt-3 space-x-2">
              <button onClick={() => handleEditCustomer(customer)} className="text-blue-600">
                <PencilIcon className="w-4 h-4 inline" /> Edit
              </button>
              <button onClick={() => handleLogInteraction(customer.id)} className="text-green-600">
                <PlusCircleIcon className="w-4 h-4 inline" /> Log Interaction
              </button>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedCustomer ? 'Edit Customer' : 'Add Customer'}>
        {/* Your CustomerForm component goes here, pass handleSaveCustomer as onSave */}
      </Modal>
      <Modal isOpen={isInteractionModalOpen} onClose={() => setIsInteractionModalOpen(false)} title="Log Interaction">
        {/* Your InteractionForm component goes here, pass handleSaveInteraction as onSave */}
      </Modal>
    </div>
  );
};

export default CrmPage;
