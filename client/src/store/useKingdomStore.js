import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import i18n from '../i18n';
import { toast } from 'react-hot-toast';
import { defaultAccountMappings, setDynamicAccountMappings } from '../utils/accountMappings';

// Local storage helpers
const loadLocal = (key, defaultVal) => {
  try {
    const saved = localStorage.getItem(`eldoria_${key}`);
    if (key === 'templates' && saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length < 15) {
        return defaultVal;
      }
    }
    return saved ? JSON.parse(saved) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const saveLocal = (key, val) => {
  try {
    localStorage.setItem(`eldoria_${key}`, JSON.stringify(val));
  } catch {
    // Ignore storage quota errors
  }
};

// Purge legacy taxonomic caches to save local storage namespace
[
  'classOptions', 
  'subClassOptions', 
  'statusOptions', 
  'monthOptions', 
  'entityOptions', 
  'categoryOptions', 
  'subtypeToCategoryMap', 
  'entityMappings',
  'subtypeTypes'
].forEach(key => {
  try {
    localStorage.removeItem(`eldoria_${key}`);
  } catch {
    // Ignore
  }
});

// Flat Matrix default fallback compliant with 8-digit COA structure
export const defaultFlatMatrix = [
  // ASSETS (Type: Assets)
  // Subtype: Liquid Assets
  { code: "11010001", account_name: "Checking Accounts CGD", type: "Assets", subtype: "Liquid Assets", category: "Checking Accounts", entity: "CGD" },
  { code: "11010002", account_name: "Checking Accounts Universo", type: "Assets", subtype: "Liquid Assets", category: "Checking Accounts", entity: "Universo" },
  { code: "11010003", account_name: "Checking Accounts ActivoBank", type: "Assets", subtype: "Liquid Assets", category: "Checking Accounts", entity: "ActivoBank" },
  { code: "11010004", account_name: "Checking Accounts Inter Bank", type: "Assets", subtype: "Liquid Assets", category: "Checking Accounts", entity: "Inter Bank" },
  { code: "11010005", account_name: "Checking Accounts WiZink", type: "Assets", subtype: "Liquid Assets", category: "Checking Accounts", entity: "WiZink" },
  { code: "11020001", account_name: "Savings & Wallets CGD", type: "Assets", subtype: "Liquid Assets", category: "Savings & Wallets", entity: "CGD" },
  { code: "11020002", account_name: "Savings & Wallets Universo", type: "Assets", subtype: "Liquid Assets", category: "Savings & Wallets", entity: "Universo" },
  { code: "11020003", account_name: "Savings & Wallets ActivoBank", type: "Assets", subtype: "Liquid Assets", category: "Savings & Wallets", entity: "ActivoBank" },
  { code: "11020004", account_name: "Savings & Wallets Inter Bank", type: "Assets", subtype: "Liquid Assets", category: "Savings & Wallets", entity: "Inter Bank" },
  { code: "11020005", account_name: "Savings & Wallets WiZink", type: "Assets", subtype: "Liquid Assets", category: "Savings & Wallets", entity: "WiZink" },
  { code: "11030001", account_name: "Cash Dinheiro Físico", type: "Assets", subtype: "Liquid Assets", category: "Cash", entity: "Dinheiro Físico" },

  // Subtype: Sinking Funds
  { code: "12010001", account_name: "Short-Term Goals Fundo Férias", type: "Assets", subtype: "Sinking Funds", category: "Short-Term Goals", entity: "Fundo Férias" },
  { code: "12010002", account_name: "Short-Term Goals Fundo Emergência", type: "Assets", subtype: "Sinking Funds", category: "Short-Term Goals", entity: "Fundo Emergência" },

  // Subtype: Investments
  { code: "13010001", account_name: "Invest Accounts CGD", type: "Assets", subtype: "Investments", category: "Invest Accounts", entity: "CGD" },
  { code: "13010002", account_name: "Invest Accounts Universo", type: "Assets", subtype: "Investments", category: "Invest Accounts", entity: "Universo" },
  { code: "13010003", account_name: "Invest Accounts ActivoBank", type: "Assets", subtype: "Investments", category: "Invest Accounts", entity: "ActivoBank" },
  { code: "13010004", account_name: "Invest Accounts Inter Bank", type: "Assets", subtype: "Investments", category: "Invest Accounts", entity: "Inter Bank" },
  { code: "13010005", account_name: "Invest Accounts WiZink", type: "Assets", subtype: "Investments", category: "Invest Accounts", entity: "WiZink" },
  { code: "13020001", account_name: "Retirement PPR", type: "Assets", subtype: "Investments", category: "Retirement", entity: "PPR" },

  // Subtype: Fixed Assets
  { code: "14010001", account_name: "Real Estate Habitação Própria", type: "Assets", subtype: "Fixed Assets", category: "Real Estate", entity: "Habitação Própria" },
  { code: "14020001", account_name: "Vehicles Carro Pessoal", type: "Assets", subtype: "Fixed Assets", category: "Vehicles", entity: "Carro Pessoal" },
  { code: "14020002", account_name: "Vehicles Mota Pessoal", type: "Assets", subtype: "Fixed Assets", category: "Vehicles", entity: "Mota Pessoal" },

  // LIABILITIES (Type: Liabilities)
  // Subtype: Short-Term Debt
  { code: "21010001", account_name: "Credit Cards CGD", type: "Liabilities", subtype: "Short-Term Debt", category: "Credit Cards", entity: "CGD" },
  { code: "21010002", account_name: "Credit Cards Universo", type: "Liabilities", subtype: "Short-Term Debt", category: "Credit Cards", entity: "Universo" },
  { code: "21010003", account_name: "Credit Cards ActivoBank", type: "Liabilities", subtype: "Short-Term Debt", category: "Credit Cards", entity: "ActivoBank" },
  { code: "21010004", account_name: "Credit Cards Inter Bank", type: "Liabilities", subtype: "Short-Term Debt", category: "Credit Cards", entity: "Inter Bank" },
  { code: "21010005", account_name: "Credit Cards WiZink", type: "Liabilities", subtype: "Short-Term Debt", category: "Credit Cards", entity: "WiZink" },
  { code: "21020001", account_name: "Personal Loans Cofidis", type: "Liabilities", subtype: "Short-Term Debt", category: "Personal Loans", entity: "Cofidis" },
  { code: "21020002", account_name: "Personal Loans Mãe", type: "Liabilities", subtype: "Short-Term Debt", category: "Personal Loans", entity: "Mãe" },
  { code: "21020003", account_name: "Personal Loans Pedro", type: "Liabilities", subtype: "Short-Term Debt", category: "Personal Loans", entity: "Pedro" },
  { code: "21020004", account_name: "Personal Loans Reni", type: "Liabilities", subtype: "Short-Term Debt", category: "Personal Loans", entity: "Reni" },
  { code: "21030001", account_name: "State Debts Finanças", type: "Liabilities", subtype: "Short-Term Debt", category: "State Debts", entity: "Finanças" },
  { code: "21030002", account_name: "State Debts Segurança Social", type: "Liabilities", subtype: "Short-Term Debt", category: "State Debts", entity: "Segurança Social" },
  { code: "21030003", account_name: "State Debts Justiça", type: "Liabilities", subtype: "Short-Term Debt", category: "State Debts", entity: "Justiça" },

  // Subtype: Long-Term Debt
  { code: "22010001", account_name: "Other Loans Crédito Automóvel", type: "Liabilities", subtype: "Long-Term Debt", category: "Other Loans", entity: "Crédito Automóvel" },
  { code: "22010002", account_name: "Other Loans Crédito Habitação", type: "Liabilities", subtype: "Long-Term Debt", category: "Other Loans", entity: "Crédito Habitação" },

  // EXPENSES (Type: Expenses)
  // Subtype: Housing & Utilities
  { code: "61010001", account_name: "Utilities Renda", type: "Expenses", subtype: "Housing & Utilities", category: "Utilities", entity: "Renda" },
  { code: "61010002", account_name: "Utilities Endesa", type: "Expenses", subtype: "Housing & Utilities", category: "Utilities", entity: "Endesa" },
  { code: "61010003", account_name: "Utilities Agua", type: "Expenses", subtype: "Housing & Utilities", category: "Utilities", entity: "Agua" },
  { code: "61010004", account_name: "Utilities NOS", type: "Expenses", subtype: "Housing & Utilities", category: "Utilities", entity: "NOS" },
  { code: "61010005", account_name: "Utilities DIGAL", type: "Expenses", subtype: "Housing & Utilities", category: "Utilities", entity: "DIGAL" },
  { code: "61020001", account_name: "Maintenance Obras e Decoração", type: "Expenses", subtype: "Housing & Utilities", category: "Maintenance", entity: "Obras e Decoração" },

  // Subtype: Food & Living
  { code: "62010001", account_name: "Supermarket Mercearia e Alimentação", type: "Expenses", subtype: "Food & Living", category: "Supermarket", entity: "Mercearia e Alimentação" },
  { code: "62010002", account_name: "Supermarket Limpeza e Higiene", type: "Expenses", subtype: "Food & Living", category: "Supermarket", entity: "Limpeza e Higiene" },
  { code: "62010003", account_name: "Supermarket Drinks & Alcohol", type: "Expenses", subtype: "Food & Living", category: "Supermarket", entity: "Drinks & Alcohol" },
  { code: "62020001", account_name: "Pet Care Pet Food", type: "Expenses", subtype: "Food & Living", category: "Pet Care", entity: "Pet Food" },
  { code: "62020002", account_name: "Pet Care Veterinário", type: "Expenses", subtype: "Food & Living", category: "Pet Care", entity: "Veterinário" },
  { code: "62030001", account_name: "Dependents Educação Filhos", type: "Expenses", subtype: "Food & Living", category: "Dependents", entity: "Educação Filhos" },

  // Subtype: Transportation
  { code: "63010001", account_name: "Personal Vehicle Gasoline", type: "Expenses", subtype: "Transportation", category: "Personal Vehicle", entity: "Gasoline" },
  { code: "63010002", account_name: "Personal Vehicle Tolls Via Verde", type: "Expenses", subtype: "Transportation", category: "Personal Vehicle", entity: "Tolls Via Verde" },
  { code: "63010003", account_name: "Personal Vehicle Repairs & Parking", type: "Expenses", subtype: "Transportation", category: "Personal Vehicle", entity: "Repairs & Parking" },
  { code: "63020001", account_name: "Public & Taxis Public Transport Navegante", type: "Expenses", subtype: "Transportation", category: "Public & Taxis", entity: "Public Transport Navegante" },
  { code: "63020002", account_name: "Public & Taxis Uber / Taxis", type: "Expenses", subtype: "Transportation", category: "Public & Taxis", entity: "Uber / Taxis" },

  // Subtype: Health & Wellness
  { code: "64010001", account_name: "Medical Hospital & Consultas", type: "Expenses", subtype: "Health & Wellness", category: "Medical", entity: "Hospital & Consultas" },
  { code: "64010002", account_name: "Medical Dentista", type: "Expenses", subtype: "Health & Wellness", category: "Medical", entity: "Dentista" },
  { code: "64010003", account_name: "Medical Psicologia", type: "Expenses", subtype: "Health & Wellness", category: "Medical", entity: "Psicologia" },
  { code: "64020001", account_name: "Pharmacy Farmácia", type: "Expenses", subtype: "Health & Wellness", category: "Pharmacy", entity: "Farmácia" },

  // Subtype: Shopping & Personal
  { code: "65010001", account_name: "Retail Clothing & Shoes", type: "Expenses", subtype: "Shopping & Personal", category: "Retail", entity: "Clothing & Shoes" },
  { code: "65020001", account_name: "Hobbies & Tech Tools & Electronics", type: "Expenses", subtype: "Shopping & Personal", category: "Hobbies & Tech", entity: "Tools & Electronics" },

  // Subtype: Entertainment
  { code: "66010001", account_name: "Leisure Cinema & Dining Out", type: "Expenses", subtype: "Entertainment", category: "Leisure", entity: "Cinema & Dining Out" },
  { code: "66010002", account_name: "Leisure Nightlife & Drinks", type: "Expenses", subtype: "Entertainment", category: "Leisure", entity: "Nightlife & Drinks" },
  { code: "66020001", account_name: "Subscriptions Streaming", type: "Expenses", subtype: "Entertainment", category: "Subscriptions", entity: "Streaming" },

  // Subtype: Education & Business
  { code: "67010001", account_name: "Professional PhD", type: "Expenses", subtype: "Education & Business", category: "Professional", entity: "PhD" },
  { code: "67010002", account_name: "Professional Trainings", type: "Expenses", subtype: "Education & Business", category: "Professional", entity: "Trainings" },
  { code: "67020001", account_name: "Freelance Expenses Software & Materials", type: "Expenses", subtype: "Education & Business", category: "Freelance Expenses", entity: "Software & Materials" },

  // Subtype: Insurances
  { code: "68010001", account_name: "Policies Health Insurance", type: "Expenses", subtype: "Insurances", category: "Policies", entity: "Health Insurance" },
  { code: "68010002", account_name: "Policies Car & Motorcycle Insurance", type: "Expenses", subtype: "Insurances", category: "Policies", entity: "Car & Motorcycle Insurance" },
  { code: "68010003", account_name: "Policies Life Insurance", type: "Expenses", subtype: "Insurances", category: "Policies", entity: "Life Insurance" },

  // Subtype: Taxes & State
  { code: "69010001", account_name: "Direct Taxes IRS Pagamento", type: "Expenses", subtype: "Taxes & State", category: "Direct Taxes", entity: "IRS Pagamento" },
  { code: "69010002", account_name: "Direct Taxes IUC / Finanças", type: "Expenses", subtype: "Taxes & State", category: "Direct Taxes", entity: "IUC / Finanças" },
  { code: "69010003", account_name: "Direct Taxes Social Security", type: "Expenses", subtype: "Taxes & State", category: "Direct Taxes", entity: "Social Security" },

  // Subtype: Financial & Fees
  { code: "69020001", account_name: "Interest & Bank Fees Bank Fees & Commissions", type: "Expenses", subtype: "Financial & Fees", category: "Interest & Bank Fees", entity: "Bank Fees & Commissions" },
  { code: "69020002", account_name: "Interest & Bank Fees Fines & Penalties", type: "Expenses", subtype: "Financial & Fees", category: "Interest & Bank Fees", entity: "Fines & Penalties" },
  { code: "69020003", account_name: "Interest & Bank Fees Credit Interest Paid", type: "Expenses", subtype: "Financial & Fees", category: "Interest & Bank Fees", entity: "Credit Interest Paid" },

  // Subtype: Giving & Charity
  { code: "69030001", account_name: "Philanthropy Donativos Institucionais", type: "Expenses", subtype: "Giving & Charity", category: "Philanthropy", entity: "Donativos Institucionais" },
  { code: "69030002", account_name: "Philanthropy Prendas a Terceiros", type: "Expenses", subtype: "Giving & Charity", category: "Philanthropy", entity: "Prendas a Terceiros" },

  // INCOME (Type: Income)
  // Subtype: Active Income
  { code: "71010001", account_name: "Payroll Base Salary", type: "Income", subtype: "Active Income", category: "Payroll", entity: "Base Salary" },
  { code: "71010002", account_name: "Payroll Bonus Scorecard", type: "Income", subtype: "Active Income", category: "Payroll", entity: "Bonus Scorecard" },
  { code: "71010003", account_name: "Payroll Vacation Subsidy", type: "Income", subtype: "Active Income", category: "Payroll", entity: "Vacation Subsidy" },
  { code: "71010004", account_name: "Payroll Christmas Subsidy", type: "Income", subtype: "Active Income", category: "Payroll", entity: "Christmas Subsidy" },
  { code: "71020001", account_name: "Freelance & Services Consulting", type: "Income", subtype: "Active Income", category: "Freelance & Services", entity: "Consulting" },
  { code: "71020002", account_name: "Freelance & Services Teaching Classes", type: "Income", subtype: "Active Income", category: "Freelance & Services", entity: "Teaching Classes" },

  // Subtype: Passive & Other
  { code: "72010001", account_name: "Cashbacks & Rewards Cashbacks CGD", type: "Income", subtype: "Passive & Other", category: "Cashbacks & Rewards", entity: "Cashbacks CGD" },
  { code: "72010002", account_name: "Cashbacks & Rewards Cashbacks Universo", type: "Income", subtype: "Passive & Other", category: "Cashbacks & Rewards", entity: "Cashbacks Universo" },
  { code: "72010003", account_name: "Cashbacks & Rewards Family Gifts", type: "Income", subtype: "Passive & Other", category: "Cashbacks & Rewards", entity: "Family Gifts" },
  { code: "72020001", account_name: "Refunds IRS Refund", type: "Income", subtype: "Passive & Other", category: "Refunds", entity: "IRS Refund" },
  { code: "72020002", account_name: "Refunds Health Insurance Refund", type: "Income", subtype: "Passive & Other", category: "Refunds", entity: "Health Insurance Refund" }
];

const initialAccountMappings = loadLocal('accountMappings', defaultAccountMappings);
setDynamicAccountMappings(initialAccountMappings);

export const useKingdomStore = create((set, get) => ({
  // Core State
  flatMatrix: loadLocal('flatMatrix', defaultFlatMatrix),
  accountMappings: initialAccountMappings,
  gold: 0,
  gems: 100,
  xp: 0,
  level: 1,
  email: 'lord.eldoria@kingdom.gov',
  transactions: [],
  accountBalances: [],
  isLoading: false,
  language: loadLocal('language', 'en'),
  user: null,
  role: 'lord',
  mineLevel: 1,
  lastCollectionTime: null,
  
  // Dashboard Analytics States
  expenseVarianceData: {
    current_period_expenses: 0,
    previous_period_expenses: 0,
    absolute_variance: 0,
    percentage_variance: 0
  },
  savingsRateData: {
    total_income: 0,
    total_expenses: 0,
    savings_rate_percentage: 0
  },
  runwayData: {
    liquid_cash: 0,
    monthly_burn_rate: 0,
    runway_months: 0
  },
  dtiData: {
    total_amortization: 0,
    total_income: 0,
    dti_percentage: 0
  },

  // Base Options
  fromOptions: loadLocal('fromOptions', ['Pedro', 'Reni', 'Consolidated']),
  statusOptions: ['Pending', 'Completed'],
  monthOptions: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],

  // 8-Digit COA Conforming Transaction Templates
  templates: loadLocal('templates', [
    {
      "name": "Transfers",
      "icon": "💸",
      "data": {
        "from": "Consolidated",
        "transaction_type": "Assets",
        "transaction_subtype": "Liquid Assets",
        "entity": "CGD",
        "transaction_category": "Savings & Wallets",
        "target_account": "11020001",
        "source_dest_bank": "11010001",
        "flow": "neutral",
        "payment_status": "Completed",
        "description": "Internal transfer"
      }
    },
    {
      "name": "Use Credit card",
      "icon": "💳",
      "data": {
        "from": "Pedro",
        "transaction_type": "Liabilities",
        "transaction_subtype": "Short-Term Debt",
        "entity": "Universo",
        "transaction_category": "Credit Cards",
        "target_account": "",
        "source_dest_bank": "21010002",
        "flow": "outflow",
        "payment_status": "Completed",
        "description": "Credit card purchase"
      }
    },
    {
      "name": "Pay Credit card",
      "icon": "🧾",
      "data": {
        "from": "Pedro",
        "transaction_type": "Liabilities",
        "transaction_subtype": "Short-Term Debt",
        "entity": "WiZink",
        "transaction_category": "Credit Cards",
        "target_account": "21010005",
        "source_dest_bank": "11010001",
        "flow": "outflow",
        "payment_status": "Completed",
        "description": "Credit card payment"
      }
    }
  ]),

  // Dynamic Taxonomic Helper Selectors (Version 2.0 Flat Matrix Rules)
  getTypes: () => {
    const matrix = get().flatMatrix || [];
    const uniqueTypes = [...new Set(matrix.map(row => row.type).filter(Boolean))];
    const preferredOrder = ['Assets', 'Liabilities', 'Income', 'Expenses'];
    return uniqueTypes.sort((a, b) => preferredOrder.indexOf(a) - preferredOrder.indexOf(b));
  },

  getSubtypesByType: (type) => {
    const matrix = get().flatMatrix || [];
    return [...new Set(
      matrix
        .filter(row => !type || row.type === type)
        .map(row => row.subtype)
        .filter(Boolean)
    )];
  },

  getCategoriesBySubtype: (subtype) => {
    const matrix = get().flatMatrix || [];
    return [...new Set(
      matrix
        .filter(row => !subtype || row.subtype === subtype)
        .map(row => row.category)
        .filter(Boolean)
    )];
  },

  getEntitiesByCategory: (category) => {
    const matrix = get().flatMatrix || [];
    return [...new Set(
      matrix
        .filter(row => !category || row.category === category)
        .map(row => row.entity)
        .filter(Boolean)
    )];
  },

  getAccountCode: (type, subtype, category, entity) => {
    const matrix = get().flatMatrix || [];
    const match = matrix.find(row => 
      (!type || row.type === type) &&
      (!subtype || row.subtype === subtype) &&
      (!category || row.category === category) &&
      (!entity || row.entity === entity)
    );
    return match ? match.code : '';
  },

  // Supabase Syncing Mechanics
  syncSettings: async (updates) => {
    set(updates);
    Object.entries(updates).forEach(([key, val]) => {
      saveLocal(key, val);
      if (key === 'accountMappings') {
        setDynamicAccountMappings(val);
      }
    });
    const userId = get().user?.id;
    if (userId) {
      const settings = {
        templates: get().templates,
        fromOptions: get().fromOptions,
        flatMatrix: get().flatMatrix,
        accountMappings: get().accountMappings,
        language: get().language,
        ...updates
      };
      try {
        await supabase
          .from('profiles')
          .update({ settings })
          .eq('id', userId);
      } catch (err) {
        console.error('Failed to sync settings with DB:', err);
      }
    }
  },

  // Option Mutation Functions Integrated with Flat Matrix
  addOption: async (type, value, extraData) => {
    if (type === 'quickAction') {
      const updated = [...get().templates, { name: value, icon: extraData.icon || '⚡', data: extraData.data }];
      get().syncSettings({ templates: updated });
      return;
    }
    if (type === 'quickActionImportBulk') {
      get().syncSettings({ templates: value });
      return;
    }

    if (type === 'entity' && extraData?.category) {
      const matrix = [...get().flatMatrix];
      const category = extraData.category;
      const targetCategoryRow = matrix.find(r => r.category === category);
      
      if (targetCategoryRow) {
        const rowType = targetCategoryRow.type;
        const rowSubtype = targetCategoryRow.subtype;
        const prefix = targetCategoryRow.code.substring(0, 4);
        
        const siblingRows = matrix.filter(r => r.code.startsWith(prefix));
        const maxSuffix = siblingRows.reduce((max, r) => {
          const suffix = parseInt(r.code.substring(4), 10) || 0;
          return suffix > max ? suffix : max;
        }, 0);
        
        const newCode = prefix + String(maxSuffix + 1).padStart(4, '0');
        const newRow = {
          code: newCode,
          account_name: `${category} ${value}`,
          type: rowType,
          subtype: rowSubtype,
          category: category,
          entity: value
        };

        const updatedMatrix = [...matrix, newRow];
        set({ flatMatrix: updatedMatrix });
        get().syncSettings({ flatMatrix: updatedMatrix });

        const userId = get().user?.id;
        if (userId) {
          try {
            await supabase.from('dim_contas').insert([newRow]);
          } catch (err) {
            console.error('Failed to sync new option row to dim_contas:', err);
          }
        }
      }
    }
  },

  editOption: async (type, oldValue, newValue, extraData) => {
    if (type === 'quickAction') {
      const updated = get().templates.map(tpl => {
        if (tpl.name === oldValue) {
          return { name: newValue, icon: extraData.icon || '⚡', data: extraData.data };
        }
        return tpl;
      });
      get().syncSettings({ templates: updated });
      return;
    }

    if (type === 'entity') {
      const updatedMatrix = get().flatMatrix.map(row => {
        if (row.entity === oldValue) {
          return { ...row, entity: newValue, account_name: row.account_name.replace(oldValue, newValue) };
        }
        return row;
      });
      set({ flatMatrix: updatedMatrix });
      get().syncSettings({ flatMatrix: updatedMatrix });

      const userId = get().user?.id;
      if (userId) {
        try {
          await supabase
            .from('dim_contas')
            .update({ entity: newValue })
            .eq('entity', oldValue);
        } catch (err) {
          console.error('Failed to update dim_contas entity:', err);
        }
      }
    }
  },

  deleteOption: async (type, value) => {
    if (type === 'quickAction') {
      const updated = get().templates.filter(tpl => tpl.name !== value);
      get().syncSettings({ templates: updated });
      return;
    }

    if (type === 'entity') {
      const updatedMatrix = get().flatMatrix.filter(row => row.entity !== value);
      set({ flatMatrix: updatedMatrix });
      get().syncSettings({ flatMatrix: updatedMatrix });

      const userId = get().user?.id;
      if (userId) {
        try {
          await supabase
            .from('dim_contas')
            .delete()
            .eq('entity', value);
        } catch (err) {
          console.error('Failed to delete dim_contas entity:', err);
        }
      }
    }
  },

  // Central Database Fetching for Chart of Accounts (dim_contas)
  fetchChartOfAccounts: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('dim_contas')
        .select('*')
        .order('code', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        set({ flatMatrix: data });
        saveLocal('flatMatrix', data);
      }
    } catch (err) {
      console.error('Failed to fetch chart of accounts (dim_contas):', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // Synchronize gamified indicators and profile levels
  fetchKingdomData: async (profileId) => {
    const userId = get().user?.id || profileId;
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        set({
          email: data.email || 'guest@medieval.stuff',
          gold: data.gold ? Number(data.gold) : 0,
          gems: data.gems !== undefined ? Number(data.gems) : 100,
          level: data.level || 1,
          xp: data.xp || 0,
        });

        const { data: mineData, error: mineError } = await supabase
          .from('buildings')
          .select('*')
          .eq('profile_id', userId)
          .eq('building_type', 'gold_mine')
          .maybeSingle();

        if (mineError) {
          console.error('Error fetching gold mine:', mineError);
        }

        if (mineData) {
          set({
            mineLevel: mineData.level,
            lastCollectionTime: mineData.last_collection
          });
        } else {
          set({
            mineLevel: 1,
            lastCollectionTime: new Date().toISOString()
          });
        }

        if (data.settings) {
          const s = data.settings;
          const accMaps = s.accountMappings || get().accountMappings;
          setDynamicAccountMappings(accMaps);

          set({
            templates: s.templates || get().templates,
            fromOptions: s.fromOptions || get().fromOptions,
            accountMappings: accMaps,
            language: s.language || get().language
          });
          if (s.language) {
            i18n.changeLanguage(s.language);
          }
        }
      }
      await get().fetchChartOfAccounts();
    } catch (err) {
      console.error('Failed to fetch kingdom data:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // Calculate live balances strictly with 8-digit Liquid Cash Prefixes (1101, 1102, 1103)
  fetchDashboardData: async (profileId) => {
    const userId = get().user?.id || profileId;
    set({ isLoading: true });
    try {
      const [transactionsRes, balancesRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('profile_id', userId).order('created_at', { ascending: false }).limit(10000),
        supabase.from('account_balances').select('*').eq('profile_id', userId)
      ]);

      if (transactionsRes.error) console.error('Error fetching transactions:', transactionsRes.error);
      if (balancesRes.error) console.error('Error fetching account balances:', balancesRes.error);

      const txs = (transactionsRes.data || []).map((tx) => ({
        ...tx,
        from: tx.origin || tx.from
      }));

      const isCompleted = (status) => ['Completed', 'Paid', 'Paid on Time', 'Paid Late'].includes(status);
      const netCash = txs
        .filter(t => isCompleted(t.payment_status))
        .reduce((sum, t) => {
          const amt = Number(t.amount) || 0;
          if (t.transaction_type === 'Income') {
            const src = t.source_dest_bank || '11010001';
            if (src.startsWith('1101') || src.startsWith('1102') || src.startsWith('1103')) return sum + amt;
          }
          if (t.transaction_type === 'Expense') {
            const src = t.source_dest_bank || '11010001';
            if (src.startsWith('1101') || src.startsWith('1102') || src.startsWith('1103')) return sum - amt;
          }
          if (t.transaction_type === 'Assets' || t.transaction_type === 'Liabilities') {
            const src = t.source_dest_bank;
            const tgt = t.target_account;
            let effect = 0;
            if (t.flow === 'neutral') {
              if (src && (src.startsWith('1101') || src.startsWith('1102') || src.startsWith('1103'))) effect -= amt;
              if (tgt && (tgt.startsWith('1101') || tgt.startsWith('1102') || tgt.startsWith('1103'))) effect += amt;
            } else if (t.flow === 'inflow') {
              if (src && (src.startsWith('1101') || src.startsWith('1102') || src.startsWith('1103'))) effect += amt;
              if (tgt && (tgt.startsWith('1101') || tgt.startsWith('1102') || tgt.startsWith('1103'))) effect -= amt;
            } else if (t.flow === 'outflow') {
              if (src && (src.startsWith('1101') || src.startsWith('1102') || src.startsWith('1103'))) effect -= amt;
              if (tgt && (tgt.startsWith('1101') || tgt.startsWith('1102') || tgt.startsWith('1103'))) effect += amt;
            }
            return sum + effect;
          }
          return sum;
        }, 0);

      const startingGold = (balancesRes.data || [])
        .filter(b => b.account_code && (b.account_code.startsWith('1101') || b.account_code.startsWith('1102') || b.account_code.startsWith('1103')))
        .reduce((sum, b) => sum + (Number(b.balance) || 0), 0);
      const calculatedGold = Math.floor(startingGold + netCash);

      if (calculatedGold !== get().gold) {
        set({ gold: calculatedGold });
      }

      set({
        transactions: txs,
        accountBalances: balancesRes.data || []
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // Metric calculation functions invoking Postgres RPC endpoints
  fetchExpenseVariance: async (years = [], quarters = [], months = []) => {
    const userId = get().user?.id || '00000000-0000-0000-0000-000000000000';
    try {
      const { data, error } = await supabase.rpc('calculate_expense_variance', {
        p_profile_id: userId,
        p_years: years,
        p_quarters: quarters,
        p_months: months
      });
      if (error) throw error;
      if (data && data[0]) {
        set({ expenseVarianceData: data[0] });
      }
    } catch (err) {
      console.error('Failed to execute calculate_expense_variance RPC:', err);
    }
  },

  fetchSavingsRate: async (years = [], quarters = [], months = []) => {
    const userId = get().user?.id || '00000000-0000-0000-0000-000000000000';
    try {
      const { data, error } = await supabase.rpc('calculate_savings_rate', {
        p_profile_id: userId,
        p_years: years,
        p_quarters: quarters,
        p_months: months
      });
      if (error) throw error;
      if (data && data[0]) {
        set({ savingsRateData: data[0] });
      }
    } catch (err) {
      console.error('Failed to execute calculate_savings_rate RPC:', err);
    }
  },

  fetchRunwayData: async (years = [], quarters = [], months = []) => {
    const userId = get().user?.id || '00000000-0000-0000-0000-000000000000';
    try {
      const { data, error } = await supabase.rpc('calculate_kingdom_runway', {
        p_profile_id: userId,
        p_years: years,
        p_quarters: quarters,
        p_months: months
      });
      if (error) throw error;
      if (data && data[0]) {
        set({ runwayData: data[0] });
      }
    } catch (err) {
      console.error('Failed to execute calculate_kingdom_runway RPC:', err);
    }
  },

  fetchDtiData: async (years = [], quarters = [], months = []) => {
    const userId = get().user?.id || '00000000-0000-0000-0000-000000000000';
    try {
      const { data, error } = await supabase.rpc('calculate_dti_ratio', {
        p_profile_id: userId,
        p_years: years,
        p_quarters: quarters,
        p_months: months
      });
      if (error) throw error;
      if (data && data[0]) {
        set({ dtiData: data[0] });
      }
    } catch (err) {
      console.error('Failed to execute calculate_dti_ratio RPC:', err);
    }
  },

  updateAccountBalance: async (profileId, accountCode, balanceAmount) => {
    const userId = get().user?.id || profileId;
    set({ isLoading: true });
    try {
      const { data: existing, error: checkError } = await supabase
        .from('account_balances')
        .select('*')
        .eq('profile_id', userId)
        .eq('account_code', accountCode)
        .maybeSingle();

      if (checkError) throw checkError;

      let res;
      if (existing) {
        res = await supabase
          .from('account_balances')
          .update({ balance: Number(balanceAmount) })
          .eq('profile_id', userId)
          .eq('account_code', accountCode);
      } else {
        res = await supabase
          .from('account_balances')
          .insert({
            profile_id: userId,
            account_code: accountCode,
            balance: Number(balanceAmount)
          });
      }

      if (res.error) throw res.error;

      await get().fetchDashboardData(userId);
      return { success: true };
    } catch (err) {
      console.error('Error updating account balance:', err);
      return { success: false, error: err.message || err };
    } finally {
      set({ isLoading: false });
    }
  },

  // Double-entry ledger integration supporting math operations
  registerTransaction: async (profileId, transactionData) => {
    const userId = get().user?.id || profileId;
    const tempId = 'temp-' + Date.now();
    const tempTx = {
      id: tempId,
      profile_id: userId,
      transaction_type: transactionData.transaction_type,
      amount: Number(transactionData.amount),
      from: transactionData.from,
      value_date: transactionData.value_date || new Date().toISOString().split('T')[0],
      posting_date: transactionData.posting_date || new Date().toISOString().split('T')[0],
      due_date: transactionData.due_date || null,
      payment_status: transactionData.payment_status || 'Completed',
      transaction_subtype: transactionData.transaction_subtype,
      entity: transactionData.entity,
      transaction_category: transactionData.transaction_category,
      quick_action_name: transactionData.quick_action_name || null,
      target_account: transactionData.target_account,
      source_dest_bank: transactionData.source_dest_bank,
      flow: transactionData.flow,
      description: transactionData.description,
      created_at: new Date().toISOString()
    };

    let newGold = get().gold;
    let earnedXp = 0;
    const isCompleted = (status) => ['Completed', 'Paid', 'Paid on Time', 'Paid Late'].includes(status);
    const isCompletedStatus = isCompleted(transactionData.payment_status || 'Completed');

    if (isCompletedStatus) {
      const amt = Number(transactionData.amount) || 0;
      if (transactionData.transaction_type === 'Income') {
        const src = transactionData.source_dest_bank || '11010001';
        if (src.startsWith('1101') || src.startsWith('1102') || src.startsWith('1103')) newGold += amt;
        earnedXp = amt * 2;
      } else if (transactionData.transaction_type === 'Expense') {
        const src = transactionData.source_dest_bank || '11010001';
        if (src.startsWith('1101') || src.startsWith('1102') || src.startsWith('1103')) newGold -= amt;
      } else if (transactionData.transaction_type === 'Assets' || transactionData.transaction_type === 'Liabilities') {
        const src = transactionData.source_dest_bank;
        const tgt = transactionData.target_account;
        let effect = 0;
        if (transactionData.flow === 'neutral') {
          if (src && (src.startsWith('1101') || src.startsWith('1102') || src.startsWith('1103'))) effect -= amt;
          if (tgt && (tgt.startsWith('1101') || tgt.startsWith('1102') || tgt.startsWith('1103'))) effect += amt;
        } else if (transactionData.flow === 'inflow') {
          if (src && (src.startsWith('1101') || src.startsWith('1102') || src.startsWith('1103'))) effect += amt;
          if (tgt && (tgt.startsWith('1101') || tgt.startsWith('1102') || tgt.startsWith('1103'))) effect -= amt;
        } else if (transactionData.flow === 'outflow') {
          if (src && (src.startsWith('1101') || src.startsWith('1102') || src.startsWith('1103'))) effect -= amt;
          if (tgt && (tgt.startsWith('1101') || tgt.startsWith('1102') || tgt.startsWith('1103'))) effect += amt;
        }
        newGold += effect;
      }
    }

    let newXp = get().xp + earnedXp;
    let newLevel = get().level;
    while (true) {
      const maxXp = 100 * Math.pow(1.5, newLevel - 1);
      if (newXp >= maxXp) {
        newXp -= Math.floor(maxXp);
        newLevel += 1;
      } else {
        break;
      }
    }

    const prevTransactions = get().transactions;
    const prevGold = get().gold;
    const prevXp = get().xp;
    const prevLevel = get().level;
    set({ transactions: [tempTx, ...prevTransactions], isLoading: true });

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            profile_id: userId,
            transaction_type: transactionData.transaction_type,
            amount: Number(transactionData.amount),
            value_date: transactionData.value_date || null,
            posting_date: transactionData.posting_date || null,
            due_date: transactionData.due_date || null,
            payment_status: transactionData.payment_status || 'Completed',
            transaction_subtype: transactionData.transaction_subtype,
            transaction_category: transactionData.transaction_category || null,
            quick_action_name: transactionData.quick_action_name || null,
            entity: transactionData.entity,
            origin: transactionData.from,
            target_account: transactionData.target_account,
            source_dest_bank: transactionData.source_dest_bank,
            flow: transactionData.flow,
            description: transactionData.description
          }
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const savedTx = { ...data[0], from: data[0].origin || data[0].from };
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === tempId ? savedTx : t))
        }));
      }

      const finalXp = Math.floor(newXp);
      await supabase
        .from('profiles')
        .update({
          xp: finalXp,
          level: newLevel
        })
        .eq('id', userId);

      const { data: profileRes } = await supabase
        .from('profiles')
        .select('gold, xp, level')
        .eq('id', userId)
        .single();

      if (profileRes) {
        set({
          gold: Number(profileRes.gold),
          xp: Number(profileRes.xp),
          level: Number(profileRes.level)
        });
      } else {
        set({
          xp: finalXp,
          level: newLevel
        });
      }

      get().fetchDashboardData(userId);
      return { success: true, data };
    } catch (err) {
      set({ transactions: prevTransactions, gold: prevGold, xp: prevXp, level: prevLevel, isLoading: false });
      console.error('Error registering transaction:', err);
      return { success: false, error: err.message || err };
    } finally {
      set({ isLoading: false });
    }
  },

  registerTransactions: async (profileId, transactionsList) => {
    const userId = get().user?.id || profileId;
    const tempIds = [];
    const tempTxs = transactionsList.map((tx, idx) => {
      const tempId = tx.id || 'temp-batch-' + idx + '-' + Date.now();
      tempIds.push(tempId);
      return {
        id: tempId,
        profile_id: userId,
        transaction_type: tx.transaction_type,
        amount: Number(tx.amount),
        from: tx.from,
        value_date: tx.value_date || new Date().toISOString().split('T')[0],
        posting_date: tx.posting_date || new Date().toISOString().split('T')[0],
        due_date: tx.due_date || null,
        payment_status: tx.payment_status || 'Completed',
        transaction_subtype: tx.transaction_subtype,
        entity: tx.entity,
        transaction_category: tx.transaction_category,
        quick_action_name: tx.quick_action_name || null,
        target_account: tx.target_account,
        source_dest_bank: tx.source_dest_bank,
        flow: tx.flow,
        description: tx.description,
        created_at: tx.created_at || new Date().toISOString(),
        month: tx.month || null,
        year: tx.year || null,
        quarter: tx.quarter || null
      };
    });

    const prevTransactions = get().transactions;
    const filteredPrev = prevTransactions.filter(pt => !tempTxs.some(tt => tt.id === pt.id));
    set({ transactions: [...tempTxs, ...filteredPrev], isLoading: true });

    try {
      const formatted = transactionsList.map((tx) => {
        const item = {
          profile_id: userId,
          transaction_type: tx.transaction_type,
          amount: Number(tx.amount),
          value_date: tx.value_date || null,
          posting_date: tx.posting_date || null,
          due_date: tx.due_date || null,
          payment_status: tx.payment_status || 'Completed',
          transaction_subtype: tx.transaction_subtype,
          transaction_category: tx.transaction_category || null,
          quick_action_name: tx.quick_action_name || null,
          entity: tx.entity,
          origin: tx.from,
          target_account: tx.target_account,
          source_dest_bank: tx.source_dest_bank,
          flow: tx.flow,
          description: tx.description,
          month: tx.month || null,
          year: tx.year || null,
          quarter: tx.quarter || null
        };
        if (tx.id) item.id = tx.id;
        if (tx.created_at) item.created_at = tx.created_at;
        return item;
      });

      const { data, error } = await supabase
        .from('transactions')
        .upsert(formatted)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        set((state) => {
          const nextTxs = [...state.transactions];
          tempIds.forEach((tempId, index) => {
            const matchIdx = nextTxs.findIndex(t => t.id === tempId);
            if (matchIdx !== -1 && data[index]) {
              nextTxs[matchIdx] = { ...data[index], from: data[index].origin || data[index].from };
            }
          });
          return { transactions: nextTxs };
        });
      }

      const profileRes = await supabase
        .from('profiles')
        .select('gold, xp, level')
        .eq('id', userId)
        .single();

      if (profileRes.data) {
        set({
          gold: profileRes.data.gold ? Number(profileRes.data.gold) : get().gold,
          level: profileRes.data.level || get().level,
          xp: profileRes.data.xp || get().xp,
        });
      }

      get().fetchDashboardData(userId);
      return { success: true, data };
    } catch (err) {
      set({ transactions: prevTransactions });
      console.error('Error batch registering transactions:', err);
      return { success: false, error: err.message || err };
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTransactions: async (profileId, transactionIds) => {
    const userId = get().user?.id || profileId;
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', transactionIds);

      if (error) throw error;

      const profileRes = await supabase
        .from('profiles')
        .select('gold, xp, level')
        .eq('id', userId)
        .single();

      if (profileRes.data) {
        set({
          gold: profileRes.data.gold ? Number(profileRes.data.gold) : get().gold,
          level: profileRes.data.level || get().level,
          xp: profileRes.data.xp || get().xp,
        });
      }

      get().fetchDashboardData(userId);
      return { success: true };
    } catch (err) {
      console.error('Error deleting transactions:', err);
      return { success: false, error: err.message || err };
    } finally {
      set({ isLoading: false });
    }
  },

  // Auth Initialization Pipeline
  initAuth: () => {
    const loadSessionUser = async (session) => {
      if (session?.user) {
        set({ user: session.user, email: session.user.email });
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileData) {
          set({
            gold: Number(profileData.gold) || 0,
            xp: profileData.xp || 0,
            level: profileData.level || 1,
            role: profileData.role || 'lord'
          });

          if (profileData.settings) {
            const s = profileData.settings;
            const accMaps = s.accountMappings || get().accountMappings;
            setDynamicAccountMappings(accMaps);

            set({
              templates: s.templates || get().templates,
              fromOptions: s.fromOptions || get().fromOptions,
              language: s.language || get().language
            });
            if (s.language) {
              i18n.changeLanguage(s.language);
            }
          }
        }
        await get().fetchKingdomData(session.user.id);
        await get().fetchDashboardData(session.user.id);
      } else {
        set({ user: null, role: 'lord', email: 'guest@medieval.stuff' });
        get().resetStore();
        await get().fetchKingdomData('00000000-0000-0000-0000-000000000000');
        await get().fetchDashboardData('00000000-0000-0000-0000-000000000000');
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      loadSessionUser(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      loadSessionUser(session);
    });
    return () => subscription.unsubscribe();
  },

  setLanguage: (lang) => {
    get().syncSettings({ language: lang });
    i18n.changeLanguage(lang);
  },

  // Game Logic Mechanics (Buildings and Mine Upgrades)
  collectPassiveGold: async () => {
    const userId = get().user?.id || '00000000-0000-0000-0000-000000000000';
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.rpc('collect_passive_gold', {
        p_profile_id: userId
      });
      if (error) throw error;

      const goldCollected = Number(data) || 0;
      if (goldCollected > 0) {
        toast.success(`Claimed ${goldCollected} Gold and gained ${goldCollected * 2} XP!`);
      } else {
        toast.error("Not enough passive gold accumulated yet!");
      }
      await get().fetchKingdomData(userId);
      return goldCollected;
    } catch (err) {
      console.error('Error claiming passive gold:', err);
      toast.error('Failed to claim passive gold.');
      return 0;
    } finally {
      set({ isLoading: false });
    }
  },

  upgradeMine: async () => {
    const userId = get().user?.id || '00000000-0000-0000-0000-000000000000';
    const currentLevel = get().mineLevel;
    const goldCost = 100 * currentLevel;
    const gemCost = 5 * currentLevel;

    if (get().gold < goldCost) {
      toast.error(`Not enough gold! Need ${goldCost} gold.`);
      return false;
    }
    if (get().gems < gemCost) {
      toast.error(`Not enough gems! Need ${gemCost} gems.`);
      return false;
    }

    set({ isLoading: true });
    try {
      const { error: buildingError } = await supabase
        .from('buildings')
        .upsert({
          profile_id: userId,
          building_type: 'gold_mine',
          level: currentLevel + 1,
          updated_at: new Date().toISOString()
        }, { onConflict: 'profile_id,building_type' });

      if (buildingError) throw buildingError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          gold: get().gold - goldCost,
          gems: get().gems - gemCost,
          xp: get().xp + 50
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      toast.success(`Gold Mine upgraded to Level ${currentLevel + 1}!`);
      await get().fetchKingdomData(userId);
      return true;
    } catch (err) {
      console.error('Error upgrading mine:', err);
      toast.error('Failed to upgrade Gold Mine.');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  resetStore: () => set({
    flatMatrix: defaultFlatMatrix,
    gold: 0,
    gems: 100,
    xp: 0,
    level: 1,
    mineLevel: 1,
    lastCollectionTime: null,
    email: 'lord.eldoria@kingdom.gov',
    transactions: [],
    accountBalances: [],
    isLoading: false,
    language: 'en'
  })
}));

export default useKingdomStore;