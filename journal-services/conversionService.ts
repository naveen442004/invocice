
import type { RawRow, VoucherType, SalesPurchaseConfig, JournalConfig, BankStatementConfig, LedgerEntry, Stats } from '../types';

declare const XLSX: any;

const formatDate = (date: any): string => {
    if (!date) return '';
    if (typeof date === 'number') {
        // Attempt to parse Excel's numeric date format
        const d = XLSX.SSF.parse_date_code(date);
        if (d && d.y > 1900) {
            return `${String(d.d).padStart(2, '0')}/${String(d.m).padStart(2, '0')}/${d.y}`;
        }
    }
    if (date instanceof Date) {
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    }
    // Handle common string formats like YYYY-MM-DD, DD-MM-YYYY etc.
    const parts = String(date).split(/[-/.]/);
    if (parts.length === 3) {
        const [p1, p2, p3] = parts;
        if (p1.length === 4) return `${p3}/${p2}/${p1}`; // YYYY-MM-DD
        if (p3.length === 4) return `${p1}/${p2}/${p3}`; // DD-MM-YYYY
    }
    return String(date);
};

const createLedgerEntry = (data: Omit<LedgerEntry, 'ledgerAmount'> & { ledgerAmount: number | string }): LedgerEntry => ({
    ...data,
    ledgerAmount: Number(data.ledgerAmount).toFixed(2),
});

export const convertDataToLedger = (
  rawData: RawRow[],
  voucherType: VoucherType,
  config: SalesPurchaseConfig | JournalConfig | BankStatementConfig,
  corrections: Record<string, string>,
): { entries: LedgerEntry[]; stats: Stats } => {
  const entries: LedgerEntry[] = [];
  let totalAmount = 0;
  
  rawData.forEach((row, index) => {
    // Helper to get value based on mapped column in config
    // FIX: Changed parameter `key` type to `string`. `keyof typeof config` was too restrictive
    // due to `config` being a union type, only allowing access to common properties.
    const getVal = (key: string) => {
        const mappedKey = (config as Record<string, any>)[key] as string | null;
        return mappedKey ? row[mappedKey] : undefined;
    };
    
    const voucherDate = formatDate(getVal('date'));
    if (!voucherDate) return; // Skip rows without a valid date

    const voucherNumber = String(getVal('voucherNumber') || `VCH-${index + 1}`);
    let narration: string;

    if (voucherType === 'Sales' || voucherType === 'Purchase') {
        narration = String(getVal('narration') || getVal('partyName') || '');
    } else {
        // For Journal and Bank Statement, narration should not fall back to a party name/description column.
        narration = String(getVal('narration') || '');
    }


    if ((voucherType === 'Sales' || voucherType === 'Purchase') && 'lineItems' in config) {
        const originalPartyName = String(getVal('partyName') || '');
        if (!originalPartyName) return;
        const partyName = corrections[originalPartyName] || originalPartyName;

        const lineItemEntries: Omit<LedgerEntry, 'voucherDate'|'voucherTypeName'|'voucherNumber'|'narration'>[] = [];
        let currentVoucherTotal = 0;

        config.lineItems.forEach(item => {
            if (item.column && item.ledgerName) {
                const amount = parseFloat(String(row[item.column] || '0'));
                if (amount !== 0) {
                    currentVoucherTotal += amount;
                    lineItemEntries.push({
                        ledgerName: item.ledgerName,
                        ledgerAmount: amount.toFixed(2),
                        ledgerAmountDrCr: voucherType === 'Sales' ? 'Cr' : 'Dr',
                    });
                }
            }
        });

        if (currentVoucherTotal === 0) return;
        totalAmount += currentVoucherTotal;

        entries.push(createLedgerEntry({
            voucherDate, voucherNumber, narration,
            voucherTypeName: config.voucherTypeName,
            ledgerName: partyName,
            ledgerAmount: currentVoucherTotal,
            ledgerAmountDrCr: voucherType === 'Sales' ? 'Dr' : 'Cr',
        }));

        lineItemEntries.forEach(item => {
            entries.push(createLedgerEntry({
                ...item,
                voucherDate: '', voucherTypeName: '', voucherNumber: '', narration: '',
            }));
        });

    } else if (voucherType === 'Journal' && 'debitItems' in config) {
        let totalDebit = 0;
        let totalCredit = 0;
        const debitEntries: Omit<LedgerEntry, 'voucherDate'|'voucherTypeName'|'voucherNumber'|'narration'>[] = [];
        const creditEntries: Omit<LedgerEntry, 'voucherDate'|'voucherTypeName'|'voucherNumber'|'narration'>[] = [];

        config.debitItems.forEach(item => {
            if (item.amountColumn && item.ledgerNameColumn) {
                const amount = parseFloat(String(row[item.amountColumn] || '0'));
                const ledgerName = String(row[item.ledgerNameColumn] || '').trim();
                if (amount > 0 && ledgerName) {
                    totalDebit += amount;
                    debitEntries.push({ ledgerName, ledgerAmount: amount.toFixed(2), ledgerAmountDrCr: 'Dr' });
                }
            }
        });

        config.creditItems.forEach(item => {
            if (item.amountColumn && item.ledgerNameColumn) {
                const amount = parseFloat(String(row[item.amountColumn] || '0'));
                const ledgerName = String(row[item.ledgerNameColumn] || '').trim();
                if (amount > 0 && ledgerName) {
                    totalCredit += amount;
                    creditEntries.push({ ledgerName, ledgerAmount: amount.toFixed(2), ledgerAmountDrCr: 'Cr' });
                }
            }
        });
        
        if (totalDebit === 0 || totalDebit.toFixed(5) !== totalCredit.toFixed(5)) {
            return;
        }

        totalAmount += totalDebit;
        const allVoucherEntries = [...debitEntries, ...creditEntries];

        allVoucherEntries.forEach((item, entryIndex) => {
            const isFirstEntry = entryIndex === 0;
            entries.push(createLedgerEntry({
                ...item,
                voucherDate: isFirstEntry ? voucherDate : '',
                voucherTypeName: isFirstEntry ? 'Journal' : '',
                voucherNumber: isFirstEntry ? voucherNumber : '',
                narration: isFirstEntry ? narration : '',
            }));
        });
    } else if (voucherType === 'Bank Statement' && 'bankLedgerName' in config) {
        const originalPartyName = String(getVal('partyName') || '');
        if (!originalPartyName) return;
        const partyName = corrections[originalPartyName] || originalPartyName;


        let transactionAmount = 0;
        let transactionType: 'receipt' | 'payment' | 'none' = 'none';

        const depositCol = config.depositColumn;
        const withdrawalCol = config.withdrawalColumn;

        // Case 1: Same column used for deposits and withdrawals (common format with +/- amounts)
        if (depositCol && withdrawalCol && depositCol === withdrawalCol) {
            const amount = parseFloat(String(row[depositCol] || '0'));
            if (amount > 0) {
                transactionAmount = amount;
                transactionType = 'receipt';
            } else if (amount < 0) {
                transactionAmount = Math.abs(amount);
                transactionType = 'payment';
            }
        } else {
            // Case 2: Separate columns for deposits and withdrawals
            const deposit = depositCol ? parseFloat(String(row[depositCol] || '0')) : 0;
            const withdrawal = withdrawalCol ? Math.abs(parseFloat(String(row[withdrawalCol] || '0'))) : 0;

            if (deposit > 0) {
                transactionAmount = deposit;
                transactionType = 'receipt';
            } else if (withdrawal > 0) {
                transactionAmount = withdrawal;
                transactionType = 'payment';
            }
        }

        if (transactionType === 'none' || transactionAmount <= 0) {
            return; // Skip if no valid transaction amount found
        }
        
        totalAmount += transactionAmount;

        if (transactionType === 'receipt') {
            entries.push(createLedgerEntry({
                voucherDate, voucherNumber, narration,
                voucherTypeName: config.receiptVoucherTypeName,
                ledgerName: config.bankLedgerName,
                ledgerAmount: transactionAmount,
                ledgerAmountDrCr: 'Dr',
            }));
            entries.push(createLedgerEntry({
                voucherDate: '', voucherTypeName: '', voucherNumber: '', narration: '',
                ledgerName: partyName,
                ledgerAmount: transactionAmount,
                ledgerAmountDrCr: 'Cr',
            }));
        } else if (transactionType === 'payment') {
            entries.push(createLedgerEntry({
                voucherDate, voucherNumber, narration,
                voucherTypeName: config.paymentVoucherTypeName,
                ledgerName: config.bankLedgerName,
                ledgerAmount: transactionAmount,
                ledgerAmountDrCr: 'Cr',
            }));
            entries.push(createLedgerEntry({
                voucherDate: '', voucherTypeName: '', voucherNumber: '', narration: '',
                ledgerName: partyName,
                ledgerAmount: transactionAmount,
                ledgerAmountDrCr: 'Dr',
            }));
        }
    }
  });

  const stats: Stats = {
    totalVouchers: new Set(entries.filter(e => e.voucherDate).map(e => e.voucherDate + e.voucherNumber)).size,
    totalEntries: entries.length,
    totalAmount,
  };

  return { entries, stats };
};