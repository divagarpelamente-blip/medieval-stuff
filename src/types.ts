export interface ChartOfAccountItem {
  account_code: number;
  account_type_I: string;
  account_type_II: string;
  account_type_III: string;
}

export interface MatrixRow {
  account_type_I: string;
  account_type_II: string;
  account_type_III: string;
  entity_name: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  source_account_code: number;
  target_account_code: number;
  account_type_I: string;
  account_type_II: string;
  account_type_III: string;
  entity_name: string;
  amount: number;
  description: string;
}

// Seed data
export const INITIAL_CHART_OF_ACCOUNTS: ChartOfAccountItem[] = [
  { account_code: 1010, account_type_I: "Assets", account_type_II: "Current Assets", account_type_III: "Cash & Equivalents" },
  { account_code: 1120, account_type_I: "Assets", account_type_II: "Current Assets", account_type_III: "Accounts Receivable" },
  { account_code: 1510, account_type_I: "Assets", account_type_II: "Non-Current Assets", account_type_III: "Property, Plant & Equipment" },
  { account_code: 2010, account_type_I: "Liabilities", account_type_II: "Current Liabilities", account_type_III: "Accounts Payable" },
  { account_code: 2020, account_type_I: "Liabilities", account_type_II: "Current Liabilities", account_type_III: "Tax Payable" },
  { account_code: 3010, account_type_I: "Equity", account_type_II: "Shareholder Capital", account_type_III: "Common Stock" },
  { account_code: 4010, account_type_I: "Revenue", account_type_II: "Operating Revenue", account_type_III: "SaaS Product Sales" },
  { account_code: 4020, account_type_I: "Revenue", account_type_II: "Operating Revenue", account_type_III: "Consulting Services" },
  { account_code: 5010, account_type_I: "Expenses", account_type_II: "Operating Expenses", account_type_III: "Software Subscriptions" },
  { account_code: 5020, account_type_I: "Expenses", account_type_II: "Operating Expenses", account_type_III: "Marketing Expenses" },
  { account_code: 5030, account_type_I: "Expenses", account_type_II: "Operating Expenses", account_type_III: "Salaries" },
];

export const INITIAL_MATRIX: MatrixRow[] = [
  // Expense associations
  { account_type_I: "Expenses", account_type_II: "Operating Expenses", account_type_III: "Software Subscriptions", entity_name: "Google Cloud Services" },
  { account_type_I: "Expenses", account_type_II: "Operating Expenses", account_type_III: "Software Subscriptions", entity_name: "Framer Inc." },
  { account_type_I: "Expenses", account_type_II: "Operating Expenses", account_type_III: "Marketing Expenses", entity_name: "Google Ads" },
  { account_type_I: "Expenses", account_type_II: "Operating Expenses", account_type_III: "Marketing Expenses", entity_name: "Meta Platforms" },
  { account_type_I: "Expenses", account_type_II: "Operating Expenses", account_type_III: "Salaries", entity_name: "HR Department" },

  // Revenue associations
  { account_type_I: "Revenue", account_type_II: "Operating Revenue", account_type_III: "SaaS Product Sales", entity_name: "Stripe Customers" },
  { account_type_I: "Revenue", account_type_II: "Operating Revenue", account_type_III: "Consulting Services", entity_name: "Enterprise Client A" },
  { account_type_I: "Revenue", account_type_II: "Operating Revenue", account_type_III: "Consulting Services", entity_name: "Stripe Customers" }, // Many-to-many example

  // Asset associations
  { account_type_I: "Assets", account_type_II: "Current Assets", account_type_III: "Cash & Equivalents", entity_name: "Silicon Valley Bank" },
  { account_type_I: "Assets", account_type_II: "Current Assets", account_type_III: "Accounts Receivable", entity_name: "Enterprise Client A" },
  { account_type_I: "Assets", account_type_II: "Non-Current Assets", account_type_III: "Property, Plant & Equipment", entity_name: "Main Office Landlord" },

  // Liability associations
  { account_type_I: "Liabilities", account_type_II: "Current Liabilities", account_type_III: "Accounts Payable", entity_name: "Google Cloud Services" },
  { account_type_I: "Liabilities", account_type_II: "Current Liabilities", account_type_III: "Tax Payable", entity_name: "IRS Bureau" },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    date: "2026-07-01",
    source_account_code: 1010, // Cash
    target_account_code: 5010, // Software Subscriptions
    account_type_I: "Expenses",
    account_type_II: "Operating Expenses",
    account_type_III: "Software Subscriptions",
    entity_name: "Google Cloud Services",
    amount: 350.00,
    description: "Monthly cloud hosting fees for web servers"
  },
  {
    id: "tx-2",
    date: "2026-07-03",
    source_account_code: 1120, // Accounts Receivable
    target_account_code: 1010, // Cash
    account_type_I: "Assets",
    account_type_II: "Current Assets",
    account_type_III: "Cash & Equivalents",
    entity_name: "Silicon Valley Bank",
    amount: 5200.00,
    description: "Received payment for invoice INV-1092 from Enterprise Client A"
  },
  {
    id: "tx-3",
    date: "2026-07-05",
    source_account_code: 1010, // Cash
    target_account_code: 5020, // Marketing Expenses
    account_type_I: "Expenses",
    account_type_II: "Operating Expenses",
    account_type_III: "Marketing Expenses",
    entity_name: "Google Ads",
    amount: 1200.00,
    description: "Q3 launch search ad campaign budget"
  },
  {
    id: "tx-4",
    date: "2026-07-07",
    source_account_code: 1010, // Cash
    target_account_code: 2010, // Accounts Payable
    account_type_I: "Liabilities",
    account_type_II: "Current Liabilities",
    account_type_III: "Accounts Payable",
    entity_name: "Google Cloud Services",
    amount: 350.00,
    description: "Settled accounts payable for hosting services"
  }
];
