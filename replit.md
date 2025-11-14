# Business Management Suite

## Overview
A comprehensive business management application combining invoice generation and document processing capabilities. This unified suite allows users to create invoices with GST calculations and process various financial documents using AI-powered OCR.

## Combined Features

### 1. Smart Invoice Generator
- User authentication (login/register)
- Company management
- Invoice creation with GST calculations (CGST/SGST/IGST)
- Expense tracking
- Session-based state management
- Backend: Google Apps Script

### 2. GST Voucher Converter Pro
- Excel import for converting flat files into ledger format
- PDF processing with AI/OCR for:
  - Bank statements
  - Sales invoices
  - Purchase invoices
  - Journal vouchers
- Chart of Accounts management
- Gemini AI integration for document extraction

## Tech Stack
- **Frontend**: React 19.2.0 + TypeScript
- **Build Tool**: Vite 6.2.0
- **Styling**: Tailwind CSS (via CDN) with custom theme
- **AI/OCR**: Google Gemini AI (@google/genai)
- **Backend**: Google Apps Script (for invoices)

## Project Structure
```
├── components/              # Invoice generator components
│   ├── Login.tsx
│   ├── CompanySelect.tsx
│   ├── InvoiceForm.tsx
│   ├── InvoiceSummary.tsx
│   ├── InvoiceItemRow.tsx
│   └── ExpenseLedgerRow.tsx
├── journal-components/      # Voucher converter components
│   ├── ChartOfAccountsManager.tsx
│   ├── ExcelProcessor.tsx
│   ├── PdfProcessor.tsx
│   ├── FileUpload.tsx
│   ├── EditableDataTable.tsx
│   ├── PreviewPanel.tsx
│   ├── SuggestionsPanel.tsx
│   └── ConfigPanel.tsx
├── services/                # Invoice services
│   ├── apiService.ts        # Google Apps Script integration
│   ├── authService.ts
│   ├── gheeService.ts
│   └── gstService.ts
├── journal-services/        # Voucher converter services
├── App.tsx                  # Main app with navigation
├── InvoiceApp.tsx          # Invoice generator app
├── JournalApp.tsx          # Voucher converter app
├── types.ts                # Invoice type definitions
├── journal-types.ts        # Voucher converter types
├── constants.ts            # Voucher converter constants
└── vite.config.ts          # Vite configuration
```

## Navigation
The application features a top navigation bar allowing users to switch between:
- **Invoice Generator** - For creating and managing invoices
- **Voucher Converter** - For processing documents with AI/OCR

## Configuration
The application is configured to run on port 5000 in both development and production.

### Development
- Port: 5000
- Host: 0.0.0.0 (configured for Replit's proxy)
- HMR: Configured for Replit environment

### Deployment
- Type: Autoscale (stateless web app)
- Build: `npm run build`
- Run: Vite preview server on port 5000

## Backend Integrations

### Invoice Generator Backend
Google Apps Script endpoint:
```
https://script.google.com/macros/s/AKfycbyjBwBcOJHA-2J5I-SIe_Guyms6S2RpB5k7wPDR1Iz2T8P8-XcZF34Dr9Cv19ygnpWp/exec
```

### Voucher Converter Backend
Uses Google Gemini AI for OCR and document processing
- Requires `GEMINI_API_KEY` environment variable

## Environment Variables
- `GEMINI_API_KEY`: **Required** for document OCR and AI processing features in the Voucher Converter

## Theme Support
The application includes a custom theme with:
- Light and dark mode support (follows system preference)
- Custom color scheme using CSS variables
- Consistent styling across both apps

## Recent Changes (Nov 14, 2024)
- Combined two projects: Smart Invoice Generator + GST Voucher Converter Pro
- Created unified navigation system
- Integrated @google/genai for AI/OCR capabilities
- Added custom theming with dark mode support
- Organized components into separate directories
- Updated all import paths for new structure
- Configured for Replit environment (port 5000, HMR settings)
- Set up deployment configuration

## Running the App
The development server is configured and running on port 5000. Use the navigation bar to switch between Invoice Generator and Voucher Converter features.

## Notes
- The app uses Tailwind CSS via CDN (not recommended for production, but works for prototyping)
- Invoice data is stored via Google Apps Script backend
- Voucher converter processes documents locally using Gemini AI
- Both apps share the same session and can be used interchangeably
