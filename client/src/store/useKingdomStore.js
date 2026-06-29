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
  classOptions: ['Income', 'Expense', 'Assets', 'Liabilities'],
  subClassOptions: ["Banks", "Fixed Assets", "Personal Debt", "Other Debts", "Living & Household", "Personal Transports", "Public Transports", "Other Transports", "Markets & Consumables", "Health", "Entertainment", "Education", "Insurances", "Insurances (income)", "Taxes & State", "Taxes & State (income)", "Financial Expenses", "Payroll", "Other Income", "Financial Income"],
  entityOptions: loadLocal('entityOptions', [
    'CGD', 'Universo', 'Active Bank', 'Inter Bank', 'Wizink', 'Cofidis', 'Other Loans', 'Jota', 'Mae', 'Reni', 'Pedro', 'Other Burrow',
    'Social Security', 'Finances', 'NOS',
    'Oeiras', 'Oeiras Utensils', 'Oeiras Decoration', 'Other Household', 'Portela',
    'DIGAL', 'SIMAS', 'Other Utilities',
    'Motorcycle', 'Car', 'Via Verde', 'Parking',
    'Public Transport (Metro/Train/Bus)', 'Uber / Chauffeur', 'Taxis',
    'Food', 'Pet Food', 'Food (work lunch)', 'Soda Drinks', 'Alcoholic Drinks', 'Cleaning Products', 'Personal Hygiene', 'Cosmetics',
    'Tools', 'Clothing', 'Shoes', 'Other Market consumables',
    'Public Hospital', 'Private Hospital', 'Medical Sessions & Exams', 'Active Psicologia Coimbra', 'Psicologist 2', 'Marco (Jota Mateus)', 'Marco Consultas (private)', 'Dentist Beatriz', 'Dentist 2', 'Farmacia Oeiras', 'Farmacia Portela',
    'Restaurant dinner', 'Cinema', 'Streaming', 'Nightlife & Disco', 'Gaming',
    'PhD', 'Trainings',
    'Health Insurance', 'Life insurance',
    'Mobility (IUC)', 'IRS', 'Interest', 'Fines',
    'Base Salary', 'Consulting / Contract Services', 'Teaching Classes', 'Bonus (Scorecard)',
    'Vacation Subsidy', 'Christmas Subsidy',
    'Family Gifts', 'Cashbacks & Rewards',
    'Mobility', 'Justice',
    'CGD Credit Cards', 'Universo Credit Cards', 'Active Bank Credit Cards', 'Inter Bank Credit Cards'
  ]),
  categoryOptions: loadLocal('categoryOptions', [
    "Bank account", "Savings account", "Investments account",
    "Loans & Burrow", "Credit Cards", "Other Debts",
    "Household", "Utilities", "Gasoline", "Tolls", "Parking", "Repairs",
    "Public Transports", "Other Transports",
    "Markets & Groceries", "Markets and Tools", "Markets and Clothing", "Other Market consumables",
    "Health", "Entertainment", "Education", "Insurances", "Taxes",
    "Interest paid", "Fines",
    "Salary", "Payroll Subsidies", "Other Incomes", "Interest",
    "Fixed Assets"
  ]),
  subtypeToCategoryMap: loadLocal('subtypeToCategoryMap', {
    "Banks": ["Bank account", "Savings account", "Investments account"],
    "Fixed Assets": ["Fixed Assets"],
    "Personal Debt": ["Loans & Burrow", "Credit Cards"],
    "Other Debts": ["Other Debts"],
    "Living & Household": ["Household", "Utilities"],
    "Personal Transports": ["Gasoline", "Tolls", "Parking", "Repairs"],
    "Public Transports": ["Public Transports"],
    "Other Transports": ["Other Transports"],
    "Markets & Consumables": ["Markets & Groceries", "Markets and Tools", "Markets and Clothing", "Other Market consumables"],
    "Health": ["Health"],
    "Entertainment": ["Entertainment"],
    "Education": ["Education"],
    "Insurances": ["Insurances"],
    "Insurances (income)": ["Insurances"],
    "Taxes & State": ["Taxes", "Interest"],
    "Taxes & State (income)": ["Taxes", "Interest"],
    "Financial Expenses": ["Interest paid", "Fines", "Loans & Burrow", "Credit Cards"],
    "Payroll": ["Salary", "Payroll Subsidies"],
    "Other Income": ["Other Incomes"],
    "Financial Income": ["Fines", "Loans & Burrow", "Credit Cards"]
  }),
  subtypeTypes: loadLocal('subtypeTypes', {
    "Banks": ["1"],
    "Fixed Assets": ["1"],
    "Personal Debt": ["2"],
    "Other Debts": ["2"],
    "Living & Household": ["6"],
    "Personal Transports": ["6"],
    "Public Transports": ["6"],
    "Other Transports": ["6"],
    "Markets & Consumables": ["6"],
    "Health": ["6"],
    "Entertainment": ["6"],
    "Education": ["6"],
    "Insurances": ["6"],
    "Insurances (income)": ["7"],
    "Taxes & State": ["6"],
    "Taxes & State (income)": ["7"],
    "Financial Expenses": ["6"],
    "Payroll": ["7"],
    "Other Income": ["7"],
    "Financial Income": ["7"]
  }),
  entityMappings: loadLocal('entityMappings', {
    "CGD": "Bank account",
    "Universo": "Bank account",
    "Active Bank": "Bank account",
    "Inter Bank": "Bank account",
    "Wizink": "Investments account",
    "Cofidis": "Loans & Burrow",
    "Other Loans": "Loans & Burrow",
    "Jota": "Loans & Burrow",
    "Mae": "Loans & Burrow",
    "Reni": "Loans & Burrow",
    "Pedro": "Loans & Burrow",
    "Other Burrow": "Loans & Burrow",
    "Social Security": "Taxes",
    "Finances": "Taxes",
    "NOS": "Utilities",
    "Oeiras": "Household",
    "Oeiras Utensils": "Household",
    "Oeiras Decoration": "Household",
    "Other Household": "Household",
    "Portela": "Household",
    "DIGAL": "Utilities",
    "SIMAS": "Utilities",
    "Other Utilities": "Utilities",
    "Motorcycle": "Gasoline",
    "Car": "Gasoline",
    "Via Verde": "Tolls",
    "Parking": "Parking",
    "Public Transport (Metro/Train/Bus)": "Public Transports",
    "Uber / Chauffeur": "Other Transports",
    "Taxis": "Other Transports",
    "Food": "Markets & Groceries",
    "Pet Food": "Markets & Groceries",
    "Food (work lunch)": "Markets & Groceries",
    "Soda Drinks": "Markets & Groceries",
    "Alcoholic Drinks": "Markets & Groceries",
    "Cleaning Products": "Markets & Groceries",
    "Personal Hygiene": "Markets & Groceries",
    "Cosmetics": "Markets & Groceries",
    "Tools": "Markets and Tools",
    "Clothing": "Markets and Clothing",
    "Shoes": "Markets and Clothing",
    "Other Market consumables": "Other Market consumables",
    "Public Hospital": "Health",
    "Private Hospital": "Health",
    "Medical Sessions & Exams": "Health",
    "Active Psicologia Coimbra": "Health",
    "Psicologist 2": "Health",
    "Marco (Jota Mateus)": "Health",
    "Marco Consultas (private)": "Health",
    "Dentist Beatriz": "Health",
    "Dentist 2": "Health",
    "Farmacia Oeiras": "Health",
    "Farmacia Portela": "Health",
    "Restaurant dinner": "Entertainment",
    "Cinema": "Entertainment",
    "Streaming": "Entertainment",
    "Nightlife & Disco": "Entertainment",
    "Gaming": "Entertainment",
    "PhD": "Education",
    "Trainings": "Education",
    "Health Insurance": "Insurances",
    "Life insurance": "Insurances",
    "Mobility (IUC)": "Taxes",
    "IRS": "Taxes",
    "Interest": "Interest",
    "Fines": "Fines",
    "Loans Cofidis": "Loans & Burrow",
    "Loans CGD": "Loans & Burrow",
    "Borrow Jota": "Loans & Burrow",
    "Borrow Mum": "Loans & Burrow",
    "Base Salary": "Salary",
    "Consulting / Contract Services": "Salary",
    "Teaching Classes": "Salary",
    "Bonus (Scorecard)": "Salary",
    "Vacation Subsidy": "Payroll Subsidies",
    "Christmas Subsidy": "Payroll Subsidies",
    "Family Gifts": "Other Incomes",
    "Cashbacks & Rewards": "Other Incomes",
    "Mobility": "Taxes",
    "Justice": "Taxes",
    "CGD Credit Cards": "Credit Cards",
    "Universo Credit Cards": "Credit Cards",
    "Active Bank Credit Cards": "Credit Cards",
    "Inter Bank Credit Cards": "Credit Cards"
  }),
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
        supabase.from('transactions').select('*').eq('profile_id', userId).order('created_at', { ascending: false }).limit(200),
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
          if (t.transaction_type === 'Income') return sum + amt;
          if (t.transaction_type === 'Expense') return sum - amt;
          if (t.transaction_type === 'Assets' || t.transaction_type === 'Liabilities') {
            if (t.flow === 'inflow') return sum + amt;
            if (t.flow === 'outflow') return sum - amt;
          }
          return sum;
        }, 0);
      
      const startingGold = 0;
      const calculatedGold = Math.floor(Math.max(0, startingGold + netCash));

      // If calculatedGold is different from state gold, sync it to state and database
      if (calculatedGold !== get().gold) {
        set({ gold: calculatedGold });
        supabase
          .from('profiles')
          .update({ gold: calculatedGold })
          .eq('id', userId)
          .then();
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
        newGold += amt;
        earnedXp = amt * 2;
      } else if (transactionData.transaction_type === 'Expense') {
        newGold = Math.max(0, newGold - amt);
      } else if (transactionData.transaction_type === 'Assets') {
        if (transactionData.flow === 'inflow') newGold += amt;
        else if (transactionData.flow === 'outflow') newGold = Math.max(0, newGold - amt);
      } else if (transactionData.transaction_type === 'Liabilities') {
        if (transactionData.flow === 'inflow') newGold += amt;
        else if (transactionData.flow === 'outflow') newGold = Math.max(0, newGold - amt);
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

      const finalGold = Math.floor(newGold);
      const finalXp = Math.floor(newXp);
      // Update profiles directly in database to ensure sync even if trigger is missing
      await supabase
        .from('profiles')
        .update({
          gold: finalGold,
          xp: finalXp,
          level: newLevel
        })
        .eq('id', userId);

      set({
        gold: finalGold,
        xp: finalXp,
        level: newLevel
      });

      get().fetchDashboardData(userId);

      return { success: true, data };
    } catch (err) {
      set({ transactions: prevTransactions });
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
