
export interface PartyDetails {
  name: string;
  gstin: string;
  address: string;
  state: string;
  pincode: string;
  country: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  hsn: string;
  quantity: number;
  rate: number;
  per: string;
  discountPercent: number;
  gstRate: number;
}

export interface AncillaryExpense {
  id: string;
  name: string;
  amount: number;
  gstRate: number;
}

export interface InvoiceData {
  voucherDate: string;
  voucherNumber: string;
  buyer: PartyDetails;
  consignee: PartyDetails;
  isConsigneeSameAsBuyer: boolean;
  placeOfSupply: string;
  items: InvoiceItem[];
  expenses: AncillaryExpense[];
}

export interface CalculatedAmounts {
  subTotal: number;
  totalDiscount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  grandTotal: number;
  expenseTotal: number;
}

export interface LedgerEntry {
  name: string;
  amount: number;
  type: 'Dr' | 'Cr';
}

export interface User {
  email: string;
}

export interface Company {
  CompanyID: string;
  CompanyName: string;
  CompanyGSTIN: string;
  CompanyState: string;
  // Mapped properties for easier use in frontend
  id: string;
  name: string;
  gstin: string;
  state: string;
}

export const indianStates = {
  '35': 'Andaman and Nicobar Islands', '37': 'Andhra Pradesh', '12': 'Arunachal Pradesh', '18': 'Assam', '10': 'Bihar',
  '04': 'Chandigarh', '22': 'Chhattisgarh', '26': 'Dadra and Nagar Haveli and Daman and Diu', '07': 'Delhi', '30': 'Goa',
  '24': 'Gujarat', '06': 'Haryana', '02': 'Himachal Pradesh', '01': 'Jammu and Kashmir', '20': 'Jharkhand', '29': 'Karnataka',
  '32': 'Kerala', '38': 'Ladakh', '31': 'Lakshadweep', '23': 'Madhya Pradesh', '27': 'Maharashtra', '14': 'Manipur',
  '17': 'Meghalaya', '15': 'Mizoram', '13': 'Nagaland', '21': 'Odisha', '34': 'Puducherry', '03': 'Punjab',
  '08': 'Rajasthan', '11': 'Sikkim', '33': 'Tamil Nadu', '36': 'Telangana', '16': 'Tripura', '09': 'Uttar Pradesh',
  '05': 'Uttarakhand', '19': 'West Bengal',
};

export type IndianStateCode = keyof typeof indianStates;
