import React, { useMemo } from 'react';
import { AncillaryExpense } from '../types';

interface Props {
  expense: AncillaryExpense;
  onUpdate: (id: string, updatedExpense: AncillaryExpense) => void;
  onRemove: (id: string) => void;
}

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

const ExpenseLedgerRow: React.FC<Props> = ({ expense, onUpdate, onRemove }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdate(expense.id, { ...expense, [name]: name === 'amount' || name === 'gstRate' ? parseFloat(value) || 0 : value });
  };

  const gstAmount = useMemo(() => (expense.amount * expense.gstRate) / 100, [expense.amount, expense.gstRate]);

  return (
    <div className="flex items-center space-x-2">
      <input type="text" name="name" value={expense.name} onChange={handleChange} placeholder="Expense Name" className="flex-grow p-2 border rounded-md" />
      <input type="number" name="amount" value={expense.amount} onChange={handleChange} placeholder="Amount" className="w-24 p-2 border rounded-md" />
      <input type="number" name="gstRate" value={expense.gstRate} onChange={handleChange} placeholder="GST %" className="w-20 p-2 border rounded-md" />
      <div className="w-28 p-2 text-sm text-gray-600 text-right bg-gray-50 rounded-md border">
        GST: {gstAmount.toFixed(2)}
      </div>
      <button onClick={() => onRemove(expense.id)} className="p-2 text-red-500 hover:text-red-700">
        <TrashIcon />
      </button>
    </div>
  );
};

export default ExpenseLedgerRow;