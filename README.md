# LMS - Loan Management System for LAMF

A full-stack Loan Management System for NBFCs specializing in **Lending Against Mutual Funds (LAMF)**.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Architecture**: RESTful API with MVC pattern

## Project Structure

```
├── src/                    # React Frontend
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── lib/               # Utilities and API client
│   └── types/             # TypeScript definitions
├── backend/               # Express Backend
│   └── src/
│       ├── config/        # Database configuration
│       ├── controllers/   # Route handlers
│       ├── models/        # Mongoose schemas
│       ├── routes/        # API routes
│       └── middleware/    # Express middleware
```

## Setup Instructions

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update MONGODB_URI in .env
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Loan Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loan-products` | List all products |
| POST | `/api/loan-products` | Create product |
| PUT | `/api/loan-products/:id` | Update product |

### Applications (Fintech API)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications` | List applications |
| POST | `/api/applications` | Create application |
| PATCH | `/api/applications/:id/status` | Update status |

### Loans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loans` | List ongoing loans |
| POST | `/api/loans/:id/payment` | Record EMI payment |

### Collaterals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/collaterals` | List collaterals |
| POST | `/api/collaterals/:id/lien` | Mark lien |
| POST | `/api/collaterals/:id/release` | Release lien |

## Database Schema

- **LoanProduct**: name, interestRate, minAmount, maxAmount, tenure, maxLTV, processingFee
- **LoanApplication**: applicationNumber, applicant, loanProduct, amount, tenure, collaterals[], status
- **Loan**: loanNumber, disbursedAmount, outstandingAmount, emiSchedule[], status
- **Collateral**: fundName, folioNumber, units, navPerUnit, lienStatus, isin

## Example API Request

```json
POST /api/applications
{
  "applicant": { "name": "John Doe", "email": "john@example.com", "phone": "+91 98765 43210", "pan": "ABCDE1234F" },
  "loanProductId": "product_id",
  "requestedAmount": 500000,
  "tenure": 24,
  "collateralFolios": ["FOLIO123"]
}
```
