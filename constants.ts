
import type { AppConfigs, VoucherType, FieldDefinition } from './journal-types';

// Provides a default starting configuration for the application state.
export const DEFAULT_CONFIGS: AppConfigs = {
  Sales: {
    voucherTypeName: 'Sales',
    date: null,
    voucherNumber: null,
    partyName: null,
    narration: null,
    lineItems: [
      { id: 'li-1', column: null, ledgerName: 'Sales' },
      { id: 'li-2', column: null, ledgerName: 'Output CGST' },
      { id: 'li-3', column: null, ledgerName: 'Output SGST' },
      { id: 'li-4', column: null, ledgerName: 'Output IGST' },
    ],
  },
  Purchase: {
    voucherTypeName: 'Purchase',
    date: null,
    voucherNumber: null,
    partyName: null,
    narration: null,
    lineItems: [
      { id: 'li-1', column: null, ledgerName: 'Purchases' },
      { id: 'li-2', column: null, ledgerName: 'Input CGST' },
      { id: 'li-3', column: null, ledgerName: 'Input SGST' },
      { id: 'li-4', column: null, ledgerName: 'Input IGST' },
    ],
  },
  Journal: {
    date: null,
    voucherNumber: null,
    narration: null,
    debitItems: [{ id: 'dr-1', amountColumn: null, ledgerNameColumn: null }],
    creditItems: [{ id: 'cr-1', amountColumn: null, ledgerNameColumn: null }],
  },
  'Bank Statement': {
    date: null,
    narration: null,
    partyName: null,
    depositColumn: null,
    withdrawalColumn: null,
    bankLedgerName: 'Bank Account',
    receiptVoucherTypeName: 'Receipt',
    paymentVoucherTypeName: 'Payment',
  },
};

// Defines the core, non-repeating fields for each voucher type.
export const BASE_FIELD_DEFINITIONS: Record<VoucherType, FieldDefinition[]> = {
  Sales: [
    { key: 'date', label: 'Voucher Date' },
    { key: 'voucherNumber', label: 'Voucher Number' },
    { key: 'partyName', label: 'Party Name (Customer)' },
    { key: 'narration', label: 'Narration', optional: true },
  ],
  Purchase: [
    { key: 'date', label: 'Voucher Date' },
    { key: 'voucherNumber', label: 'Voucher Number' },
    { key: 'partyName', label: 'Party Name (Supplier)' },
    { key: 'narration', label: 'Narration', optional: true },
  ],
  Journal: [
    { key: 'date', label: 'Voucher Date' },
    { key: 'voucherNumber', label: 'Voucher Number' },
    { key: 'narration', label: 'Narration', optional: true },
  ],
  'Bank Statement': [
    { key: 'date', label: 'Transaction Date' },
    { key: 'partyName', label: 'Particulars / Description' },
    { key: 'depositColumn', label: 'Deposits (Receipts) Column', optional: true },
    { key: 'withdrawalColumn', label: 'Withdrawals (Payments) Column', optional: true },
    { key: 'narration', label: 'Narration', optional: true },
  ],
};

// Utility function to get the appropriate field definitions for a given voucher type.
export const getFieldsForVoucherType = (voucherType: VoucherType): FieldDefinition[] => {
    return BASE_FIELD_DEFINITIONS[voucherType];
};

export const PDF_PROCESSING_TIPS = [
    "Performing OCR to recognize text, even in handwritten documents...",
    "Analyzing document structure to identify tables and key-value pairs...",
    "Extracting dates, amounts, and descriptions from each transaction...",
    "For bank statements, attempting to identify opening and closing balances for verification...",
    "For invoices, breaking down line items, taxes, and totals...",
    "Intelligently parsing narration fields to suggest party names...",
    "Cross-referencing debit and credit entries to ensure they match...",
    "This can take a minute, especially for multi-page or complex documents. Thanks for your patience!",
];
