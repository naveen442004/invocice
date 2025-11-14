
import React, { useMemo } from 'react';
import { InvoiceItem } from '../types';

interface Props {
  item: InvoiceItem;
  onUpdate: (id: string, updatedItem: InvoiceItem) => void;
  onRemove: (id: string) => void;
}

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

const InvoiceItemRow: React.FC<Props> = ({ item, onUpdate, onRemove }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdate(item.id, { ...item, [name]: name === 'quantity' || name === 'rate' || name === 'discountPercent' || name === 'gstRate' ? parseFloat(value) || 0 : value });
  };
  
  const itemAmount = useMemo(() => item.quantity * item.rate, [item.quantity, item.rate]);

  return (
    <tr>
      <td className="px-3 py-2 whitespace-nowrap"><input type="text" name="name" value={item.name} onChange={handleChange} className="w-full p-1 border rounded" placeholder="Item Name"/></td>
      <td className="px-3 py-2 whitespace-nowrap"><input type="text" name="hsn" value={item.hsn} onChange={handleChange} className="w-20 p-1 border rounded" placeholder="HSN"/></td>
      <td className="px-3 py-2 whitespace-nowrap"><input type="number" name="quantity" value={item.quantity} onChange={handleChange} className="w-20 p-1 border rounded" placeholder="Qty"/></td>
      <td className="px-3 py-2 whitespace-nowrap"><input type="number" name="rate" value={item.rate} onChange={handleChange} className="w-24 p-1 border rounded" placeholder="Rate"/></td>
      <td className="px-3 py-2 whitespace-nowrap"><input type="text" name="per" value={item.per} onChange={handleChange} className="w-16 p-1 border rounded" placeholder="Unit"/></td>
      <td className="px-3 py-2 whitespace-nowrap"><input type="number" name="discountPercent" value={item.discountPercent} onChange={handleChange} className="w-16 p-1 border rounded" placeholder="Disc %"/></td>
      <td className="px-3 py-2 whitespace-nowrap"><input type="number" name="gstRate" value={item.gstRate} onChange={handleChange} className="w-16 p-1 border rounded" placeholder="GST %"/></td>
      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">{itemAmount.toFixed(2)}</td>
      <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
        <button onClick={() => onRemove(item.id)} className="text-red-600 hover:text-red-900"><TrashIcon /></button>
      </td>
    </tr>
  );
};

export default InvoiceItemRow;
