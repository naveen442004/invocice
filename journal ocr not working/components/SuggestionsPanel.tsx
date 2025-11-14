
import React from 'react';
import type { NameMappingResult } from '../types';

interface SuggestionsPanelProps {
  result: NameMappingResult;
}

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ result }) => {
  const hasCorrections = Object.keys(result.corrections).length > 0;
  const hasNewLedgers = result.newLedgers.length > 0;

  if (!hasCorrections && !hasNewLedgers) {
    return null;
  }

  return (
    <div className="bg-primary/5 rounded-lg border border-primary/20 shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
        <h3 className="text-lg font-semibold text-primary">AI Suggestions Based on Chart of Accounts</h3>
      </div>
      
      {hasCorrections && (
        <div>
          <h4 className="font-semibold text-text mb-2">Party Name Corrections</h4>
          <div className="overflow-x-auto border border-border rounded-lg max-h-60">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-text-secondary">Original Name in File</th>
                  <th className="px-4 py-2 text-left font-medium text-text-secondary">Corrected To (from Chart of Accounts)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {Object.entries(result.corrections).map(([original, corrected]) => (
                  <tr key={original}>
                    <td className="px-4 py-2 text-error/80">{original}</td>
                    <td className="px-4 py-2 text-success font-medium">{corrected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasNewLedgers && (
        <div>
          <h4 className="font-semibold text-text mb-2">New Ledgers to Create</h4>
           <div className="overflow-x-auto border border-border rounded-lg max-h-60">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-text-secondary">Ledger Name</th>
                  <th className="px-4 py-2 text-left font-medium text-text-secondary">Suggested Group</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {result.newLedgers.map((ledger) => (
                  <tr key={ledger.name}>
                    <td className="px-4 py-2 font-medium">{ledger.name}</td>
                    <td className="px-4 py-2">{ledger.group}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
