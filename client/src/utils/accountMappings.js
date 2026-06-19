export const accountMappings = {
  // Asset Accounts (1xxxx)
  '111001': 'CGD Bank',
  '111002': 'BPI Bank',
  '111003': 'ActiveBank',
  '111004': 'Inter Bank',
  '121001': 'Investment App CGD',
  '121002': 'Investment App Universo',
  '121003': 'Investment App ActiveBank',
  '121004': 'WizInk Card',
  '121005': 'Investment App Inter(Brasil)',
  '131001': 'Cash Chest/Vault',
  '131002': 'Savings Account ActiveBank',
  '131003': 'Savings Account Inter(Brasil)',

  // Liability Accounts (2xxxx)
  '211001': 'Loans CGD',
  '211002': 'Loans Universo',
  '211003': 'Loans ActiveBank',
  '211004': 'Loans Inter(Brasil)',
  '211005': 'Loans WizInk',
  '211006': 'Cofidis Loan',
  '212001': 'Jota Loan',
  '212002': 'Mae Loan',
  '221001': 'Credit Card CGD',
  '221002': 'Universo Card',
  '221003': 'Credit Card ActiveBank',
  '221004': 'Credit Card WizInk',
  '221005': 'Credit Card Inter(Brasil)',

  // Expense Accounts (6xxxx)
  '611001': 'Rent Expense',
  '611002': 'Repairs Expense',
  '611003': 'Decorations Expense',
  '611004': 'Utensils Expense',
  '621001': 'Electricity Expense',
  '621002': 'Gas Expense',
  '621003': 'Water Expense',
  '621004': 'Communications Expense',
  '631001': 'Gasoline Expense',
  '631002': 'Tolls Expense',
  '631003': 'Parking Expense',
  '641001': 'Supermarket Food',
  '642001': 'Tools & Equipment',
  '643001': 'Clothing Expense',
  '651001': 'Health Insurance',
  '651002': 'Medicine Expense',
  '651003': 'Health Fees',
  '651004': 'Medical Appointments',
  '651005': 'Medical Exams',
  '661': 'Restaurant Feast',
  '662': 'Cinema Entertainment',
  '663': 'Streaming Entertainment',
  '681001': 'Interest Expense',
  '681002': 'Stamp Duty & Fees',

  // Income Accounts (7xxxx)
  '711001': 'Base Salary Income',
  '711002': 'Subsidies Income',
  '711003': 'Bonus Income',
  '712001': 'Consulting / Contract Services',
  '721001': 'Dividends Income',
  '721002': 'Bank Interest Income',
  '721003': 'Capital Gains Income',
  '731001': 'IRS Tax Refund',
  '731002': 'Family Gifts',
  '731003': 'Cashbacks & Rewards'
};

export const getAccountName = (code) => {
  return accountMappings[code] || `Account ${code}`;
};
