
import React, { useState, useCallback } from 'react';
import type { Status, AppMode, LedgerAccount, PdfDocumentType } from './types';
import { ExcelProcessor } from './components/ExcelProcessor';
import { PdfProcessor } from './components/PdfProcessor';
import { ChartOfAccountsManager } from './components/ChartOfAccountsManager';

const App: React.FC = () => {
  const [status, setStatus] = useState<Status>({ message: '', type: 'info' });
  const [appMode, setAppMode] = useState<AppMode>('excel');
  const [chartOfAccounts, setChartOfAccounts] = useState<LedgerAccount[]>([]);

  const showStatus = useCallback((message: string, type: Status['type']) => {
    setStatus({ message, type });
    const timer = setTimeout(() => setStatus(prev => prev.message === message ? { message: '', type: 'info' } : prev), 5000);
    return () => clearTimeout(timer);
  }, []);
  
  const handleChartOfAccountsLoad = useCallback((accounts: LedgerAccount[]) => {
    setChartOfAccounts(accounts);
    showStatus(`Successfully loaded ${accounts.length} ledgers from your Chart of Accounts.`, 'success');
  }, [showStatus]);

  const handleChartOfAccountsClear = useCallback(() => {
    setChartOfAccounts([]);
  }, []);
  
  const renderContent = () => {
    switch(appMode) {
      case 'excel':
        return <ExcelProcessor showStatus={showStatus} chartOfAccounts={chartOfAccounts} />;
      case 'bankStatement':
        return <PdfProcessor showStatus={showStatus} chartOfAccounts={chartOfAccounts} documentTypeForced="Bank Statement" />;
      case 'salesInvoice':
        return <PdfProcessor showStatus={showStatus} chartOfAccounts={chartOfAccounts} documentTypeForced="Sales Invoice" />;
      case 'purchaseInvoice':
        return <PdfProcessor showStatus={showStatus} chartOfAccounts={chartOfAccounts} documentTypeForced="Purchase Invoice" />;
      case 'journalVoucher':
        return <PdfProcessor showStatus={showStatus} chartOfAccounts={chartOfAccounts} documentTypeForced="Journal" />;
      default:
        return null;
    }
  }
  
  const importOptions: { mode: AppMode, label: string, description: string }[] = [
    { mode: 'excel', label: 'Excel Import', description: 'Convert flat files into ledger format.' },
    { mode: 'bankStatement', label: 'Bank Statement Import', description: 'Extract receipts & payments.' },
    { mode: 'salesInvoice', label: 'Sales Invoice Import', description: 'Extract data from sales bills.' },
    { mode: 'purchaseInvoice', label: 'Purchase Invoice Import', description: 'Extract data from purchase bills.' },
    { mode: 'journalVoucher', label: 'Journal Voucher Import', description: 'Extract from journal documents.' },
  ];

  return (
    <div className="min-h-screen bg-background text-text p-4 sm:p-6 lg:p-8">
      <main className="max-w-6xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-text">GST Voucher Converter Pro</h1>
          <p className="mt-2 text-md text-text-secondary">
            Select your import method below to get started.
          </p>
        </header>

        {/* Mode Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {importOptions.map(opt => (
            <button
              key={opt.mode}
              onClick={() => setAppMode(opt.mode)}
              className={`p-6 text-left rounded-lg border-2 transition-all duration-200 ${
                appMode === opt.mode
                  ? 'border-primary bg-primary/5 shadow-lg scale-105'
                  : 'border-border bg-surface hover:border-primary/70 hover:shadow-md'
              }`}
            >
              <h3 className="font-semibold text-lg text-text">{opt.label}</h3>
              <p className="text-sm text-text-secondary mt-1">{opt.description}</p>
            </button>
          ))}
        </div>


        {status.message && (
          <div className={`p-4 rounded-md text-sm transition-opacity duration-300 ${status.message ? 'opacity-100' : 'opacity-0'} ${
              status.type === 'success' ? 'bg-success/10 text-success border border-success/20' :
              status.type === 'error' ? 'bg-error/10 text-error border border-error/20' :
              'bg-primary/10 text-primary border border-primary/20'
            }`} role="alert">
            {status.message}
          </div>
        )}

        <ChartOfAccountsManager
          onChartOfAccountsLoad={handleChartOfAccountsLoad}
          onChartOfAccountsClear={handleChartOfAccountsClear}
          loadedAccountsCount={chartOfAccounts.length}
        />

        {renderContent()}

      </main>
    </div>
  );
};

export default App;
