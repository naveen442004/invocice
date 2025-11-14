
import React, { useState, useEffect, useCallback } from 'react';
import { getCompanies, createCompany } from '../services/apiService';
import { User, Company, indianStates } from '../types';

interface Props {
  user: User;
  onCompanySelect: (company: Company) => void;
}

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const CompanySelect: React.FC<Props> = ({ user, onCompanySelect }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', gstin: '', state: 'Maharashtra' });
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getCompanies(user.email);
    if (result.success && result.data) {
      setCompanies(result.data);
      if(result.data.length === 0) {
        setShowCreateForm(true);
      }
    } else {
      setError(result.message || 'Could not fetch companies.');
    }
    setIsLoading(false);
  }, [user.email]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const result = await createCompany({
      userEmail: user.email,
      companyName: newCompany.name,
      companyGstin: newCompany.gstin,
      companyState: newCompany.state,
    });
    if (result.success && result.data) {
      onCompanySelect(result.data);
    } else {
      setError(result.message || 'Failed to create company.');
      setIsLoading(false);
    }
  };

  if (isLoading && companies.length === 0 && !error) {
    return <div className="text-center p-10">Loading companies...</div>;
  }
  
  const states = Object.values(indianStates).sort();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Select or Create a Company</h2>
        {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 flex justify-between items-center">
                <span>{error}</span>
                <button onClick={fetchCompanies} className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600">Retry</button>
            </div>
        )}

        {!showCreateForm && !error && (
          <div className="space-y-4">
            <ul className="space-y-3">
              {companies.map(company => (
                <li key={company.id}>
                  <button onClick={() => onCompanySelect(company)} className="w-full text-left p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-200 rounded-lg transition-colors">
                    <p className="font-semibold text-lg text-indigo-700">{company.name}</p>
                    <p className="text-sm text-gray-600">{company.gstin} - {company.state}</p>
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={() => setShowCreateForm(true)} className="mt-4 flex items-center justify-center w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">
                <PlusIcon /> Create New Company
            </button>
          </div>
        )}

        {showCreateForm && (
          <form onSubmit={handleCreateCompany} className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700">{companies.length > 0 ? 'Create a New Company' : 'Create Your First Company'}</h3>
             <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
              <input type="text" id="companyName" value={newCompany.name} onChange={e => setNewCompany({...newCompany, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
              <label htmlFor="companyGstin" className="block text-sm font-medium text-gray-700">Company GSTIN</label>
              <input type="text" id="companyGstin" value={newCompany.gstin} onChange={e => setNewCompany({...newCompany, gstin: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" maxLength={15} required />
            </div>
             <div>
              <label htmlFor="companyState" className="block text-sm font-medium text-gray-700">State</label>
              <select id="companyState" value={newCompany.state} onChange={e => setNewCompany({...newCompany, state: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required>
                {states.map(state => <option key={state} value={state}>{state}</option>)}
              </select>
            </div>
            <div className="flex items-center space-x-4 pt-2">
              <button type="submit" disabled={isLoading} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300">
                {isLoading ? 'Creating...' : 'Create & Continue'}
              </button>
              {companies.length > 0 && !error && (
                <button type="button" onClick={() => setShowCreateForm(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CompanySelect;
