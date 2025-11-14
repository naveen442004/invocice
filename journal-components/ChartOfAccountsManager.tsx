
import React, { useState } from 'react';
import { extractLedgersFromDocument } from '../journal-services/geminiService';
import type { LedgerAccount } from '../journal-types';

interface ChartOfAccountsManagerProps {
  onChartOfAccountsLoad: (accounts: LedgerAccount[]) => void;
  onChartOfAccountsClear: () => void;
  loadedAccountsCount: number;
}

export const ChartOfAccountsManager: React.FC<ChartOfAccountsManagerProps> = ({ onChartOfAccountsLoad, onChartOfAccountsClear, loadedAccountsCount }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setError(null);
    try {
      const accounts = await extractLedgersFromDocument(selectedFile);
      onChartOfAccountsLoad(accounts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to process Chart of Accounts: ${errorMessage}`);
      onChartOfAccountsClear();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setError(null);
    onChartOfAccountsClear();
    const fileInput = document.getElementById('coa-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="bg-surface rounded-lg border-2 border-dashed border-border shadow-sm p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-text">Optional: Upload Chart of Accounts</h2>
          <p className="text-sm text-text-secondary mt-1">Provide a PDF or image of your ledgers to auto-correct party names.</p>
        </div>
        {loadedAccountsCount > 0 && (
          <div className="text-sm text-center ml-4 px-3 py-1.5 bg-success/10 text-success font-medium rounded-full">
            {loadedAccountsCount} ledgers loaded
          </div>
        )}
      </div>

      {loadedAccountsCount > 0 ? (
        <div className="flex items-center justify-between bg-background p-3 rounded-md border border-border">
          <div className="flex items-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-medium text-sm">{file?.name}</span>
          </div>
          <button
            onClick={handleClear}
            className="text-text-secondary hover:text-error transition-colors p-1 rounded-full"
            title="Remove file"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ) : (
        <div
          onClick={() => !isProcessing && document.getElementById('coa-file-input')?.click()}
          className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer transition-colors duration-200 border-border hover:border-primary"
        >
          <input
            id="coa-file-input"
            type="file"
            className="hidden"
            accept=".pdf, .png, .jpg, .jpeg"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
          {isProcessing ? (
             <div className="text-center">
                <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="mt-2 text-sm font-medium text-text">Analyzing Ledgers...</p>
             </div>
          ) : (
            <div className="text-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
               <p className="mt-2 text-sm font-medium text-text">
                 <span className="text-primary">Click to upload</span> or drag and drop
               </p>
               <p className="mt-1 text-xs text-text-secondary">PDF or Image file of your Chart of Accounts</p>
           </div>
          )}
        </div>
      )}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
};
