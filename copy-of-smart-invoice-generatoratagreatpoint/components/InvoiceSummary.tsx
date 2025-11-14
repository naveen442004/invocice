
import React from 'react';
import { CalculatedAmounts, LedgerEntry } from '../types';

interface Props {
  amounts: CalculatedAmounts;
  ledgerEntries: LedgerEntry[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
};

const InvoiceSummary: React.FC<Props> = ({ amounts, ledgerEntries }) => {
  return (
    <div className="space-y-6">
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Invoice Summary</h2>
            <div className="space-y-2">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span> <span className="font-medium">{formatCurrency(amounts.subTotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Discount:</span> <span className="font-medium text-red-500">{formatCurrency(amounts.totalDiscount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Ancillary Expenses:</span> <span className="font-medium">{formatCurrency(amounts.expenseTotal)}</span></div>
                <hr className="my-2"/>
                <div className="flex justify-between"><span className="text-gray-600">Taxable Value:</span> <span className="font-medium">{formatCurrency(amounts.taxableValue)}</span></div>
                {amounts.cgst > 0 && <div className="flex justify-between"><span className="text-gray-600">CGST:</span> <span className="font-medium">{formatCurrency(amounts.cgst)}</span></div>}
                {amounts.sgst > 0 && <div className="flex justify-between"><span className="text-gray-600">SGST:</span> <span className="font-medium">{formatCurrency(amounts.sgst)}</span></div>}
                {amounts.igst > 0 && <div className="flex justify-between"><span className="text-gray-600">IGST:</span> <span className="font-medium">{formatCurrency(amounts.igst)}</span></div>}
                 <hr className="my-2"/>
                <div className="flex justify-between text-xl font-bold"><span className="text-gray-800">Grand Total:</span> <span className="text-blue-600">{formatCurrency(amounts.grandTotal)}</span></div>
            </div>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Ledger View</h2>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="text-left py-2 font-medium">Ledger Name</th>
                        <th className="text-right py-2 font-medium">Debit (Dr)</th>
                        <th className="text-right py-2 font-medium">Credit (Cr)</th>
                    </tr>
                </thead>
                <tbody>
                    {ledgerEntries.map((entry, index) => (
                        <tr key={index} className="border-b last:border-0">
                            <td className="py-2">{entry.name}</td>
                            <td className="text-right py-2">{entry.type === 'Dr' ? formatCurrency(entry.amount) : ''}</td>
                            <td className="text-right py-2">{entry.type === 'Cr' ? formatCurrency(entry.amount) : ''}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default InvoiceSummary;
