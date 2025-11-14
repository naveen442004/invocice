
import React from 'react';
import type { LedgerEntry, Stats } from '../types';

interface PreviewPanelProps {
    entries: LedgerEntry[];
    stats: Stats;
    onDownload: () => void;
    onReset: () => void;
}

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="bg-background border border-border rounded-lg p-4">
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="text-2xl font-semibold text-primary">{value}</p>
    </div>
);


export const PreviewPanel: React.FC<PreviewPanelProps> = ({ entries, stats, onDownload, onReset }) => {
    const previewEntries = entries.slice(0, 50);

    return (
        <div className="bg-surface rounded-lg border border-border shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-semibold text-text">Step 3: Preview & Download</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total Vouchers" value={stats.totalVouchers} />
                <StatCard label="Total Ledger Entries" value={stats.totalEntries} />
                <StatCard label="Total Amount" value={stats.totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} />
            </div>
            
            <div>
                 <h3 className="text-md font-semibold text-text mb-4">Ledger Preview</h3>
                 <div className="overflow-x-auto border border-border rounded-lg max-h-96">
                    <table className="min-w-full divide-y divide-border text-sm">
                        <thead className="bg-background sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-2 text-left font-medium text-text-secondary">Voucher Date</th>
                                <th scope="col" className="px-4 py-2 text-left font-medium text-text-secondary">Type</th>
                                <th scope="col" className="px-4 py-2 text-left font-medium text-text-secondary">Voucher No.</th>
                                <th scope="col" className="px-4 py-2 text-left font-medium text-text-secondary">Ledger Name</th>
                                <th scope="col" className="px-4 py-2 text-right font-medium text-text-secondary">Amount</th>
                                <th scope="col" className="px-4 py-2 text-left font-medium text-text-secondary">Dr/Cr</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-surface">
                            {previewEntries.map((entry, index) => (
                                <tr key={index} className="hover:bg-background">
                                    <td className="px-4 py-2 whitespace-nowrap">{entry.voucherDate}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{entry.voucherTypeName}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{entry.voucherNumber}</td>
                                    <td className="px-4 py-2 font-medium text-text">{entry.ledgerName}</td>
                                    <td className="px-4 py-2 text-right whitespace-nowrap">{entry.ledgerAmount}</td>
                                    <td className={`px-4 py-2 whitespace-nowrap font-semibold ${entry.ledgerAmountDrCr === 'Dr' ? 'text-error' : 'text-success'}`}>{entry.ledgerAmountDrCr}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
                 {entries.length > previewEntries.length && (
                    <p className="text-center text-sm text-text-secondary mt-2">... and {entries.length - previewEntries.length} more entries.</p>
                 )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border">
                <button
                    onClick={onDownload}
                    className="w-full sm:w-auto flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                    Download Ledger Excel
                </button>
                 <button
                    onClick={onReset}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-border text-base font-medium rounded-md text-text bg-surface hover:bg-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                    Start Over
                </button>
            </div>
        </div>
    );
};
