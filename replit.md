# Smart Invoice Generator

## Overview
A React-based invoice generation application that allows users to create, manage, and track invoices. The application features user authentication, company management, and detailed invoice creation with GST calculations.

## Tech Stack
- **Frontend**: React 19.2.0 + TypeScript
- **Build Tool**: Vite 6.2.0
- **Styling**: Tailwind CSS (via CDN)
- **Backend**: Google Apps Script (external service)

## Project Structure
```
├── components/           # React components
│   ├── Login.tsx        # User authentication
│   ├── CompanySelect.tsx # Company selection
│   ├── InvoiceForm.tsx  # Main invoice creation form
│   ├── InvoiceSummary.tsx # Invoice summary display
│   ├── InvoiceItemRow.tsx # Individual invoice items
│   └── ExpenseLedgerRow.tsx # Expense entries
├── services/            # API service layer
│   ├── apiService.ts    # Main API service (Google Apps Script)
│   ├── authService.ts   # Authentication service
│   ├── gheeService.ts   # Business logic for ghee
│   └── gstService.ts    # GST calculation service
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
├── types.ts            # TypeScript type definitions
└── vite.config.ts      # Vite configuration

```

## Key Features
- User authentication (login/register)
- Company management
- Invoice creation with:
  - Multiple invoice items
  - Discount calculations
  - GST calculations (CGST/SGST/IGST)
  - Expense tracking
- Session-based state management

## Configuration
The application is configured to run on port 5000 in development and production.

### Development
- Port: 5000
- Host: 0.0.0.0 (to work with Replit's proxy)
- HMR: Configured for Replit environment

### Deployment
- Type: Autoscale (stateless web app)
- Build: `npm run build`
- Run: Vite preview server on port 5000

## Backend Integration
The app uses Google Apps Script as a backend service. The script URL is configured in `services/apiService.ts`:
```
https://script.google.com/macros/s/AKfycbyjBwBcOJHA-2J5I-SIe_Guyms6S2RpB5k7wPDR1Iz2T8P8-XcZF34Dr9Cv19ygnpWp/exec
```

## Environment Variables
- `GEMINI_API_KEY`: Configured in vite.config.ts but not currently used in the application

## Recent Changes (Nov 14, 2024)
- Imported from GitHub repository
- Moved all files to project root
- Updated Vite configuration for Replit environment:
  - Changed port from 3000 to 5000
  - Configured HMR for Replit proxy
  - Fixed module resolution for TypeScript
- Added .gitignore for Node.js projects
- Set up development workflow on port 5000
- Configured deployment for autoscale

## Running the App
The development server is already configured and running. Any changes to the code will automatically reload in the browser.

## Notes
- The app uses Tailwind CSS via CDN (not recommended for production)
- Session storage is used for authentication state
- All invoice data is stored via Google Apps Script backend
