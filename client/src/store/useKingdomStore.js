import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import i18n from '../i18n';
import { toast } from 'react-hot-toast';
import { defaultAccountMappings, setDynamicAccountMappings } from '../utils/accountMappings';

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

// Purge legacy local storage keys that no longer map to the new Engine structure
['classOptions', 'subClassOptions', 'statusOptions', 'monthOptions'].forEach(key => {
  try {
    localStorage.removeItem(`eldoria_${key}`);
  } catch {
    // Ignore
  }
});

try {
  const cachedEntities = localStorage.getItem('eldoria_entityOptions');
  const cachedSubClass = localStorage.getItem('eldoria_subClassOptions');
  if (cachedEntities || cachedSubClass) {
    const parsedEnt = cachedEntities ? JSON.parse(cachedEntities) : [];
    const parsedSub = cachedSubClass ? JSON.parse(cachedSubClass) : [];
    if (
      !parsedEnt.includes('CGD Bank Account') ||
      parsedSub.includes('Salary (payroll)') ||
      parsedSub.includes('Income • Payroll') ||
      (parsedSub.length > 0 && !parsedSub.includes('Bank Accounts (Ordem)'))
    ) {
      localStorage.removeItem('eldoria_entityOptions');
      localStorage.removeItem('eldoria_entityMappings');
      localStorage.removeItem('eldoria_templates');
      localStorage.removeItem('eldoria_categoryOptions');
      localStorage.removeItem('eldoria_subClassOptions');
      localStorage.removeItem('eldoria_subtypeToCategoryMap');
    }
  }
} catch (e) {
  // Ignore
}

export const defaultValidationMatrix = [
  // ASSETS (Type: Assets)
  // Subtype: Liquid Assets
  { accountCode: "11010001", type: "Assets", subtype: "Liquid Assets", category: "Checking Accounts", entity: "CGD" },
  { accountCode: "11010002", type: "Assets", subtype: "Liquid Assets", category: "Checking Accounts", entity: "Universo" },
  { accountCode: "11010003", type: "Assets", subtype: "Liquid Assets", category: "Checking Accounts", entity: "ActivoBank" },
  { accountCode: "11010004", type: "Assets", subtype: "Liquid Assets", category: "Checking Accounts", entity: "Inter Bank" },
  { accountCode: "11010005", type: "Assets", subtype: "Liquid Assets", category: "Checking Accounts", entity: "WiZink" },
  { accountCode: "11020001", type: "Assets", subtype: "Liquid Assets", category: "Savings & Wallets", entity: "CGD" },
  { accountCode: "11020002", type: "Assets", subtype: "Liquid Assets", category: "Savings & Wallets", entity: "Universo" },
  { accountCode: "11020003", type: "Assets", subtype: "Liquid Assets", category: "Savings & Wallets", entity: "ActivoBank" },
  { accountCode: "11020004", type: "Assets", subtype: "Liquid Assets", category: "Savings & Wallets", entity: "Inter Bank" },
  { accountCode: "11020005", type: "Assets", subtype: "Liquid Assets", category: "Savings & Wallets", entity: "WiZink" },
  { accountCode: "11030001", type: "Assets", subtype: "Liquid Assets", category: "Cash", entity: "Dinheiro Físico" },

  // Subtype: Sinking Funds
  { accountCode: "12010001", type: "Assets", subtype: "Sinking Funds", category: "Short-Term Goals", entity: "Fundo Férias" },
  { accountCode: "12010002", type: "Assets", subtype: "Sinking Funds", category: "Short-Term Goals", entity: "Fundo Emergência" },

  // Subtype: Investments
  { accountCode: "13010001", type: "Assets", subtype: "Investments", category: "Invest Accounts", entity: "CGD" },
  { accountCode: "13010002", type: "Assets", subtype: "Investments", category: "Invest Accounts", entity: "Universo" },
  { accountCode: "13010003", type: "Assets", subtype: "Investments", category: "Invest Accounts", entity: "ActivoBank" },
  { accountCode: "13010004", type: "Assets", subtype: "Investments", category: "Invest Accounts", entity: "Inter Bank" },
  { accountCode: "13010005", type: "Assets", subtype: "Investments", category: "Invest Accounts", entity: "WiZink" },
  { accountCode: "13020001", type: "Assets", subtype: "Investments", category: "Retirement", entity: "PPR" },

  // Subtype: Fixed Assets
  { accountCode: "14010001", type: "Assets", subtype: "Fixed Assets", category: "Real Estate", entity: "Habitação Própria" },
  { accountCode: "14020001", type: "Assets", subtype: "Fixed Assets", category: "Vehicles", entity: "Carro Pessoal" },
  { accountCode: "14020002", type: "Assets", subtype: "Fixed Assets", category: "Vehicles", entity: "Mota Pessoal" },

  // LIABILITIES (Type: Liabilities)
  // Subtype: Short-Term Debt
  { accountCode: "21010001", type: "Liabilities", subtype: "Short-Term Debt", category: "Credit Cards", entity: "CGD" },
  { accountCode: "21010002", type: "Liabilities", subtype: "Short-Term Debt", category: "Credit Cards", entity: "Universo" },
  { accountCode: "21010003", type: "Liabilities", subtype: "Short-Term Debt", category: "Credit Cards", entity: "ActivoBank" },
  { accountCode: "21010004", type: "Liabilities", subtype: "Short-Term Debt", category: "Credit Cards", entity: "Inter Bank" },
  { accountCode: "21010005", type: "Liabilities", subtype: "Short-Term Debt", category: "Credit Cards", entity: "WiZink" },
  { accountCode: "21020001", type: "Liabilities", subtype: "Short-Term Debt", category: "Personal Loans", entity: "Cofidis" },
  { accountCode: "21020002", type: "Liabilities", subtype: "Short-Term Debt", category: "Personal Loans", entity: "Mãe" },
  { accountCode: "21020003", type: "Liabilities", subtype: "Short-Term Debt", category: "Personal Loans", entity: "Pedro" },
  { accountCode: "21020004", type: "Liabilities", subtype: "Short-Term Debt", category: "Personal Loans", entity: "Reni" },
  { accountCode: "21030001", type: "Liabilities", subtype: "Short-Term Debt", category: "State Debts", entity: "Finanças" },
  { accountCode: "21030002", type: "Liabilities", subtype: "Short-Term Debt", category: "State Debts", entity: "Segurança Social" },
  { accountCode: "21030003", type: "Liabilities", subtype: "Short-Term Debt", category: "State Debts", entity: "Justiça" },

  // Subtype: Long-Term Debt
  { accountCode: "22010001", type: "Liabilities", subtype: "Long-Term Debt", category: "Other Loans", entity: "Crédito Automóvel" },
  { accountCode: "22010002", type: "Liabilities", subtype: "Long-Term Debt", category: "Other Loans", entity: "Crédito Habitação" },

  // EXPENSES (Type: Expenses)
  // Subtype: Housing & Utilities
  { accountCode: "61010001", type: "Expenses", subtype: "Housing & Utilities", category: "Utilities", entity: "Renda" },
  { accountCode: "61010002", type: "Expenses", subtype: "Housing & Utilities", category: "Utilities", entity: "Endesa" },
  { accountCode: "61010003", type: "Expenses", subtype: "Housing & Utilities", category: "Utilities", entity: "Agua" },
  { accountCode: "61010004", type: "Expenses", subtype: "Housing & Utilities", category: "Utilities", entity: "NOS" },
  { accountCode: "61010005", type: "Expenses", subtype: "Housing & Utilities", category: "Utilities", entity: "DIGAL" },
  { accountCode: "61020001", type: "Expenses", subtype: "Housing & Utilities", category: "Maintenance", entity: "Obras e Decoração" },

  // Subtype: Food & Living
  { accountCode: "62010001", type: "Expenses", subtype: "Food & Living", category: "Supermarket", entity: "Mercearia e Alimentação" },
  { accountCode: "62010002", type: "Expenses", subtype: "Food & Living", category: "Supermarket", entity: "Limpeza e Higiene" },
  { accountCode: "62010003", type: "Expenses", subtype: "Food & Living", category: "Supermarket", entity: "Drinks & Alcohol" },
  { accountCode: "62020001", type: "Expenses", subtype: "Food & Living", category: "Pet Care", entity: "Pet Food" },
  { accountCode: "62020002", type: "Expenses", subtype: "Food & Living", category: "Pet Care", entity: "Veterinário" },
  { accountCode: "62030001", type: "Expenses", subtype: "Food & Living", category: "Dependents", entity: "Educação Filhos" },

  // Subtype: Transportation
  { accountCode: "63010001", type: "Expenses", subtype: "Transportation", category: "Personal Vehicle", entity: "Gasoline" },
  { accountCode: "63010002", type: "Expenses", subtype: "Transportation", category: "Personal Vehicle", entity: "Tolls Via Verde" },
  { accountCode: "63010003", type: "Expenses", subtype: "Transportation", category: "Personal Vehicle", entity: "Repairs & Parking" },
  { accountCode: "63020001", type: "Expenses", subtype: "Transportation", category: "Public & Taxis", entity: "Public Transport Navegante" },
  { accountCode: "63020002", type: "Expenses", subtype: "Transportation", category: "Public & Taxis", entity: "Uber / Taxis" },

  // Subtype: Health & Wellness
  { accountCode: "64010001", type: "Expenses", subtype: "Health & Wellness", category: "Medical", entity: "Hospital & Consultas" },
  { accountCode: "64010002", type: "Expenses", subtype: "Health & Wellness", category: "Medical", entity: "Dentista" },
  { accountCode: "64010003", type: "Expenses", subtype: "Health & Wellness", category: "Medical", entity: "Psicologia" },
  { accountCode: "64020001", type: "Expenses", subtype: "Health & Wellness", category: "Pharmacy", entity: "Farmácia" },

  // Subtype: Shopping & Personal
  { accountCode: "65010001", type: "Expenses", subtype: "Shopping & Personal", category: "Retail", entity: "Clothing & Shoes" },
  { accountCode: "65020001", type: "Expenses", subtype: "Shopping & Personal", category: "Hobbies & Tech", entity: "Tools & Electronics" },

  // Subtype: Entertainment
  { accountCode: "66010001", type: "Expenses", subtype: "Entertainment", category: "Leisure", entity: "Cinema & Dining Out" },
  { accountCode: "66010002", type: "Expenses", subtype: "Entertainment", category: "Leisure", entity: "Nightlife & Drinks" },
  { accountCode: "66020001", type: "Expenses", subtype: "Entertainment", category: "Subscriptions", entity: "Streaming" },

  // Subtype: Education & Business
  { accountCode: "67010001", type: "Expenses", subtype: "Education & Business", category: "Professional", entity: "PhD" },
  { accountCode: "67010002", type: "Expenses", subtype: "Education & Business", category: "Professional", entity: "Trainings" },
  { accountCode: "67020001", type: "Expenses", subtype: "Education & Business", category: "Freelance Expenses", entity: "Software & Materials" },

  // Subtype: Insurances
  { accountCode: "68010001", type: "Expenses", subtype: "Insurances", category: "Policies", entity: "Health Insurance" },
  { accountCode: "68010002", type: "Expenses", subtype: "Insurances", category: "Policies", entity: "Car & Motorcycle Insurance" },
  { accountCode: "68010003", type: "Expenses", subtype: "Insurances", category: "Policies", entity: "Life Insurance" },

  // Subtype: Taxes & State
  { accountCode: "69010001", type: "Expenses", subtype: "Taxes & State", category: "Direct Taxes", entity: "IRS Pagamento" },
  { accountCode: "69010002", type: "Expenses", subtype: "Taxes & State", category: "Direct Taxes", entity: "IUC / Finanças" },
  { accountCode: "69010003", type: "Expenses", subtype: "Taxes & State", category: "Direct Taxes", entity: "Social Security" },

  // Subtype: Financial & Fees
  { accountCode: "69020001", type: "Expenses", subtype: "Financial & Fees", category: "Interest & Bank Fees", entity: "Bank Fees & Commissions" },
  { accountCode: "69020002", type: "Expenses", subtype: "Financial & Fees", category: "Interest & Bank Fees", entity: "Fines & Penalties" },
  { accountCode: "69020003", type: "Expenses", subtype: "Financial & Fees", category: "Interest & Bank Fees", entity: "Credit Interest Paid" },

  // Subtype: Giving & Charity
  { accountCode: "69030001", type: "Expenses", subtype: "Giving & Charity", category: "Philanthropy", entity: "Donativos Institucionais" },
  { accountCode: "69030002", type: "Expenses", subtype: "Giving & Charity", category: "Philanthropy", entity: "Prendas a Terceiros" },

  // INCOME (Type: Income)
  // Subtype: Active Income
  { accountCode: "71010001", type: "Income", subtype: "Active Income", category: "Payroll", entity: "Base Salary" },
  { accountCode: "71010002", type: "Income", subtype: "Active Income", category: "Payroll", entity: "Bonus Scorecard" },
  { accountCode: "71010003", type: "Income", subtype: "Active Income", category: "Payroll", entity: "Vacation Subsidy" },
  { accountCode: "71010004", type: "Income", subtype: "Active Income", category: "Payroll", entity: "Christmas Subsidy" },
  { accountCode: "71020001", type: "Income", subtype: "Active Income", category: "Freelance & Services", entity: "Consulting" },
  { accountCode: "71020002", type: "Income", subtype: "Active Income", category: "Freelance & Services", entity: "Teaching Classes" },

  // Subtype: Passive & Other
  { accountCode: "72010001", type: "Income", subtype: "Passive & Other", category: "Cashbacks & Rewards", entity: "Cashbacks CGD" },
  { accountCode: "72010002", type: "Income", subtype: "Passive & Other", category: "Cashbacks & Rewards", entity: "Cashbacks Universo" },
  { accountCode: "72010003", type: "Income", subtype: "Passive & Other", category: "Cashbacks & Rewards", entity: "Family Gifts" },
  { accountCode: "72020001", type: "Income", subtype: "Passive & Other", category: "Refunds", entity: "IRS Refund" },
  { accountCode: "72020002", type: "Income", subtype: "Passive & Other", category: "Refunds", entity: "Health Insurance Refund" }
];

const derivedSubtypeToCategoryMap = {};
const derivedSubtypeTypes = {};
const derivedEntityMappings = {};
const derivedClassOptions = ['Income', 'Expenses', 'Assets', 'Liabilities'];
const derivedSubClassOptions = [];
const derivedEntityOptions = [];
const derivedCategoryOptions = [];

defaultValidationMatrix.forEach(row => {
  let typeCode = "1";
  if (row.type === "Liabilities") typeCode = "2";
  else if (row.type === "Expenses") typeCode = "6";
  else if (row.type === "Income") typeCode = "7";
  
  derivedSubtypeTypes[row.subtype] = [typeCode];

  if (!derivedSubtypeToCategoryMap[row.subtype]) {
    derivedSubtypeToCategoryMap[row.subtype] = [];
  }
  if (!derivedSubtypeToCategoryMap[row.subtype].includes(row.category)) {
    derivedSubtypeToCategoryMap[row.subtype].push(row.category);
  }

  derivedEntityMappings[row.entity] = row.category;

  if (!derivedSubClassOptions.includes(row.subtype)) {
    derivedSubClassOptions.push(row.subtype);
  }

  if (!derivedEntityOptions.includes(row.entity)) {
    derivedEntityOptions.push(row.entity);
  }

  if (!derivedCategoryOptions.includes(row.category)) {
    derivedCategoryOptions.push(row.category);
  }
});

const initialAccountMappings = loadLocal('accountMappings', defaultAccountMappings);
setDynamicAccountMappings(initialAccountMappings);

export const useKingdomStore = create((set, get) => ({
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
        entityOptions: get().entityOptions,
        categoryOptions: get().categoryOptions,
        entityMappings: get().entityMappings,
        subtypeToCategoryMap: get().subtypeToCategoryMap,
        subtypeTypes: get().subtypeTypes,
        subClassOptions: get().subClassOptions,
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

  // Dropdown manage lists
  fromOptions: loadLocal('fromOptions', ['Pedro', 'Reni', 'Consolidated']),
  statusOptions: ['Pending', 'Completed'],
  classOptions: derivedClassOptions,
  subClassOptions: derivedSubClassOptions,
  entityOptions: loadLocal('entityOptions', derivedEntityOptions),
  categoryOptions: loadLocal('categoryOptions', derivedCategoryOptions),
  subtypeToCategoryMap: loadLocal('subtypeToCategoryMap', derivedSubtypeToCategoryMap),
  subtypeTypes: loadLocal('subtypeTypes', derivedSubtypeTypes),
  entityMappings: loadLocal('entityMappings', derivedEntityMappings),
  monthOptions: [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  templates: loadLocal('templates', [
  {
    "name": "Transfers",
    "icon": "💸",
    "data": {
      "from": "Consolidated",
      "transaction_type": "Assets",
      "transaction_subtype": "Banks",
      "entity": "CGD",
      "transaction_category": "Bank account",
      "target_account": "10102001",
      "source_dest_bank": "10101001",
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
      "transaction_subtype": "Personal Debt",
      "entity": "Universo",
      "transaction_category": "Credit Cards",
      "target_account": "",
      "source_dest_bank": "20103002",
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
      "transaction_subtype": "Personal Debt",
      "entity": "Wizink",
      "transaction_category": "Credit Cards",
      "target_account": "20103005",
      "source_dest_bank": "10101001",
      "flow": "outflow",
      "payment_status": "Completed",
      
      "description": "Credit card payment"
    }
  }
]),

  // Actions to manage options
  addOption: (type, value, extraData) => {
    if (type === 'quickAction') {
      const updated = [...get().templates, { name: value, icon: extraData.icon || '⚡', data: extraData.data }];
      get().syncSettings({ templates: updated });
      return;
    }
    if (type === 'quickActionImportBulk') {
      get().syncSettings({ templates: value });
      return;
    }

    const key = `${type}Options`;
    const currentList = get()[key];
    if (!currentList) return;
    if (currentList.includes(value)) return;

    const updated = [...currentList, value];
    const updates = { [key]: updated };
    
    // If adding an entity, we also add its category mapping
    if (type === 'entity' && extraData?.category) {
      updates.entityMappings = { ...get().entityMappings, [value]: extraData.category };
    }

    get().syncSettings(updates);
  },

  editOption: (type, oldValue, newValue, extraData) => {
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

    const key = `${type}Options`;
    const currentList = get()[key];
    if (currentList) {
      const updated = currentList.map(v => v === oldValue ? newValue : v);
      const updates = { [key]: updated };
      
      // If editing an entity name, we also update its entityMapping key
      if (type === 'entity') {
        const oldMapping = get().entityMappings[oldValue];
        if (oldMapping !== undefined) {
          const newMappings = { ...get().entityMappings };
          delete newMappings[oldValue];
          newMappings[newValue] = oldMapping;
          updates.entityMappings = newMappings;
        }
      }
      
      get().syncSettings(updates);
      return;
    }
  },

  deleteOption: (type, value) => {
    if (type === 'quickAction') {
      const updated = get().templates.filter(tpl => tpl.name !== value);
      get().syncSettings({ templates: updated });
      return;
    }

    const key = `${type}Options`;
    const currentList = get()[key];
    if (!currentList) return;

    const updated = currentList.filter(v => v !== value);
    const updates = { [key]: updated };
    
    if (type === 'entity') {
      const updatedMappings = { ...get().entityMappings };
      delete updatedMappings[value];
      updates.entityMappings = updatedMappings;
    }

    get().syncSettings(updates);
  },

  getMatrixRows: () => {
    const rows = [];
    const coveredEntities = new Set();
    const coveredCategories = new Set();
    const coveredSubtypes = new Set();

    const isEntityInvalid = (ent) => {
      const val = (ent || '').trim().toLowerCase();
      return !val || val === 'none' || val === 'null' || val === 'undefined';
    };

    const accountMappings = get().accountMappings || {};
    const entityOptions = get().entityOptions || [];
    const entityMappings = get().entityMappings || {};
    const subtypeToCategoryMap = get().subtypeToCategoryMap || {};
    const categoryOptions = get().categoryOptions || [];
    const subClassOptions = get().subClassOptions || [];

    // 1. Scan Chart of Accounts (COA) for specific mappings first
    const coaMappingsList = [];
    Object.entries(accountMappings).forEach(([code, fullName]) => {
      let remaining = fullName;
      if (remaining.startsWith(code)) {
        remaining = remaining.substring(code.length).replace(/^\s*-\s*/, '');
      }
      const parts = remaining.split(/\s*-\s*/);
      const category = parts[0] || '';
      const entity = parts.slice(1).join(' - ') || '';
      
      if (category && entity && !isEntityInvalid(entity)) {
        coaMappingsList.push({ category: category.trim(), entity: entity.trim() });
      }
    });

    coaMappingsList.forEach(({ category, entity }) => {
      let subtype = '';
      for (const [sub, cats] of Object.entries(subtypeToCategoryMap)) {
        if (cats && cats.includes(category)) {
          subtype = sub;
          break;
        }
      }
      
      const key = `${subtype}:::${category}:::${entity}`;
      if (!rows.some(r => r.key === key)) {
        rows.push({
          key,
          subtype,
          category,
          entity
        });
      }
      
      coveredEntities.add(entity);
      coveredCategories.add(category);
      if (subtype) coveredSubtypes.add(subtype);
    });

    // 2. Loop over standard entityMappings
    entityOptions.forEach((entity) => {
      if (!entity || coveredEntities.has(entity)) return;
      const category = entityMappings[entity] || '';
      let subtype = '';
      for (const [sub, cats] of Object.entries(subtypeToCategoryMap)) {
        if (cats && cats.includes(category)) {
          subtype = sub;
          break;
        }
      }
      const key = `${subtype}:::${category}:::${entity}`;
      if (!rows.some(r => r.key === key)) {
        rows.push({
          key,
          subtype,
          category,
          entity
        });
      }
      coveredEntities.add(entity);
      if (category) coveredCategories.add(category);
      if (subtype) coveredSubtypes.add(subtype);
    });

    // 3. Loop over categoryOptions for remaining uncovered category placeholders
    categoryOptions.forEach((category) => {
      if (!category || coveredCategories.has(category)) return;
      let subtype = '';
      for (const [sub, cats] of Object.entries(subtypeToCategoryMap)) {
        if (cats && cats.includes(category)) {
          subtype = sub;
          break;
        }
      }
      rows.push({
        key: `${subtype}:::${category}:::`,
        subtype,
        category,
        entity: ''
      });
      coveredCategories.add(category);
      if (subtype) coveredSubtypes.add(subtype);
    });

    // 4. Loop over subclass options
    subClassOptions.forEach((subtype) => {
      if (!subtype || coveredSubtypes.has(subtype)) return;
      rows.push({
        key: `${subtype}::::::`,
        subtype,
        category: '',
        entity: ''
      });
      coveredSubtypes.add(subtype);
    });

    return rows;
  },

  // Fetch lightweight profile data (single-row polling mechanics)
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

        // Fetch gold mine building data
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
          let categoryOpts = s.categoryOptions || get().categoryOptions;
          let entityMaps = s.entityMappings || get().entityMappings;
          let temps = s.templates || get().templates;
          let subClassOpts = s.subClassOptions || get().subClassOptions;
          let entityOpts = s.entityOptions || get().entityOptions;
          let subtypeToCategory = s.subtypeToCategoryMap || get().subtypeToCategoryMap;
          const isObsolete = 
            categoryOpts.includes('Payroll') || 
            categoryOpts.includes('Burrowed') ||
            categoryOpts.includes('Income • Payroll') ||
            categoryOpts.includes('Salary (payroll)') ||
            categoryOpts.includes('Bank Accounts (Ordem)') ||
            categoryOpts.includes('Payroll & Active Income') ||
            categoryOpts.includes('Saving account') ||
            categoryOpts.includes('Loans & Burrow income') ||
            categoryOpts.includes('Health expenses') ||
            categoryOpts.includes('Insurance paid') ||
            categoryOpts.includes('Insurance received') ||
            categoryOpts.includes('Taxes paid') ||
            categoryOpts.includes('Taxes received') ||
            categoryOpts.includes('Interest received') ||
            categoryOpts.includes('Entertainment expenses') ||
            categoryOpts.includes('Fines expenses') ||
            categoryOpts.includes('Fines refunds') ||
            categoryOpts.includes('Loans & Burrow expenses') ||
            subClassOpts.includes('Salary (payroll)') ||
            subClassOpts.includes('Income • Payroll') ||
            subClassOpts.includes('Bank Accounts (Ordem)') ||
            subClassOpts.includes('Investments') ||
            subClassOpts.includes('Utilities') ||
            subClassOpts.includes('Markets & Personal care') ||
            entityMaps['Salary'] === 'Payroll & Active Income' ||
            Object.values(entityMaps).includes('Income • Payroll') ||
            Object.values(entityMaps).includes('Salary (payroll)') ||
            entityOpts.includes('CGD Bank') ||
            entityOpts.includes('Active Bank Savings') ||
            !entityOpts.includes('CGD');

          if (isObsolete) {
            categoryOpts = get().categoryOptions;
            entityMaps = get().entityMappings;
            subClassOpts = get().subClassOptions;
            entityOpts = get().entityOptions;
            subtypeToCategory = get().subtypeToCategoryMap;

            if (Array.isArray(temps)) {
              temps = temps.map(t => {
                if (t.data) {
                  let updatedSubtype = t.data.transaction_subtype;
                  let updatedCategory = t.data.transaction_category;
                  if (updatedSubtype === 'Bank Accounts (Ordem)') updatedSubtype = 'Banks';
                  else if (updatedSubtype === 'Payroll & Active Income') updatedSubtype = 'Payroll';
                  else if (updatedSubtype === 'Salary (payroll)' || updatedSubtype === 'Income • Payroll') updatedSubtype = 'Payroll';

                  if (updatedCategory === 'Bank Accounts (Ordem)') updatedCategory = 'Bank account';
                  else if (updatedCategory === 'Payroll & Active Income') updatedCategory = 'Salary';
                  else if (updatedCategory === 'Salary (payroll)' || updatedCategory === 'Income • Payroll') updatedCategory = 'Salary';

                  return {
                    ...t,
                    data: {
                      ...t.data,
                      transaction_subtype: updatedSubtype,
                      transaction_category: updatedCategory
                    }
                  };
                }
                return t;
              });
            }

            localStorage.removeItem('eldoria_entityOptions');
            localStorage.removeItem('eldoria_entityMappings');
            localStorage.removeItem('eldoria_categoryOptions');
            localStorage.removeItem('eldoria_subClassOptions');
            localStorage.removeItem('eldoria_subtypeToCategoryMap');
            
            supabase
              .from('profiles')
              .update({
                settings: {
                  ...s,
                  categoryOptions: categoryOpts,
                  entityMappings: entityMaps,
                  templates: temps,
                  subClassOptions: subClassOpts,
                  entityOptions: entityOpts,
                  subtypeToCategoryMap: subtypeToCategory
                }
              })
              .eq('id', userId)
              .then();
          }

          const accMaps = s.accountMappings || get().accountMappings;
          setDynamicAccountMappings(accMaps);

          set({
            templates: temps,
            fromOptions: s.fromOptions || get().fromOptions,
            entityOptions: entityOpts,
            categoryOptions: categoryOpts,
            entityMappings: entityMaps,
            subtypeToCategoryMap: subtypeToCategory,
            subClassOptions: subClassOpts,
            accountMappings: accMaps,
            language: s.language || get().language
          });
          if (s.language) {
            i18n.changeLanguage(s.language);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch kingdom data:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch raw transactions and account balances for the Dashboard Engine
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
      
      // Calculate live gold from transaction history to verify synchronization
      const isCompleted = (status) => ['Completed', 'Paid', 'Paid on Time', 'Paid Late'].includes(status);
      const netCash = txs
        .filter(t => isCompleted(t.payment_status))
        .reduce((sum, t) => {
          const amt = Number(t.amount) || 0;
          if (t.transaction_type === 'Income') {
            const src = t.source_dest_bank || '10101001';
            if (src.startsWith('10101') || src.startsWith('10102')) return sum + amt;
          }
          if (t.transaction_type === 'Expense') {
            const src = t.source_dest_bank || '10101001';
            if (src.startsWith('10101') || src.startsWith('10102')) return sum - amt;
          }
          if (t.transaction_type === 'Assets' || t.transaction_type === 'Liabilities') {
            const src = t.source_dest_bank;
            const tgt = t.target_account;
            let effect = 0;
            if (t.flow === 'neutral') {
              if (src && (src.startsWith('10101') || src.startsWith('10102'))) effect -= amt;
              if (tgt && (tgt.startsWith('10101') || tgt.startsWith('10102'))) effect += amt;
            } else if (t.flow === 'inflow') {
              if (src && (src.startsWith('10101') || src.startsWith('10102'))) effect += amt;
              if (tgt && (tgt.startsWith('10101') || tgt.startsWith('10102'))) effect -= amt;
            } else if (t.flow === 'outflow') {
              if (src && (src.startsWith('10101') || src.startsWith('10102'))) effect -= amt;
              if (tgt && (tgt.startsWith('10101') || tgt.startsWith('10102'))) effect += amt;
            }
            return sum + effect;
          }
          return sum;
        }, 0);
      
      const startingGold = (balancesRes.data || [])
        .filter(b => b.account_code && (b.account_code.startsWith('10101') || b.account_code.startsWith('10102')))
        .reduce((sum, b) => sum + (Number(b.balance) || 0), 0);
      const calculatedGold = Math.floor(startingGold + netCash);

      // If calculatedGold is different from state gold, sync it to state
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

  // Fetch expense variance using database RPC
  fetchExpenseVariance: async (years = [], quarters = [], months = []) => {
    const userId = get().user?.id || '00000000-0000-0000-0000-000000000000';
    try {
      const { data, error } = await supabase.rpc('calculate_expense_variance', {
        p_profile_id: userId,
        p_years: years,
        p_quarters: quarters,
        p_months: months
      });
      if (error) {
        console.error('Error calling calculate_expense_variance RPC:', error);
        return;
      }
      if (data && data[0]) {
        set({ expenseVarianceData: data[0] });
      }
    } catch (err) {
      console.error('Failed to execute calculate_expense_variance RPC:', err);
    }
  },

  // Fetch savings rate using database RPC
  fetchSavingsRate: async (years = [], quarters = [], months = []) => {
    const userId = get().user?.id || '00000000-0000-0000-0000-000000000000';
    try {
      const { data, error } = await supabase.rpc('calculate_savings_rate', {
        p_profile_id: userId,
        p_years: years,
        p_quarters: quarters,
        p_months: months
      });
      if (error) {
        console.error('Error calling calculate_savings_rate RPC:', error);
        return;
      }
      if (data && data[0]) {
        set({ savingsRateData: data[0] });
      }
    } catch (err) {
      console.error('Failed to execute calculate_savings_rate RPC:', err);
    }
  },

  // Fetch runway metrics using database RPC
  fetchRunwayData: async (years = [], quarters = [], months = []) => {
    const userId = get().user?.id || '00000000-0000-0000-0000-000000000000';
    try {
      const { data, error } = await supabase.rpc('calculate_kingdom_runway', {
        p_profile_id: userId,
        p_years: years,
        p_quarters: quarters,
        p_months: months
      });
      if (error) {
        console.error('Error calling calculate_kingdom_runway RPC:', error);
        return;
      }
      if (data && data[0]) {
        set({ runwayData: data[0] });
      }
    } catch (err) {
      console.error('Failed to execute calculate_kingdom_runway RPC:', err);
    }
  },

  // Fetch DTI ratio metrics using database RPC
  fetchDtiData: async (years = [], quarters = [], months = []) => {
    const userId = get().user?.id || '00000000-0000-0000-0000-000000000000';
    try {
      const { data, error } = await supabase.rpc('calculate_dti_ratio', {
        p_profile_id: userId,
        p_years: years,
        p_quarters: quarters,
        p_months: months
      });
      if (error) {
        console.error('Error calling calculate_dti_ratio RPC:', error);
        return;
      }
      if (data && data[0]) {
        set({ dtiData: data[0] });
      }
    } catch (err) {
      console.error('Failed to execute calculate_dti_ratio RPC:', err);
    }
  },
  
  // Update or insert a static account balance and refresh store data
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

  // Insert transaction to database, triggering Postgres profile updates, and synchronize state
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

    // Calculate Gold, XP, and Level locally as a fail-safe
    let newGold = get().gold;
    let earnedXp = 0;
    const isCompleted = (status) => ['Completed', 'Paid', 'Paid on Time', 'Paid Late'].includes(status);
    const isCompletedStatus = isCompleted(transactionData.payment_status || 'Completed');

    if (isCompletedStatus) {
      const amt = Number(transactionData.amount) || 0;
      if (transactionData.transaction_type === 'Income') {
        const src = transactionData.source_dest_bank || '10101001';
        if (src.startsWith('10101') || src.startsWith('10102')) newGold += amt;
        earnedXp = amt * 2;
      } else if (transactionData.transaction_type === 'Expense') {
        const src = transactionData.source_dest_bank || '10101001';
        if (src.startsWith('10101') || src.startsWith('10102')) newGold -= amt;
      } else if (transactionData.transaction_type === 'Assets' || transactionData.transaction_type === 'Liabilities') {
        const src = transactionData.source_dest_bank;
        const tgt = transactionData.target_account;
        let effect = 0;
        if (transactionData.flow === 'neutral') {
          if (src && (src.startsWith('10101') || src.startsWith('10102'))) effect -= amt;
          if (tgt && (tgt.startsWith('10101') || tgt.startsWith('10102'))) effect += amt;
        } else if (transactionData.flow === 'inflow') {
          if (src && (src.startsWith('10101') || src.startsWith('10102'))) effect += amt;
          if (tgt && (tgt.startsWith('10101') || tgt.startsWith('10102'))) effect -= amt;
        } else if (transactionData.flow === 'outflow') {
          if (src && (src.startsWith('10101') || src.startsWith('10102'))) effect -= amt;
          if (tgt && (tgt.startsWith('10101') || tgt.startsWith('10102'))) effect += amt;
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

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const savedTx = { ...data[0], from: data[0].origin || data[0].from };
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === tempId ? savedTx : t))
        }));
      }

      const finalXp = Math.floor(newXp);
      // Update profiles directly in database for XP and level
      await supabase
        .from('profiles')
        .update({
          xp: finalXp,
          level: newLevel
        })
        .eq('id', userId);

      // Fetch the updated profile to synchronize gold (computed by the database trigger) along with XP and level
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

      if (error) {
        throw error;
      }

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

      // Fetch only the profile stats
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

      // Sync state
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

  initAuth: () => {
    // Helper function to load profile and data for a session
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
            let categoryOpts = s.categoryOptions || get().categoryOptions;
            let entityMaps = s.entityMappings || get().entityMappings;
            let temps = s.templates || get().templates;
            let subClassOpts = s.subClassOptions || get().subClassOptions;
            let entityOpts = s.entityOptions || get().entityOptions;
            let subtypeToCategory = s.subtypeToCategoryMap || get().subtypeToCategoryMap;

            const isObsolete = 
              categoryOpts.includes('Payroll') || 
              categoryOpts.includes('Burrowed') ||
              categoryOpts.includes('Income • Payroll') ||
              categoryOpts.includes('Salary (payroll)') ||
              categoryOpts.includes('Bank Accounts (Ordem)') ||
              categoryOpts.includes('Payroll & Active Income') ||
              subClassOpts.includes('Salary (payroll)') ||
              subClassOpts.includes('Income • Payroll') ||
              subClassOpts.includes('Bank Accounts (Ordem)') ||
              entityMaps['Salary'] === 'Payroll & Active Income' ||
              Object.values(entityMaps).includes('Income • Payroll') ||
              Object.values(entityMaps).includes('Salary (payroll)');

            if (isObsolete) {
              categoryOpts = get().categoryOptions;
              entityMaps = get().entityMappings;
              subClassOpts = get().subClassOptions;
              entityOpts = get().entityOptions;
              subtypeToCategory = get().subtypeToCategoryMap;

              if (Array.isArray(temps)) {
                temps = temps.map(t => {
                  if (t.data) {
                    let updatedSubtype = t.data.transaction_subtype;
                    let updatedCategory = t.data.transaction_category;
                    if (updatedSubtype === 'Bank Accounts (Ordem)') updatedSubtype = 'Banks';
                    else if (updatedSubtype === 'Payroll & Active Income') updatedSubtype = 'Payroll';
                    else if (updatedSubtype === 'Salary (payroll)' || updatedSubtype === 'Income • Payroll') updatedSubtype = 'Payroll';

                    if (updatedCategory === 'Bank Accounts (Ordem)') updatedCategory = 'Bank account';
                    else if (updatedCategory === 'Payroll & Active Income') updatedCategory = 'Salary';
                    else if (updatedCategory === 'Salary (payroll)' || updatedCategory === 'Income • Payroll') updatedCategory = 'Salary';

                    return {
                      ...t,
                      data: {
                        ...t.data,
                        transaction_subtype: updatedSubtype,
                        transaction_category: updatedCategory
                      }
                    };
                  }
                  return t;
                });
              }

              localStorage.removeItem('eldoria_entityOptions');
              localStorage.removeItem('eldoria_entityMappings');
              localStorage.removeItem('eldoria_categoryOptions');
              localStorage.removeItem('eldoria_subClassOptions');
              localStorage.removeItem('eldoria_subtypeToCategoryMap');
              
              supabase
                .from('profiles')
                .update({
                  settings: {
                    ...s,
                    categoryOptions: categoryOpts,
                    entityMappings: entityMaps,
                    templates: temps,
                    subClassOptions: subClassOpts,
                    entityOptions: entityOpts,
                    subtypeToCategoryMap: subtypeToCategory
                  }
                })
                .eq('id', session.user.id)
                .then();
            }

            set({
              templates: temps,
              fromOptions: s.fromOptions || get().fromOptions,
              entityOptions: entityOpts,
              categoryOptions: categoryOpts,
              entityMappings: entityMaps,
              subtypeToCategoryMap: subtypeToCategory,
              subClassOptions: subClassOpts,
              language: s.language || get().language
            });
            if (s.language) {
              i18n.changeLanguage(s.language);
            }
          }
        }
        get().fetchKingdomData(session.user.id);
        get().fetchDashboardData(session.user.id);
      } else {
        set({ user: null, role: 'lord', email: 'guest@medieval.stuff' });
        get().resetStore();
        // Fetch guest profile data and dashboard data from Supabase
        get().fetchKingdomData('00000000-0000-0000-0000-000000000000');
        get().fetchDashboardData('00000000-0000-0000-0000-000000000000');
      }
    };

    // Load initial session immediately
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
