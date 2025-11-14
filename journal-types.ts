
export type VoucherType = 'Sales' | 'Purchase' | 'Journal' | 'Bank Statement';
export type AppMode = 'excel' | 'bankStatement' | 'salesInvoice' | 'purchaseInvoice' | 'journalVoucher';
export type PdfDocumentType = 'Bank Statement' | 'Sales Invoice' | 'Purchase Invoice' | 'Journal';


export interface RawRow {
  [key: string]: string | number | null | undefined;
}

export interface FileState {
  file: File | null;
  rawData: RawRow[];
  headers: string[];
}

export interface Status {
  message: string;
  type: 'info' | 'success' | 'error';
}

export interface LedgerEntry {
  voucherDate: string;
  voucherTypeName: string;
  voucherNumber: string;
  ledgerName: string;
  ledgerAmount: string;
  ledgerAmountDrCr: 'Dr' | 'Cr';
  narration: string;
}

export interface Stats {
  totalVouchers: number;
  totalEntries: number;
  totalAmount: number;
}

export interface FieldDefinition {
  key: string;
  label: string;
  description?: string;
  optional?: boolean;
}

// Configuration for a single line item in a Sales/Purchase voucher
export interface SalesPurchaseLineItemConfig {
  id: string; // For React keys
  column: string | null; // Header from Excel for amount
  ledgerName: string; // User-defined static ledger name
}

// Configuration for a single line item in a Journal voucher
export interface JournalLineItemConfig {
    id: string;
    amountColumn: string | null;
    ledgerNameColumn: string | null;
}

// Configuration for Sales or Purchase vouchers
export interface SalesPurchaseConfig {
  voucherTypeName: string;
  date: string | null;
  voucherNumber: string | null;
  partyName: string | null;
  narration: string | null;
  lineItems: SalesPurchaseLineItemConfig[];
}

// Configuration for Journal vouchers, now supporting compound entries with dynamic ledger names
export interface JournalConfig {
  date: string | null;
  voucherNumber: string | null;
  narration: string | null;
  debitItems: JournalLineItemConfig[];
  creditItems: JournalLineItemConfig[];
}

// Configuration for Bank Statements
export interface BankStatementConfig {
  date: string | null;
  narration: string | null;
  partyName: string | null; // 'Particulars' or 'Description' column
  depositColumn: string | null;
  withdrawalColumn: string | null;
  bankLedgerName: string;
  receiptVoucherTypeName: string;
  paymentVoucherTypeName: string;
}

export interface AppConfigs {
  Sales: SalesPurchaseConfig;
  Purchase: SalesPurchaseConfig;
  Journal: JournalConfig;
  'Bank Statement': BankStatementConfig;
}

// == Chart of Accounts Types ==
export interface LedgerAccount {
    name: string;
    group: string;
}

export interface NameMappingResult {
    corrections: Record<string, string>; // { [originalName]: correctedName }
    newLedgers: LedgerAccount[];
}
