
import { GoogleGenAI, Type } from "@google/genai";
import type { FieldDefinition, SalesPurchaseConfig, JournalConfig, BankStatementConfig, LedgerAccount, NameMappingResult, VoucherType, RawRow } from '../types';

const getApiKey = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set.");
  }
  return apiKey;
};

// Helper to convert a file to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            resolve(result);
        };
        reader.onerror = error => reject(error);
    });
};


const parseJsonResponse = (text: string) => {
  try {
    // The response can sometimes be wrapped in ```json ... ```
    const jsonString = text.replace(/^```json\s*/, '').replace(/```$/, '');
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Error parsing Gemini response:", text);
    throw new Error("Failed to get a valid mapping from AI. The response was not valid JSON.");
  }
}

export const autoMapSalesPurchase = async (headers: string[], fields: FieldDefinition[]): Promise<Partial<SalesPurchaseConfig>> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const prompt = `
    Analyze the provided Excel headers and map them to the required fields for a Sales or Purchase voucher.
    
    Excel Headers: ${JSON.stringify(headers)}
    
    Required Base Fields: ${JSON.stringify(fields)}
    
    Identify all columns from the headers that represent financial line items (e.g., taxable amount, different types of taxes, discounts, shipping costs, etc.). Do NOT include the party's total amount column in the line items.

    Respond with a JSON object with two keys:
    1. "baseFields": An object where keys are the 'key' from "Required Base Fields" and values are the corresponding Excel headers.
    2. "lineItems": An array of objects, each with two keys: "column" (the Excel header for the financial line item) and "ledgerName" (a suggested, concise ledger name for that item, e.g., "Sales", "Output CGST", "Discount Allowed").
    
    If a field cannot be mapped, use the value null. Your response must be only the JSON object.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  const resultJson = parseJsonResponse(response.text);
  const validatedConfig: Partial<SalesPurchaseConfig> = {};
  
  const baseFields: Record<string, string | null> = {};
  for (const field of fields) {
    const key = field.key as keyof SalesPurchaseConfig;
    if (resultJson.baseFields && resultJson.baseFields[key] && headers.includes(resultJson.baseFields[key])) {
      baseFields[key] = resultJson.baseFields[key];
    } else {
      baseFields[key] = null;
    }
  }
  validatedConfig.date = baseFields.date;
  validatedConfig.voucherNumber = baseFields.voucherNumber;
  validatedConfig.partyName = baseFields.partyName;
  validatedConfig.narration = baseFields.narration;

  if (resultJson.lineItems && Array.isArray(resultJson.lineItems)) {
    validatedConfig.lineItems = resultJson.lineItems
      .filter((item: any) => item.column && headers.includes(item.column) && item.ledgerName)
      .map((item: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        column: item.column,
        ledgerName: item.ledgerName,
      }));
  }

  return validatedConfig;
};

export const autoMapJournal = async (headers: string[], fields: FieldDefinition[]): Promise<Partial<JournalConfig>> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    const prompt = `
      Analyze the provided Excel headers for a compound Journal voucher. The file contains multiple columns for debit/credit amounts and corresponding columns for their ledger names.

      Excel Headers: ${JSON.stringify(headers)}
      Required Base Fields: ${JSON.stringify(fields)}

      Identify pairs of columns for debits (one for amount, one for ledger name) and pairs of columns for credits.

      Respond with a JSON object with three keys:
      1. "baseFields": An object mapping base field keys ('date', 'voucherNumber', 'narration') to Excel headers.
      2. "debitItems": An array of objects. Each object must have "amountColumn" (the Excel header for a debit amount) and "ledgerNameColumn" (the Excel header for that debit's corresponding ledger name).
      3. "creditItems": An array of objects, structured the same as "debitItems" but for credit entries.
      
      If a field cannot be mapped, use null. Respond only with the JSON object.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    const resultJson = parseJsonResponse(response.text);
    const validatedConfig: Partial<JournalConfig> = {};

    const baseFields: Record<string, string | null> = {};
    for (const field of fields) {
        const key = field.key as keyof JournalConfig;
        if (resultJson.baseFields && resultJson.baseFields[key] && headers.includes(resultJson.baseFields[key])) {
            baseFields[key] = resultJson.baseFields[key];
        } else {
            baseFields[key] = null;
        }
    }
    validatedConfig.date = baseFields.date;
    validatedConfig.voucherNumber = baseFields.voucherNumber;
    validatedConfig.narration = baseFields.narration;

    if (resultJson.debitItems && Array.isArray(resultJson.debitItems)) {
        validatedConfig.debitItems = resultJson.debitItems
            .filter((item: any) => item.amountColumn && headers.includes(item.amountColumn) && item.ledgerNameColumn && headers.includes(item.ledgerNameColumn))
            .map((item: any, index: number) => ({
                id: `ai-dr-${Date.now()}-${index}`,
                amountColumn: item.amountColumn,
                ledgerNameColumn: item.ledgerNameColumn,
            }));
    }
    
    if (resultJson.creditItems && Array.isArray(resultJson.creditItems)) {
        validatedConfig.creditItems = resultJson.creditItems
            .filter((item: any) => item.amountColumn && headers.includes(item.amountColumn) && item.ledgerNameColumn && headers.includes(item.ledgerNameColumn))
            .map((item: any, index: number) => ({
                id: `ai-cr-${Date.now()}-${index}`,
                amountColumn: item.amountColumn,
                ledgerNameColumn: item.ledgerNameColumn,
            }));
    }

    return validatedConfig;
};

export const autoMapBankStatement = async (headers: string[], fields: FieldDefinition[]): Promise<Partial<BankStatementConfig>> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const prompt = `
    Analyze the provided Excel headers for a bank statement.
    
    Excel Headers: ${JSON.stringify(headers)}
    
    Required Fields: ${JSON.stringify(fields)}
    
    Your goal is to map the Excel headers to the required fields.
    - 'partyName' usually corresponds to a 'Description' or 'Particulars' column.
    - 'depositColumn' corresponds to credits or deposits.
    - 'withdrawalColumn' corresponds to debits or withdrawals.
    - Map 'narration' to the same column as 'partyName' if no other specific narration column is found.

    Respond with a JSON object where keys are the 'key' from "Required Fields" (e.g., 'date', 'partyName', 'depositColumn') and values are the corresponding Excel headers. If a field cannot be mapped, use the value null. Your response must be only the JSON object.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  const resultJson = parseJsonResponse(response.text);
  const validatedConfig: Partial<BankStatementConfig> = {};
  
  for (const field of fields) {
    const key = field.key as keyof BankStatementConfig;
    if (resultJson[key] && headers.includes(resultJson[key])) {
      (validatedConfig as any)[key] = resultJson[key];
    } else {
      (validatedConfig as any)[key] = null;
    }
  }

  return validatedConfig;
};

export const extractLedgersFromDocument = async (file: File): Promise<LedgerAccount[]> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const base64Data = await fileToBase64(file);

    const prompt = `You are an accounting expert. Analyze the provided document, which is a List of Ledgers or Chart of Accounts. Extract every single ledger account name and its immediate parent group. For example, if you see 'Ambey Construction Co' under 'Sundry Debtors', extract { name: 'Ambey Construction Co', group: 'Sundry Debtors' }. Return the result as a JSON array of objects with 'name' and 'group' keys. Ignore summary lines or headers like 'Assets' or 'Current Liabilities' unless they are the direct parent of a ledger. Focus only on the final leaf-node ledgers.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: prompt },
                { inlineData: { mimeType: file.type, data: base64Data } }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        group: { type: Type.STRING },
                    },
                    required: ["name", "group"]
                }
            }
        }
    });

    return parseJsonResponse(response.text) as LedgerAccount[];
};

// Internal function to process a single batch of party names against the chart of accounts.
const matchAndSuggestLedgersForBatch = async (partyNames: string[], chartOfAccountsNames: string[], voucherType: VoucherType): Promise<NameMappingResult> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const prompt = `You are an intelligent accounting assistant that corrects spelling errors and suggests new ledger accounts.
        You are given two lists:
        1. A list of "Party Names" extracted from a transaction file.
        2. A "Chart of Accounts" which is the master list of correct ledger names.
        Your tasks are:
        1.  **Correct Names**: For each "Party Name", find the BEST match in the "Chart of Accounts". A match should be made even if there are minor spelling errors, extra words (like 'Co' or 'Ltd'), or different word order. If a confident match is found, map the original Party Name to the correct name from the Chart of Accounts.
        2.  **Suggest New Ledgers**: If a "Party Name" cannot be confidently matched to anything in the Chart of Accounts, it's a new ledger. For each new ledger, suggest an appropriate accounting group. The transaction type is '${voucherType}'. For 'Sales' or 'Receipt', the group is likely 'Sundry Debtors'. For 'Purchase' or 'Payment', it's 'Sundry Creditors'. For 'Journal' it could be anything, so use a generic group like 'Suspense A/c' or analyze the name to make a best guess.
        
        **Party Names**: ${JSON.stringify(partyNames)}
        **Chart of Accounts**: ${JSON.stringify(chartOfAccountsNames)}
        
        Respond with a single JSON object with two keys:
        - "corrections": An array of objects. Each object should have two keys: "originalName" (the party name from the input) and "correctedName" (the matching name from the Chart of Accounts). ONLY include names that you corrected.
        - "newLedgers": An array of objects for new ledgers, each with "name" (the original party name) and "group" (your suggested accounting group).
        
        Respond with ONLY the JSON object.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    corrections: {
                        type: Type.ARRAY,
                        description: "An array of objects mapping original names to corrected names.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                originalName: { type: Type.STRING },
                                correctedName: { type: Type.STRING }
                            },
                            required: ["originalName", "correctedName"]
                        }
                    },
                    newLedgers: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                group: { type: Type.STRING }
                            },
                             required: ["name", "group"]
                        }
                    }
                },
                required: ["corrections", "newLedgers"]
            }
        }
    });

    const parsedResult = parseJsonResponse(response.text) as {
        corrections: { originalName: string; correctedName: string }[];
        newLedgers: LedgerAccount[];
    };

    const correctionsMap: Record<string, string> = {};
    if (parsedResult.corrections && Array.isArray(parsedResult.corrections)) {
        for (const item of parsedResult.corrections) {
            correctionsMap[item.originalName] = item.correctedName;
        }
    }

    return {
        corrections: correctionsMap,
        newLedgers: parsedResult.newLedgers || [],
    };
};

// Public function that orchestrates the batching of party names to avoid API errors with large datasets.
export const matchAndSuggestLedgers = async (partyNames: string[], chartOfAccounts: LedgerAccount[], voucherType: VoucherType): Promise<NameMappingResult> => {
    const BATCH_SIZE = 100; // Process 100 party names per API call to avoid prompt size limits.
    const allCorrections: Record<string, string> = {};
    const allNewLedgers: LedgerAccount[] = [];
    const chartOfAccountsNames = chartOfAccounts.map(acc => acc.name);

    for (let i = 0; i < partyNames.length; i += BATCH_SIZE) {
        const batchPartyNames = partyNames.slice(i, i + BATCH_SIZE);
        
        // Add a small delay between API calls to prevent hitting rate limits.
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        try {
            const batchResult = await matchAndSuggestLedgersForBatch(batchPartyNames, chartOfAccountsNames, voucherType);
            
            if (batchResult.corrections) {
                Object.assign(allCorrections, batchResult.corrections);
            }
            
            if (batchResult.newLedgers) {
                 batchResult.newLedgers.forEach(newLedger => {
                    // Ensure we don't add duplicate suggestions.
                    if (!allNewLedgers.some(existing => existing.name === newLedger.name)) {
                        allNewLedgers.push(newLedger);
                    }
                });
            }

        } catch (error) {
            console.error(`AI name matching failed for batch starting at index ${i}:`, error);
            // Re-throw the error to notify the user on the UI.
            throw new Error(`Failed to process a batch of party names. ${error instanceof Error ? error.message : ''}`);
        }
    }

    return {
        corrections: allCorrections,
        newLedgers: allNewLedgers,
    };
};


export const extractDataFromDocument = async (file: File, documentType: VoucherType): Promise<{ rawData: RawRow[]; headers: string[] }> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const base64Data = await fileToBase64(file);

    let prompt = '';
    let responseSchema: any;
    
    const kvpSchema = {
        type: Type.OBJECT,
        properties: {
            key: { type: Type.STRING },
            value: { type: Type.STRING },
        },
        required: ["key", "value"]
    };

    switch (documentType) {
        case 'Bank Statement':
            prompt = `Analyze the provided Bank Statement. For EACH transaction, extract the Date, Narration/Description, Deposits, and Withdrawals. From the Narration, intelligently extract the most likely Party Name.
            Return a JSON array where each object represents a transaction with keys: "Date", "Party Name", "Narration", "Deposit", "Withdrawal". Ensure either Deposit or Withdrawal has a value for each transaction.`;
            responseSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        "Date": { type: Type.STRING },
                        "Party Name": { type: Type.STRING },
                        "Narration": { type: Type.STRING },
                        "Deposit": { type: Type.STRING, nullable: true },
                        "Withdrawal": { type: Type.STRING, nullable: true },
                    },
                    required: ["Date", "Party Name", "Narration"]
                }
            };
            break;
        
        case 'Sales':
        case 'Purchase':
            const entity = documentType === 'Sales' ? 'Customer' : 'Supplier';
            prompt = `You are an expert accounting data extraction tool. Analyze ALL pages of the provided document, which may contain multiple ${documentType} Invoices.

            Your task is to identify EACH AND EVERY invoice in the document, from the first page to the last. For each invoice you find, you must perform the following extraction:
            1.  Extract the invoice date, invoice number, and the ${entity}'s name.
            2.  Identify EVERY financial line item on that specific invoice. This includes the subtotal/taxable value, all types of taxes (SGST, CGST, IGST), discounts, and any other charges like shipping, loading, etc.
            3.  For each piece of information for a single invoice, create a key-value pair. The key should be a descriptive header (e.g., "Date", "Invoice No.", "Party Name", "Taxable Value", "SGST @ 5%", "Total Amount"). The value should be the extracted data.

            The final output MUST be a JSON array where EACH element of the array represents ONE invoice. Each of these invoice elements should ITSELF be an array of key-value pair objects.

            Example response for a document with TWO invoices:
            [
              [
                { "key": "Date", "value": "19/02/2025" },
                { "key": "Invoice No.", "value": "116" },
                { "key": "Party Name", "value": "S.V. Engineers and Contractors" },
                { "key": "Taxable Value", "value": "22415.4" },
                { "key": "SGST", "value": "1120.77" }
              ],
              [
                { "key": "Date", "value": "20/02/2025" },
                { "key": "Invoice No.", "value": "117" },
                { "key": "Party Name", "value": "Another Company" },
                { "key": "Taxable Value", "value": "10000.00" },
                { "key": "CGST", "value": "900.00" },
                { "key": "SGST", "value": "900.00" }
              ]
            ]

            Respond ONLY with the JSON. Do not miss any invoices.`;
            responseSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.ARRAY,
                    items: kvpSchema,
                },
            };
            break;

        case 'Journal':
             prompt = `You are an expert accounting assistant. Analyze the provided Journal Voucher. Extract all debit and credit entries.
             Return a JSON array of objects, where each object represents a single line item from the voucher and has the keys "Date", "Voucher Number", "Narration", "Debit Ledger", "Debit Amount", "Credit Ledger", "Credit Amount". For a debit entry, "Credit Ledger" and "Credit Amount" will be null. For a credit entry, "Debit Ledger" and "Debit Amount" will be null.`;
            responseSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        "Date": { type: Type.STRING },
                        "Voucher Number": { type: Type.STRING },
                        "Narration": { type: Type.STRING },
                        "Debit Ledger": { type: Type.STRING, nullable: true },
                        "Debit Amount": { type: Type.STRING, nullable: true },
                        "Credit Ledger": { type: Type.STRING, nullable: true },
                        "Credit Amount": { type: Type.STRING, nullable: true },
                    },
                    required: ["Date", "Voucher Number", "Narration"]
                }
            };
            break;

        default:
             throw new Error(`Unsupported document type for extraction: ${documentType}`);
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: prompt },
                { inlineData: { mimeType: file.type, data: base64Data } }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema
        }
    });

    const resultJson = parseJsonResponse(response.text);

    if (!Array.isArray(resultJson) || resultJson.length === 0) {
        return { rawData: [], headers: [] };
    }

    if (documentType === 'Sales' || documentType === 'Purchase') {
        const allHeaders = new Set<string>();
        const allRows: RawRow[] = [];

        // The result is an array of invoices. Each invoice is an array of K/V pairs.
        const invoices = resultJson as { key: string; value: string }[][];

        for (const invoice of invoices) {
            const row: RawRow = {};
            // Ensure invoice is a valid array before iterating
            if(Array.isArray(invoice)) {
                for (const item of invoice) {
                    if (item.key && item.value) {
                        row[item.key] = item.value;
                        allHeaders.add(item.key);
                    }
                }
            }
            // Only add the row if it's not empty
            if (Object.keys(row).length > 0) {
                allRows.push(row);
            }
        }

        return { rawData: allRows, headers: Array.from(allHeaders) };
    } else {
        // For Bank Statement and Journal, the JSON is already in a tabular format.
        const headers = Object.keys(resultJson[0]);
        return { rawData: resultJson as RawRow[], headers };
    }
};
