import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { InvoiceData, InvoiceItem, AncillaryExpense, PartyDetails, CalculatedAmounts, LedgerEntry, Company, indianStates } from '../types';
import { saveInvoice, fetchInvoice } from '../services/apiService';
import { getDetailsFromGstin } from '../services/gstService';
import InvoiceItemRow from './InvoiceItemRow';
import ExpenseLedgerRow from './ExpenseLedgerRow';
import InvoiceSummary from './InvoiceSummary';

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const initialPartyDetails: PartyDetails = { name: '', gstin: '', address: '', state: '', pincode: '', country: 'India' };
const initialInvoiceState: InvoiceData = {
  voucherDate: new Date().toISOString().split('T')[0].split('-').reverse().join('/'),
  voucherNumber: '',
  buyer: { ...initialPartyDetails },
  consignee: { ...initialPartyDetails },
  isConsigneeSameAsBuyer: true,
  placeOfSupply: '',
  items: [{ id: Date.now().toString(), name: '', hsn: '', quantity: 1, rate: 0, per: 'pcs', discountPercent: 0, gstRate: 18 }],
  expenses: [],
};

interface InvoiceFormProps {
  company: Company;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ company }) => {
    const [invoice, setInvoice] = useState<InvoiceData>(initialInvoiceState);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const showNotification = useCallback((type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    }, []);

    // GSTIN handling for Buyer
    const buyerGstinDetails = useMemo(() => {
        if (invoice.buyer.gstin.length !== 15) return null;
        try {
            return getDetailsFromGstin(invoice.buyer.gstin);
        } catch {
            return null;
        }
    }, [invoice.buyer.gstin]);

    useEffect(() => {
        if (buyerGstinDetails) {
            setInvoice(prev => {
                const updatedBuyer = { ...prev.buyer, ...buyerGstinDetails };
                return {
                    ...prev,
                    buyer: updatedBuyer,
                    consignee: prev.isConsigneeSameAsBuyer ? updatedBuyer : prev.consignee,
                };
            });
        } else if (invoice.buyer.gstin.length === 15) {
            showNotification('error', 'Invalid Buyer GSTIN: State code could not be determined.');
        }
    }, [buyerGstinDetails, invoice.buyer.gstin.length, showNotification]);

    // GSTIN handling for Consignee
    const consigneeGstinDetails = useMemo(() => {
        if (invoice.consignee.gstin.length !== 15) return null;
        try {
            return getDetailsFromGstin(invoice.consignee.gstin);
        } catch {
            return null;
        }
    }, [invoice.consignee.gstin]);

    useEffect(() => {
        if (consigneeGstinDetails && !invoice.isConsigneeSameAsBuyer) {
            setInvoice(prev => ({
                ...prev,
                consignee: { ...prev.consignee, ...consigneeGstinDetails },
            }));
        } else if (invoice.consignee.gstin.length === 15 && !invoice.isConsigneeSameAsBuyer) {
            showNotification('error', 'Invalid Consignee GSTIN: State code could not be determined.');
        }
    }, [consigneeGstinDetails, invoice.consignee.gstin.length, invoice.isConsigneeSameAsBuyer, showNotification]);
    
    // Smart Sync for Place of Supply with Consignee's state
    const prevConsigneeState = useRef<string | undefined>();
    useEffect(() => {
        // This effect syncs Place of Supply with Consignee State, but only if the user hasn't manually changed it.
        // We infer a manual change if Place of Supply doesn't match the *previous* consignee state.
        if (invoice.placeOfSupply === prevConsigneeState.current || invoice.placeOfSupply === '') {
             setInvoice(prev => ({
                ...prev,
                placeOfSupply: prev.consignee.state,
            }));
        }
        // Update the ref to the current state for the next render cycle.
        prevConsigneeState.current = invoice.consignee.state;
    }, [invoice.consignee.state]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');
        
        if (keys.length === 2) {
            const [party, field] = keys as ['buyer' | 'consignee', keyof PartyDetails];
            setInvoice(prev => {
                if (party === 'buyer') {
                    const updatedBuyer = { ...prev.buyer, [field]: value };
                    return {
                        ...prev,
                        buyer: updatedBuyer,
                        consignee: prev.isConsigneeSameAsBuyer ? updatedBuyer : prev.consignee,
                    };
                }
                if (party === 'consignee' && !prev.isConsigneeSameAsBuyer) {
                    const updatedConsignee = { ...prev.consignee, [field]: value };
                    return { ...prev, consignee: updatedConsignee };
                }
                return prev;
            });
        } else {
            setInvoice(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSameAsBuyerToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setInvoice(prev => ({
            ...prev,
            isConsigneeSameAsBuyer: isChecked,
            consignee: isChecked ? prev.buyer : { ...initialPartyDetails },
        }));
    };

    const addItem = () => {
        setInvoice(prev => ({
            ...prev,
            items: [...prev.items, { id: Date.now().toString(), name: '', hsn: '', quantity: 1, rate: 0, per: 'pcs', discountPercent: 0, gstRate: 18 }]
        }));
    };

    const updateItem = (id: string, updatedItem: InvoiceItem) => {
        setInvoice(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === id ? updatedItem : item)
        }));
    };

    const removeItem = (id: string) => {
        setInvoice(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
    };

    const addExpense = () => {
        setInvoice(prev => ({
            ...prev,
            expenses: [...prev.expenses, { id: Date.now().toString(), name: '', amount: 0, gstRate: 18 }]
        }));
    };

    const updateExpense = (id: string, updatedExpense: AncillaryExpense) => {
        setInvoice(prev => ({
            ...prev,
            expenses: prev.expenses.map(exp => exp.id === id ? updatedExpense : exp)
        }));
    };

    const removeExpense = (id: string) => {
        setInvoice(prev => ({ ...prev, expenses: prev.expenses.filter(exp => exp.id !== id) }));
    };

    const calculatedAmounts: CalculatedAmounts = useMemo(() => {
        let subTotal = 0, totalDiscount = 0, totalGst = 0, expenseTotal = 0;

        invoice.items.forEach(item => {
            const itemAmount = item.quantity * item.rate;
            const discountAmount = itemAmount * (item.discountPercent / 100);
            const taxableItemValue = itemAmount - discountAmount;
            
            subTotal += itemAmount;
            totalDiscount += discountAmount;
            totalGst += taxableItemValue * (item.gstRate / 100);
        });

        invoice.expenses.forEach(expense => {
            expenseTotal += expense.amount;
            totalGst += expense.amount * (expense.gstRate / 100);
        });

        const taxableValue = subTotal - totalDiscount + expenseTotal;
        const grandTotal = taxableValue + totalGst;
        const isIntraState = company.state && invoice.placeOfSupply && company.state.toLowerCase() === invoice.placeOfSupply.toLowerCase();
        
        return {
            subTotal, totalDiscount, expenseTotal, taxableValue, totalGst, grandTotal,
            cgst: isIntraState ? totalGst / 2 : 0,
            sgst: isIntraState ? totalGst / 2 : 0,
            igst: !isIntraState ? totalGst : 0,
        };
    }, [invoice.items, invoice.expenses, invoice.placeOfSupply, company.state]);

    const ledgerEntries: LedgerEntry[] = useMemo(() => {
        const entries: LedgerEntry[] = [];
        const { grandTotal, subTotal, totalDiscount, cgst, sgst, igst } = calculatedAmounts;

        if (grandTotal > 0) entries.push({ name: invoice.buyer.name || 'Buyer', amount: grandTotal, type: 'Dr' });
        const salesAmount = subTotal - totalDiscount;
        if (salesAmount > 0) entries.push({ name: 'Sales', amount: salesAmount, type: 'Cr' });
        if (totalDiscount > 0) entries.push({ name: 'Discount on Sales', amount: totalDiscount, type: 'Dr' });
        invoice.expenses.forEach(exp => {
            if(exp.amount > 0) entries.push({ name: exp.name, amount: exp.amount, type: 'Cr' });
        });
        if (cgst > 0) entries.push({ name: 'CGST', amount: cgst, type: 'Cr' });
        if (sgst > 0) entries.push({ name: 'SGST', amount: sgst, type: 'Cr' });
        if (igst > 0) entries.push({ name: 'IGST', amount: igst, type: 'Cr' });
        
        return entries;
    }, [calculatedAmounts, invoice.buyer.name, invoice.expenses]);
    
    const handleSave = async () => {
        setIsLoading(true);
        const result = await saveInvoice(invoice, company);
        setIsLoading(false);
        showNotification(result.success ? 'success' : 'error', result.message);
        if(result.success) {
            setInvoice(initialInvoiceState);
        }
    };
    
    const handleFetch = async () => {
        if (!invoice.voucherNumber) {
            showNotification('error', 'Please enter a Voucher Number to fetch.');
            return;
        }
        setIsLoading(true);
        const result = await fetchInvoice(invoice.voucherNumber);
        setIsLoading(false);
        if (result.success && result.data) {
            setInvoice(result.data);
            showNotification('success', 'Invoice data loaded successfully.');
        } else {
            showNotification('error', result.message || 'Failed to fetch invoice.');
        }
    };

    return (
        <div className="space-y-8">
            {notification && (
                <div className={`p-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {notification.message}
                </div>
            )}
            
            {/* Invoice Header */}
            <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Invoice Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" name="voucherDate" value={invoice.voucherDate} onChange={handleInputChange} placeholder="Voucher Date (DD/MM/YYYY)" className="p-2 border rounded-md" />
                    <input type="text" value="Sales" readOnly className="p-2 border rounded-md bg-gray-100" />
                    <div className="flex">
                        <input type="text" name="voucherNumber" value={invoice.voucherNumber} onChange={handleInputChange} placeholder="Voucher Number" className="p-2 border rounded-l-md flex-grow" />
                        <button onClick={handleFetch} disabled={isLoading} className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 disabled:bg-blue-300">Fetch</button>
                    </div>
                </div>
            </div>

            {/* Party Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-white rounded-lg shadow space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700">Buyer Details</h2>
                    <input type="text" name="buyer.name" value={invoice.buyer.name} onChange={handleInputChange} placeholder="Buyer Name" className="w-full p-2 border rounded-md" />
                    <input type="text" name="buyer.gstin" value={invoice.buyer.gstin} onChange={handleInputChange} placeholder="Buyer GSTIN (15 characters)" className="w-full p-2 border rounded-md" maxLength={15} />
                    <input type="text" name="buyer.address" value={invoice.buyer.address} onChange={handleInputChange} placeholder="Buyer Address" className="w-full p-2 border rounded-md" />
                    <div className="grid grid-cols-2 gap-4">
                        {buyerGstinDetails ? (
                            <input 
                                type="text" 
                                name="buyer.state" 
                                value={invoice.buyer.state} 
                                readOnly 
                                placeholder="State (from GSTIN)" 
                                className="p-2 border rounded-md bg-gray-100" 
                            />
                        ) : (
                            <select
                                name="buyer.state"
                                value={invoice.buyer.state}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="">Select State</option>
                                {Object.values(indianStates).sort().map(stateName => (
                                    <option key={stateName} value={stateName}>{stateName}</option>
                                ))}
                            </select>
                        )}
                        <input type="text" name="buyer.pincode" value={invoice.buyer.pincode} onChange={handleInputChange} placeholder="Pincode" className="p-2 border rounded-md" />
                    </div>
                    <input type="text" name="buyer.country" value={invoice.buyer.country} readOnly className="w-full p-2 border rounded-md bg-gray-100" />
                </div>
                
                <div className="p-6 bg-white rounded-lg shadow space-y-4">
                    <div className="flex items-center justify-between">
                         <h2 className="text-xl font-semibold text-gray-700">Shipping Details</h2>
                         <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={invoice.isConsigneeSameAsBuyer} onChange={handleSameAsBuyerToggle} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-sm text-gray-600">Same as Buyer</span>
                        </label>
                    </div>

                    <input type="text" name="consignee.name" value={invoice.consignee.name} onChange={handleInputChange} disabled={invoice.isConsigneeSameAsBuyer} placeholder="Consignee Name" className="w-full p-2 border rounded-md disabled:bg-gray-100" />
                    <input type="text" name="consignee.gstin" value={invoice.consignee.gstin} onChange={handleInputChange} disabled={invoice.isConsigneeSameAsBuyer} placeholder="Consignee GSTIN (15 characters)" className="w-full p-2 border rounded-md disabled:bg-gray-100" maxLength={15} />
                    <input type="text" name="consignee.address" value={invoice.consignee.address} onChange={handleInputChange} disabled={invoice.isConsigneeSameAsBuyer} placeholder="Consignee Address" className="w-full p-2 border rounded-md disabled:bg-gray-100" />
                    <div className="grid grid-cols-2 gap-4">
                        {consigneeGstinDetails && !invoice.isConsigneeSameAsBuyer ? (
                            <input type="text" name="consignee.state" value={invoice.consignee.state} readOnly placeholder="State (from GSTIN)" className="p-2 border rounded-md bg-gray-100" />
                        ) : (
                            <select name="consignee.state" value={invoice.consignee.state} onChange={handleInputChange} disabled={invoice.isConsigneeSameAsBuyer} className="w-full p-2 border rounded-md disabled:bg-gray-100">
                                <option value="">Select State</option>
                                {Object.values(indianStates).sort().map(stateName => (
                                    <option key={stateName} value={stateName}>{stateName}</option>
                                ))}
                            </select>
                        )}
                        <input type="text" name="consignee.pincode" value={invoice.consignee.pincode} onChange={handleInputChange} disabled={invoice.isConsigneeSameAsBuyer} placeholder="Pincode" className="p-2 border rounded-md disabled:bg-gray-100" />
                    </div>
                     <input type="text" name="consignee.country" value={invoice.consignee.country} readOnly className="w-full p-2 border rounded-md bg-gray-100" />
                     
                    <div>
                        <label htmlFor="placeOfSupply" className="block text-sm font-medium text-gray-700">Place of Supply</label>
                        <select
                            id="placeOfSupply"
                            name="placeOfSupply"
                            value={invoice.placeOfSupply}
                            onChange={handleInputChange}
                            className="mt-1 w-full p-2 border rounded-md bg-white focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Select Place of Supply</option>
                            {Object.values(indianStates).sort().map(stateName => (
                                <option key={stateName} value={stateName}>{stateName}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="p-6 bg-white rounded-lg shadow">
                 <h2 className="text-xl font-semibold mb-4 text-gray-700">Items</h2>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN/SAC</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Per</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disc %</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST %</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="relative px-3 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoice.items.map(item => (
                                <InvoiceItemRow key={item.id} item={item} onUpdate={updateItem} onRemove={removeItem} />
                            ))}
                        </tbody>
                    </table>
                </div>
                <button onClick={addItem} className="mt-4 flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                    <PlusIcon />
                    <span>Add Item</span>
                </button>
            </div>
            
            {/* Expenses & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-white rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Ancillary Expenses</h2>
                    <div className="space-y-2">
                        {invoice.expenses.map(expense => (
                            <ExpenseLedgerRow key={expense.id} expense={expense} onUpdate={updateExpense} onRemove={removeExpense} />
                        ))}
                    </div>
                    <button onClick={addExpense} className="mt-4 flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        <PlusIcon />
                        <span>Add Expense</span>
                    </button>
                </div>
                
                <InvoiceSummary amounts={calculatedAmounts} ledgerEntries={ledgerEntries} />
            </div>

            <div className="flex justify-end pt-4">
                <button onClick={handleSave} disabled={isLoading} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:bg-green-300">
                    {isLoading ? 'Saving...' : 'Create / Update Invoice'}
                </button>
            </div>
        </div>
    );
};

export default InvoiceForm;