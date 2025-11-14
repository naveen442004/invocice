import React, { useState } from 'react';
import { InvoiceApp } from './InvoiceApp';
import { JournalApp } from './JournalApp';

type AppView = 'invoice' | 'journal';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('invoice');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">Business Management Suite</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentView('invoice')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentView === 'invoice'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Invoice Generator
              </button>
              <button
                onClick={() => setCurrentView('journal')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentView === 'journal'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Voucher Converter
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {currentView === 'invoice' ? <InvoiceApp /> : <JournalApp />}
      </main>
    </div>
  );
};

export default App;
