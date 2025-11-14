
import React from 'react';
import type { VoucherType, AppConfigs, SalesPurchaseLineItemConfig, JournalLineItemConfig, BankStatementConfig } from '../types';
import { BASE_FIELD_DEFINITIONS } from '../constants';

interface ConfigPanelProps {
    headers: string[];
    voucherType: VoucherType;
    config: AppConfigs[VoucherType];
    onConfigChange: (newConfig: AppConfigs[VoucherType]) => void;
    onAutoMap: () => void;
    isAiMapping: boolean;
}

const AILoadingIcon = () => (
    <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);

const AISparkleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
);

const BaseFieldsMapper: React.FC<{
    baseFields: typeof BASE_FIELD_DEFINITIONS[VoucherType];
    config: AppConfigs[VoucherType];
    headers: string[];
    onFieldChange: (key: string, value: string) => void;
}> = ({ baseFields, config, headers, onFieldChange }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {baseFields.map(field => (
            <div key={field.key}>
                <label className="block text-sm font-medium text-text-secondary mb-1">{field.label} {!field.optional && <span className="text-error">*</span>}</label>
                <select
                    value={(config as any)[field.key] || ''}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    className="w-full bg-surface border border-border rounded-md shadow-sm px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                >
                    <option value="">-- Select Column --</option>
                    {headers.map(header => <option key={header} value={header}>{header}</option>)}
                </select>
            </div>
        ))}
    </div>
);

const SalesPurchaseLineItemMapper: React.FC<{
    title: string;
    items: SalesPurchaseLineItemConfig[];
    headers: string[];
    onItemChange: (id: string, field: 'column' | 'ledgerName', value: string) => void;
    onItemAdd: () => void;
    onItemRemove: (id: string) => void;
}> = ({ title, items, headers, onItemChange, onItemAdd, onItemRemove }) => (
    <div className="border-t border-border pt-6">
        <h3 className="text-md font-semibold text-text mb-4">{title}</h3>
        <div className="space-y-3">
            {items.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-3 p-3 bg-background rounded-md border border-border">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Amount Column from Excel</label>
                        <select value={item.column || ''} onChange={(e) => onItemChange(item.id, 'column', e.target.value)} className="w-full bg-surface border-border border rounded-md shadow-sm px-3 py-2 text-sm focus:ring-primary focus:border-primary">
                            <option value="">-- Select Column --</option>
                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Ledger Name for Accounting</label>
                        <input type="text" value={item.ledgerName} onChange={(e) => onItemChange(item.id, 'ledgerName', e.target.value)} className="w-full bg-surface border-border border rounded-md shadow-sm px-3 py-2 text-sm focus:ring-primary focus:border-primary" placeholder="e.g., Sales, Output CGST" />
                    </div>
                    <div className="flex items-end">
                        <button onClick={() => onItemRemove(item.id)} className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-md transition-colors" title="Remove Item">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
        <button onClick={onItemAdd} className="mt-4 flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Add Line Item
        </button>
    </div>
);

const JournalLineItemMapper: React.FC<{
    title: string;
    items: JournalLineItemConfig[];
    headers: string[];
    onItemChange: (id: string, field: 'amountColumn' | 'ledgerNameColumn', value: string) => void;
    onItemAdd: () => void;
    onItemRemove: (id: string) => void;
}> = ({ title, items, headers, onItemChange, onItemAdd, onItemRemove }) => (
    <div className="border-t border-border pt-6">
        <h3 className="text-md font-semibold text-text mb-4">{title}</h3>
        <div className="space-y-3">
            {items.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-3 p-3 bg-background rounded-md border border-border">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Amount Column</label>
                        <select value={item.amountColumn || ''} onChange={(e) => onItemChange(item.id, 'amountColumn', e.target.value)} className="w-full bg-surface border-border border rounded-md shadow-sm px-3 py-2 text-sm focus:ring-primary focus:border-primary">
                            <option value="">-- Select Column --</option>
                            {headers.map(h => <option key={`amt-${h}`} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Ledger Name Column</label>
                        <select value={item.ledgerNameColumn || ''} onChange={(e) => onItemChange(item.id, 'ledgerNameColumn', e.target.value)} className="w-full bg-surface border-border border rounded-md shadow-sm px-3 py-2 text-sm focus:ring-primary focus:border-primary">
                            <option value="">-- Select Column --</option>
                            {headers.map(h => <option key={`ledger-${h}`} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={() => onItemRemove(item.id)} className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-md transition-colors" title="Remove Item">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
        <button onClick={onItemAdd} className="mt-4 flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Add Entry
        </button>
    </div>
);

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
    headers,
    voucherType,
    config,
    onConfigChange,
    onAutoMap,
    isAiMapping
}) => {
    
    const handleBaseFieldChange = (key: string, value: string) => {
        onConfigChange({ ...config, [key]: value || null });
    };

    const baseFields = BASE_FIELD_DEFINITIONS[voucherType];

    const Header = () => (
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-md font-semibold text-text">Map Fields from Your Excel File</h3>
            <button onClick={onAutoMap} disabled={isAiMapping} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isAiMapping ? <AILoadingIcon /> : <AISparkleIcon />}
                <span>{isAiMapping ? 'Mapping...' : 'Auto-map with AI'}</span>
            </button>
        </div>
    );

    if (voucherType === 'Bank Statement') {
        const bsConfig = config as BankStatementConfig;
        return (
            <div className="bg-surface rounded-lg p-6 space-y-6">
                <Header/>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-b border-border pb-6">
                     <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Bank/Cash Ledger Name</label>
                        <input type="text" value={bsConfig.bankLedgerName} onChange={(e) => onConfigChange({...bsConfig, bankLedgerName: e.target.value})} className="w-full bg-surface border border-border rounded-md shadow-sm px-3 py-2 text-sm focus:ring-primary focus:border-primary"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Receipt Voucher Type</label>
                        <input type="text" value={bsConfig.receiptVoucherTypeName} onChange={(e) => onConfigChange({...bsConfig, receiptVoucherTypeName: e.target.value})} className="w-full bg-surface border border-border rounded-md shadow-sm px-3 py-2 text-sm focus:ring-primary focus:border-primary"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Payment Voucher Type</label>
                        <input type="text" value={bsConfig.paymentVoucherTypeName} onChange={(e) => onConfigChange({...bsConfig, paymentVoucherTypeName: e.target.value})} className="w-full bg-surface border border-border rounded-md shadow-sm px-3 py-2 text-sm focus:ring-primary focus:border-primary"/>
                    </div>
                </div>
                <BaseFieldsMapper baseFields={baseFields} config={config} headers={headers} onFieldChange={handleBaseFieldChange} />
            </div>
        )
    }

    if (voucherType === 'Journal') {
        const jConfig = config as AppConfigs['Journal'];
        const createItemHandler = (itemType: 'debitItems' | 'creditItems') => ({
            onChange: (id: string, field: 'amountColumn' | 'ledgerNameColumn', value: string) => {
                const newItems = jConfig[itemType].map(item => item.id === id ? { ...item, [field]: value } : item);
                onConfigChange({ ...jConfig, [itemType]: newItems });
            },
            onAdd: () => {
                const newItem: JournalLineItemConfig = { id: `${itemType.slice(0, 2)}-${Date.now()}`, amountColumn: null, ledgerNameColumn: null };
                onConfigChange({ ...jConfig, [itemType]: [...jConfig[itemType], newItem] });
            },
            onRemove: (id: string) => {
                const newItems = jConfig[itemType].filter(item => item.id !== id);
                onConfigChange({ ...jConfig, [itemType]: newItems });
            },
        });
        const debitHandlers = createItemHandler('debitItems');
        const creditHandlers = createItemHandler('creditItems');

        return (
            <div className="bg-surface rounded-lg p-6 space-y-8">
                <Header />
                <BaseFieldsMapper baseFields={baseFields} config={config} headers={headers} onFieldChange={handleBaseFieldChange} />
                <JournalLineItemMapper title="Debit Entries" items={jConfig.debitItems} headers={headers} onItemChange={debitHandlers.onChange} onItemAdd={debitHandlers.onAdd} onItemRemove={debitHandlers.onRemove} />
                <JournalLineItemMapper title="Credit Entries" items={jConfig.creditItems} headers={headers} onItemChange={creditHandlers.onChange} onItemAdd={creditHandlers.onAdd} onItemRemove={creditHandlers.onRemove} />
            </div>
        )
    }

    // Sales or Purchase
    const spConfig = config as AppConfigs['Sales'];
    const handleLineItemChange = (id: string, field: 'column' | 'ledgerName', value: string) => {
        const newLineItems = spConfig.lineItems.map(item => item.id === id ? { ...item, [field]: value } : item);
        onConfigChange({ ...spConfig, lineItems: newLineItems });
    };
    const addLineItem = () => {
        const newLineItem: SalesPurchaseLineItemConfig = { id: `li-${Date.now()}`, column: null, ledgerName: '' };
        onConfigChange({ ...spConfig, lineItems: [...spConfig.lineItems, newLineItem] });
    };
    const removeLineItem = (id: string) => {
        const newLineItems = spConfig.lineItems.filter(item => item.id !== id);
        onConfigChange({ ...spConfig, lineItems: newLineItems });
    };

    return (
         <div className="bg-surface rounded-lg p-6 space-y-8">
            <Header />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Voucher Type Name</label>
                    <input type="text" value={(config as AppConfigs['Sales']).voucherTypeName} onChange={(e) => onConfigChange({...config, voucherTypeName: e.target.value})} className="w-full bg-surface border border-border rounded-md shadow-sm px-3 py-2 text-sm focus:ring-primary focus:border-primary"/>
                </div>
            </div>
            <BaseFieldsMapper baseFields={baseFields} config={config} headers={headers} onFieldChange={handleBaseFieldChange} />
            <SalesPurchaseLineItemMapper title="Ledger Line Items" items={spConfig.lineItems} headers={headers} onItemChange={handleLineItemChange} onItemAdd={addLineItem} onItemRemove={removeLineItem} />
        </div>
    );
};
