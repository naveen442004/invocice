import { InvoiceData, Company, User, PartyDetails } from '../types';

// =====================================================================================
// FINAL SCRIPT URL
// This has been updated with the user's latest deployment URL.
// =====================================================================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyjBwBcOJHA-2J5I-SIe_Guyms6S2RpB5k7wPDR1Iz2T8P8-XcZF34Dr9Cv19ygnpWp/exec';

// --- HELPER FUNCTIONS ---

// A generic helper to handle all responses from the Google Apps Script.
async function handleScriptResponse(response: Response) {
    const responseText = await response.text();
    if (!response.ok) {
        throw new Error(`Server error (${response.status}). Please check the script logs.`);
    }
    try {
        const result = JSON.parse(responseText);
        if (!result.success) {
            // Pass backend errors directly to the frontend.
            throw new Error(result.message || 'An unknown backend error occurred.');
        }
        return result;
    } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error(`Failed to parse server response. Raw response: ${responseText}`);
    }
}

// A generic helper for POST requests to simplify code and ensure consistency.
async function postRequest(action: string, data: object) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            // By omitting the Content-Type header for a string body, we let the browser
            // set the default 'text/plain;charset=UTF-8', which avoids a CORS preflight
            // request and is the standard way to interact with Google Apps Script web apps.
            body: JSON.stringify({ action, data }),
            redirect: 'follow',
        });
        return await handleScriptResponse(response);
    } catch (error) {
         let message: string;
         // Provide a more specific and helpful error message for the common "Failed to fetch" error.
         if (error instanceof TypeError && error.message === 'Failed to fetch') {
            message = "Network request failed. This could be a temporary network issue or a problem with the backend script's deployment (CORS). Please check your internet connection and try again. If the problem persists, ensure the Google Apps Script is deployed correctly with access for 'Anyone'.";
         } else if (error instanceof Error) {
            message = error.message;
         } else {
            message = 'An unknown network error occurred.';
         }

         console.error(`Error during action '${action}':`, message, error);
         
         // This check remains useful for a different class of errors.
         if (message.includes('script.external_request')) {
            message = "Permission Error: The script needs to be re-authorized. Please go to your Google Apps Script, click 'Deploy' > 'New deployment', and approve the permissions.";
         }
         return { success: false, message };
    }
}

// --- AUTHENTICATION API ---

export const loginUser = (email: string, password: string): Promise<{success: boolean; message: string; user?: User}> => {
    return postRequest('login', { email, password });
};

export const registerUser = (email: string, password: string): Promise<{success: boolean; message: string; user?: User}> => {
    return postRequest('register', { email, password });
};

// --- COMPANY API ---

export const getCompanies = async (userEmail: string): Promise<{success: boolean; data?: Company[]; message?: string}> => {
    const result = await postRequest('getCompanies', { userEmail });
    if (result.success && result.data) {
        const mappedData = (result.data as any[]).map((c: any) => ({
            ...c,
            id: c.CompanyID, name: c.CompanyName, gstin: c.CompanyGSTIN, state: c.CompanyState,
        }));
        return { ...result, data: mappedData };
    }
    return result;
};

export const createCompany = async (companyData: { userEmail: string; companyName: string; companyGstin: string; companyState: string; }): Promise<{success: boolean; data?: Company; message?: string}> => {
    const result = await postRequest('createCompany', companyData);
    if (result.success && result.data) {
        result.data = { ...result.data, id: result.data.CompanyID, name: result.data.CompanyName, gstin: result.data.CompanyGSTIN, state: result.data.CompanyState, };
    }
    return result;
};


// --- INVOICE API (Ledger Format) ---

export const saveInvoice = async (invoiceData: InvoiceData, company: Company): Promise<{success: boolean; message: string}> => {
    // Send the full invoice object, plus the company state for tax calculations
    const payload = {
        ...invoiceData,
        companyId: company.id,
        companyState: company.state,
    };
    return postRequest('saveInvoice', payload);
};

export const fetchInvoice = async (voucherNumber: string): Promise<{success: boolean; data?: InvoiceData; message?: string}> => {
    const result = await postRequest('fetchInvoice', { voucherNumber });
    // The backend now reconstructs the full invoice object from the flat ledger.
    if (result.success && result.data) {
        // Ensure numbers are correctly typed
        const parsedData = result.data;
        parsedData.items = parsedData.items.map((item: any) => ({
            ...item,
            quantity: Number(item.quantity) || 0,
            rate: Number(item.rate) || 0,
            discountPercent: Number(item.discountPercent) || 0,
            gstRate: Number(item.gstRate) || 0,
        }));
         parsedData.expenses = parsedData.expenses.map((exp: any) => ({
            ...exp,
            amount: Number(exp.amount) || 0,
            gstRate: Number(exp.gstRate) || 0,
        }));
        return { success: true, data: parsedData };
    }
    return result;
};