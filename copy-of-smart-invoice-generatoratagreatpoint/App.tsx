
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import CompanySelect from './components/CompanySelect';
import InvoiceForm from './components/InvoiceForm';
import { User, Company } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    const loggedInUser = sessionStorage.getItem('user');
    const selectedCompany = sessionStorage.getItem('company');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
    if (selectedCompany) {
      setCompany(JSON.parse(selectedCompany));
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    sessionStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleCompanySelect = (selectedCompany: Company) => {
    sessionStorage.setItem('company', JSON.stringify(selectedCompany));
    setCompany(selectedCompany);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setUser(null);
    setCompany(null);
  };
  
  const handleChangeCompany = () => {
    sessionStorage.removeItem('company');
    setCompany(null);
  }

  const renderContent = () => {
    if (!user) {
      return <Login onLoginSuccess={handleLogin} />;
    }
    if (!company) {
      return <CompanySelect user={user} onCompanySelect={handleCompanySelect} />;
    }
    return <InvoiceForm company={company} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">Smart Invoice Generator</h1>
            {user && company && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-semibold">{company.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                 <button onClick={handleChangeCompany} className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">Change Company</button>
                <button onClick={handleLogout} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
      <footer className="text-center py-4 text-sm text-gray-500">
        <p>&copy; 2024 Smart Invoice Generator. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default App;
