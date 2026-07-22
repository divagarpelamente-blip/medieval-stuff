/**
 * Deterministic Pseudo-Random Number Generator (PRNG) - LCG.
 * Guarantees a stable, reproducible mock ledger across client loads.
 */
function createDeterministicRandom(seed) {
  let state = seed;
  return function() {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483647;
  };
}

const rand = createDeterministicRandom(101);

function getRandomRange(min, max) {
  return parseFloat((min + rand() * (max - min)).toFixed(2));
}

function getRandomElement(arr) {
  return arr[Math.floor(rand() * arr.length)];
}

// Deterministic mock UUID generator to mirror strict production Primary Key requirements
function generateMockUUID(index) {
  const hexIndex = index.toString(16).padStart(12, '0');
  return `123e4567-e89b-12d3-a456-${hexIndex}`;
}

const STATIC_PROFILE_UUID = "8f1a4e10-9284-4861-b75a-35071165a254";

const MONTHS_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// -------------------------------------------------------------
// Master Account & Category Reference Data (8-Digit COA mapping)
// -------------------------------------------------------------

const CHECKING_ACCOUNTS = [
  { code: '11010001', name: 'CGD Checking', entity: 'CGD', category: 'Checking Accounts', subtype: 'Liquid Assets' },
  { code: '11010002', name: 'Universo Checking', entity: 'Universo', category: 'Checking Accounts', subtype: 'Liquid Assets' },
  { code: '11010003', name: 'ActivoBank Checking', entity: 'ActivoBank', category: 'Checking Accounts', subtype: 'Liquid Assets' },
  { code: '11010004', name: 'Inter Bank Checking', entity: 'Inter Bank', category: 'Checking Accounts', subtype: 'Liquid Assets' },
  { code: '11010005', name: 'WiZink Checking', entity: 'WiZink', category: 'Checking Accounts', subtype: 'Liquid Assets' }
];

const SAVINGS_ACCOUNTS = [
  { code: '11020001', name: 'CGD Poupança', entity: 'CGD Poupança', category: 'Savings & Wallets', subtype: 'Liquid Assets' },
  { code: '11020002', name: 'Universo Poupança', entity: 'Universo Poupança', category: 'Savings & Wallets', subtype: 'Liquid Assets' },
  { code: '11020003', name: 'ActivoBank Poupança', entity: 'ActivoBank Poupança', category: 'Savings & Wallets', subtype: 'Liquid Assets' },
  { code: '11020004', name: 'Inter Bank Poupança', entity: 'Inter Bank Poupança', category: 'Savings & Wallets', subtype: 'Liquid Assets' },
  { code: '11020005', name: 'WiZink Poupança', entity: 'WiZink Poupança', category: 'Savings & Wallets', subtype: 'Liquid Assets' }
];

const CASH_ACCOUNTS = [
  { code: '11030001', name: 'Dinheiro (Físico)', entity: 'Dinheiro (Físico)', category: 'Cash', subtype: 'Liquid Assets' }
];

const SINKING_FUNDS = [
  { code: '12010001', name: 'Fundo Férias', entity: 'Fundo Férias', category: 'Short-Term Goals', subtype: 'Sinking Funds' },
  { code: '12010002', name: 'Fundo Emergência', entity: 'Fundo Emergência', category: 'Short-Term Goals', subtype: 'Sinking Funds' }
];

const INVEST_ACCOUNTS = [
  { code: '13010001', name: 'CGD Invest', entity: 'CGD', category: 'Invest Accounts', subtype: 'Investments' },
  { code: '13010002', name: 'Universo Invest', entity: 'Universo', category: 'Invest Accounts', subtype: 'Investments' },
  { code: '13010003', name: 'ActivoBank Invest', entity: 'ActivoBank', category: 'Invest Accounts', subtype: 'Investments' },
  { code: '13010004', name: 'Inter Bank Invest', entity: 'Inter Bank', category: 'Invest Accounts', subtype: 'Investments' },
  { code: '13010005', name: 'WiZink Invest', entity: 'WiZink', category: 'Invest Accounts', subtype: 'Investments' },
  { code: '13020001', name: 'PPR Retirement', entity: 'PPR', category: 'Retirement', subtype: 'Investments' }
];

const FIXED_ASSETS = [
  { code: '14010001', name: 'Habitação Própria', entity: 'Habitação Própria', category: 'Real Estate', subtype: 'Fixed Assets' },
  { code: '14020001', name: 'Carro Pessoal', entity: 'Carro Pessoal', category: 'Vehicles', subtype: 'Fixed Assets' },
  { code: '14020002', name: 'Mota Pessoal', entity: 'Mota Pessoal', category: 'Vehicles', subtype: 'Fixed Assets' }
];

const ALL_ASSETS = [
  ...CHECKING_ACCOUNTS,
  ...SAVINGS_ACCOUNTS,
  ...CASH_ACCOUNTS,
  ...SINKING_FUNDS,
  ...INVEST_ACCOUNTS,
  ...FIXED_ASSETS
];

const LIABILITIES_COA = [
  { code: '21010001', name: 'CGD Credit Card', entity: 'CGD', category: 'Credit Cards', subtype: 'Short-Term Debt' },
  { code: '21010002', name: 'Universo Credit Card', entity: 'Universo', category: 'Credit Cards', subtype: 'Short-Term Debt' },
  { code: '21010003', name: 'ActivoBank Credit Card', entity: 'ActivoBank', category: 'Credit Cards', subtype: 'Short-Term Debt' },
  { code: '21010004', name: 'Inter Bank Credit Card', entity: 'Inter Bank', category: 'Credit Cards', subtype: 'Short-Term Debt' },
  { code: '21010005', name: 'WiZink Credit Card', entity: 'WiZink', category: 'Credit Cards', subtype: 'Short-Term Debt' },
  { code: '21020001', name: 'Cofidis Loan', entity: 'Cofidis', category: 'Personal Loans', subtype: 'Short-Term Debt' },
  { code: '21020002', name: 'Mãe Loan', entity: 'Mãe', category: 'Personal Loans', subtype: 'Short-Term Debt' },
  { code: '21020003', name: 'Pedro Loan', entity: 'Pedro', category: 'Personal Loans', subtype: 'Short-Term Debt' },
  { code: '21020004', name: 'Reni Loan', entity: 'Reni', category: 'Personal Loans', subtype: 'Short-Term Debt' },
  { code: '21030001', name: 'Finanças state debt', entity: 'Finanças', category: 'State Debts', subtype: 'Short-Term Debt' },
  { code: '21030002', name: 'Segurança Social state debt', entity: 'Segurança Social', category: 'State Debts', subtype: 'Short-Term Debt' },
  { code: '21030003', name: 'Justiça state debt', entity: 'Justiça', category: 'State Debts', subtype: 'Short-Term Debt' },
  { code: '22010001', name: 'Crédito Automóvel', entity: 'Crédito Automóvel', category: 'Other Loans', subtype: 'Long-Term Debt' },
  { code: '22010002', name: 'Crédito Habitação', entity: 'Crédito Habitação', category: 'Other Loans', subtype: 'Long-Term Debt' }
];

const EXPENSES_COA = [
  { code: '61010001', name: 'Renda', entity: 'Renda', category: 'Utilities', subtype: 'Housing & Utilities', min: 650, max: 1100 },
  { code: '61010002', name: 'Endesa', entity: 'Endesa', category: 'Utilities', subtype: 'Housing & Utilities', min: 35, max: 120 },
  { code: '61010003', name: 'Agua', entity: 'Agua', category: 'Utilities', subtype: 'Housing & Utilities', min: 12, max: 45 },
  { code: '61010004', name: 'NOS', entity: 'NOS', category: 'Utilities', subtype: 'Housing & Utilities', min: 30, max: 75 },
  { code: '61010005', name: 'DIGAL', entity: 'DIGAL', category: 'Utilities', subtype: 'Housing & Utilities', min: 20, max: 60 },
  { code: '61020001', name: 'Obras e Decoração', entity: 'Obras e Decoração', category: 'Maintenance', subtype: 'Housing & Utilities', min: 15, max: 350 },
  { code: '62010001', name: 'Mercearia e Alimentação', entity: 'Mercearia e Alimentação', category: 'Supermarket', subtype: 'Food & Living', min: 10, max: 150 },
  { code: '62010002', name: 'Limpeza e Higiene', entity: 'Limpeza e Higiene', category: 'Supermarket', subtype: 'Food & Living', min: 5, max: 40 },
  { code: '62010003', name: 'Drinks & Alcohol', entity: 'Drinks & Alcohol', category: 'Supermarket', subtype: 'Food & Living', min: 8, max: 60 },
  { code: '62020001', name: 'Pet Food', entity: 'Pet Food', category: 'Pet Care', subtype: 'Food & Living', min: 15, max: 80 },
  { code: '62020002', name: 'Veterinário', entity: 'Veterinário', category: 'Pet Care', subtype: 'Food & Living', min: 40, max: 180 },
  { code: '62030001', name: 'Educação Filhos', entity: 'Educação Filhos', category: 'Dependents', subtype: 'Food & Living', min: 80, max: 250 },
  { code: '63010001', name: 'Gasoline', entity: 'Gasoline', category: 'Personal Vehicle', subtype: 'Transportation', min: 20, max: 90 },
  { code: '63010002', name: 'Tolls (Via Verde)', entity: 'Tolls (Via Verde)', category: 'Personal Vehicle', subtype: 'Transportation', min: 5, max: 50 },
  { code: '63010003', name: 'Repairs & Parking', entity: 'Repairs & Parking', category: 'Personal Vehicle', subtype: 'Transportation', min: 10, max: 300 },
  { code: '63020001', name: 'Public Transport (Navegante)', entity: 'Public Transport (Navegante)', category: 'Public & Taxis', subtype: 'Transportation', min: 30, max: 40 },
  { code: '63020002', name: 'Uber / Taxis', entity: 'Uber / Taxis', category: 'Public & Taxis', subtype: 'Transportation', min: 5, max: 30 },
  { code: '64010001', name: 'Hospital & Consultas', entity: 'Hospital & Consultas', category: 'Medical', subtype: 'Health & Wellness', min: 30, max: 100 },
  { code: '64010002', name: 'Dentista', entity: 'Dentista', category: 'Medical', subtype: 'Health & Wellness', min: 50, max: 200 },
  { code: '64010003', name: 'Psicologia', entity: 'Psicologia', category: 'Medical', subtype: 'Health & Wellness', min: 40, max: 80 },
  { code: '64020001', name: 'Farmácia', entity: 'Farmácia', category: 'Pharmacy', subtype: 'Health & Wellness', min: 5, max: 60 },
  { code: '65010001', name: 'Clothing & Shoes', entity: 'Clothing & Shoes', category: 'Retail / Hobbies & Tech', subtype: 'Shopping & Personal', min: 15, max: 110 },
  { code: '65020001', name: 'Tools & Electronics', entity: 'Tools & Electronics', category: 'Retail / Hobbies & Tech', subtype: 'Shopping & Personal', min: 20, max: 400 },
  { code: '66010001', name: 'Cinema & Dining Out', entity: 'Cinema & Dining Out', category: 'Leisure / Subscriptions', subtype: 'Entertainment', min: 15, max: 90 },
  { code: '66010002', name: 'Nightlife & Drinks', entity: 'Nightlife & Drinks', category: 'Leisure / Subscriptions', subtype: 'Entertainment', min: 10, max: 80 },
  { code: '66020001', name: 'Streaming', entity: 'Streaming', category: 'Leisure / Subscriptions', subtype: 'Entertainment', min: 5, max: 20 },
  { code: '67010001', name: 'PhD', entity: 'PhD', category: 'Professional / Freelance Expenses', subtype: 'Education & Business', min: 100, max: 500 },
  { code: '67010002', name: 'Trainings', entity: 'Trainings', category: 'Professional / Freelance Expenses', subtype: 'Education & Business', min: 40, max: 300 },
  { code: '67020001', name: 'Software & Materials', entity: 'Software & Materials', category: 'Professional / Freelance Expenses', subtype: 'Education & Business', min: 8, max: 90 },
  { code: '68010001', name: 'Health Insurance', entity: 'Health Insurance', category: 'Policies', subtype: 'Insurances', min: 20, max: 80 },
  { code: '68010002', name: 'Car & Motorcycle Insurance', entity: 'Car & Motorcycle Insurance', category: 'Policies', subtype: 'Insurances', min: 15, max: 60 },
  { code: '68010003', name: 'Life Insurance', entity: 'Life Insurance', category: 'Policies', subtype: 'Insurances', min: 10, max: 40 },
  { code: '69010001', name: 'IRS (Pagamento)', entity: 'IRS (Pagamento)', category: 'Direct Taxes', subtype: 'Taxes & State', min: 50, max: 600 },
  { code: '69010002', name: 'IUC / Finanças', entity: 'IUC / Finanças', category: 'Direct Taxes', subtype: 'Taxes & State', min: 20, max: 150 },
  { code: '69010003', name: 'Social Security', entity: 'Social Security', category: 'Direct Taxes', subtype: 'Taxes & State', min: 40, max: 300 },
  { code: '69020001', name: 'Bank Fees & Commissions', entity: 'Bank Fees & Commissions', category: 'Interest & Bank Fees', subtype: 'Financial & Fees', min: 2, max: 15 },
  { code: '69020002', name: 'Fines & Penalties', entity: 'Fines & Penalties', category: 'Interest & Bank Fees', subtype: 'Financial & Fees', min: 15, max: 120 },
  { code: '69020003', name: 'Credit Interest Paid', entity: 'Credit Interest Paid', category: 'Interest & Bank Fees', subtype: 'Financial & Fees', min: 5, max: 80 },
  { code: '69030001', name: 'Donativos Institucionais', entity: 'Donativos Institucionais', category: 'Philanthropy', subtype: 'Giving & Charity', min: 10, max: 100 },
  { code: '69030002', name: 'Prendas a Terceiros', entity: 'Prendas a Terceiros', category: 'Philanthropy', subtype: 'Giving & Charity', min: 15, max: 150 }
];

const INCOME_COA = [
  { code: '71010001', name: 'Base Salary', entity: 'Base Salary', category: 'Payroll', subtype: 'Active Income', min: 1400, max: 3000 },
  { code: '71010002', name: 'Bonus (Scorecard)', entity: 'Bonus (Scorecard)', category: 'Payroll', subtype: 'Active Income', min: 200, max: 1000 },
  { code: '71010003', name: 'Vacation Subsidy', entity: 'Vacation Subsidy', category: 'Payroll', subtype: 'Active Income', min: 1000, max: 2000 },
  { code: '71010004', name: 'Christmas Subsidy', entity: 'Christmas Subsidy', category: 'Payroll', subtype: 'Active Income', min: 1000, max: 2000 },
  { code: '71020001', name: 'Consulting', entity: 'Consulting', category: 'Freelance & Services', subtype: 'Active Income', min: 100, max: 600 },
  { code: '71020002', name: 'Teaching Classes', entity: 'Teaching Classes', category: 'Freelance & Services', subtype: 'Active Income', min: 50, max: 300 },
  { code: '72010001', name: 'Cashbacks CGD', entity: 'Cashbacks CGD', category: 'Cashbacks & Rewards', subtype: 'Passive & Other', min: 1, max: 20 },
  { code: '72010002', name: 'Cashbacks Universo', entity: 'Cashbacks Universo', category: 'Cashbacks & Rewards', subtype: 'Passive & Other', min: 2, max: 30 },
  { code: '72010003', name: 'Family Gifts', entity: 'Family Gifts', category: 'Cashbacks & Rewards', subtype: 'Passive & Other', min: 30, max: 300 },
  { code: '72020001', name: 'IRS Refund', entity: 'IRS Refund', category: 'Refunds', subtype: 'Passive & Other', min: 100, max: 700 },
  { code: '72020002', name: 'Health Insurance Refund', entity: 'Health Insurance Refund', category: 'Refunds', subtype: 'Passive & Other', min: 10, max: 90 }
];

function generateDoubleEntryLedger() {
  const transactions = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 90); // 90 days span

  for (let i = 0; i < 100; i++) {
    // Distribute transactions monotonically across the 90 days span
    const transDate = new Date(baseDate);
    transDate.setMinutes(0);
    transDate.setMinutes(transDate.getMinutes() + i * 1296); // 1296 minutes interval

    const dateISO = transDate.toISOString();
    const yyyymmdd = dateISO.slice(0, 10);
    const transId = generateMockUUID(i);
    const paymentStatus = rand() < 0.85 ? 'Completed' : 'Pending';

    let amount = 0;
    let sourceAccount = '';
    let targetAccount = '';
    let type = '';
    let subtype = '';
    let entity = '';
    let category = '';
    let flow = 'neutral';

    // Distribution profile: 50% Expenses, 25% Incomes, 25% Asset Transfers / Balanced Allocations
    if (i < 50) {
      // 1. Expense Transaction (Asset Checking / Card Liability -> Expense Account)
      const selectedExpense = getRandomElement(EXPENSES_COA);
      const checkingOrigin = getRandomElement(CHECKING_ACCOUNTS).code;
      const creditOrigin = getRandomElement(LIABILITIES_COA.filter(l => l.category === 'Credit Cards')).code;
      
      sourceAccount = rand() < 0.65 ? checkingOrigin : creditOrigin;
      targetAccount = selectedExpense.code;
      amount = getRandomRange(selectedExpense.min, selectedExpense.max);
      type = 'Expenses';
      flow = 'outflow';
      subtype = selectedExpense.subtype;
      category = selectedExpense.category;
      entity = selectedExpense.entity;

    } else if (i < 75) {
      // 2. Income Transaction (Income Account -> Asset Account)
      const selectedIncome = getRandomElement(INCOME_COA);
      const checkingTarget = getRandomElement(CHECKING_ACCOUNTS).code;
      const savingsTarget = getRandomElement(SAVINGS_ACCOUNTS).code;
      
      sourceAccount = selectedIncome.code;
      targetAccount = rand() < 0.80 ? checkingTarget : savingsTarget;
      amount = getRandomRange(selectedIncome.min, selectedIncome.max);
      type = 'Income';
      flow = 'inflow';
      subtype = selectedIncome.subtype;
      category = selectedIncome.category;
      entity = selectedIncome.entity;

    } else {
      // 3. Asset Transfers / Balanced Allocations (Checking -> Asset Accounts / Liabilities payoff)
      const sourceAsset = getRandomElement(CHECKING_ACCOUNTS);
      sourceAccount = sourceAsset.code;
      flow = 'neutral';

      const assetCycleTarget = ALL_ASSETS[i % ALL_ASSETS.length];

      if (assetCycleTarget.code !== sourceAccount) {
        // Checking -> Savings, Sinking Funds, Investments, Fixed Assets or Cash
        targetAccount = assetCycleTarget.code;
        amount = getRandomRange(50, 450);
        type = 'Assets';
        subtype = assetCycleTarget.subtype;
        category = assetCycleTarget.category;
        entity = assetCycleTarget.entity;
      } else {
        // Fallback to Paying off Debt statements
        const debtTarget = getRandomElement(LIABILITIES_COA);
        targetAccount = debtTarget.code;
        amount = getRandomRange(100, 500);
        type = 'Liabilities';
        subtype = debtTarget.subtype;
        category = debtTarget.category;
        entity = debtTarget.entity;
      }
    }

    const monthIndex = transDate.getMonth();
    const quarterNumber = Math.floor(monthIndex / 3) + 1;

    transactions.push({
      id: transId,
      profile_id: STATIC_PROFILE_UUID,
      created_at: dateISO,
      value_date: yyyymmdd,
      posting_date: yyyymmdd,
      payment_date: yyyymmdd,
      year: transDate.getFullYear(),
      month: MONTHS_NAMES[monthIndex],
      quarter: `Q${quarterNumber}`,
      amount,
      source_account: sourceAccount,
      target_account: targetAccount,
      type,
      subtype,
      entity,
      category,
      flow,
      payment_status: paymentStatus,
      origin: 'sandbox',
      description: 'Mock ledger entry'
    });
  }

  // Final ascending chronological order sort
  return transactions.sort((a, b) => new Date(a.posting_date) - new Date(b.posting_date));
}

export const MOCK_TRANSACTIONS = generateDoubleEntryLedger();