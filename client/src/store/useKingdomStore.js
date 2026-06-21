import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import i18n from '../i18n';

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
  const cachedCategories = localStorage.getItem('eldoria_categoryOptions');
  if (cachedCategories) {
    const parsed = JSON.parse(cachedCategories);
    if (parsed.includes('Payroll') || parsed.includes('Burrowed')) {
      localStorage.removeItem('eldoria_categoryOptions');
      localStorage.removeItem('eldoria_entityMappings');
      localStorage.removeItem('eldoria_templates');
      localStorage.removeItem('eldoria_entityOptions');
    }
  }
  const cachedEntities = localStorage.getItem('eldoria_entityOptions');
  if (cachedEntities) {
    const parsed = JSON.parse(cachedEntities);
    if (!parsed.includes('Reni (Burrow)') || !parsed.includes('ENDESA')) {
      localStorage.removeItem('eldoria_entityOptions');
      localStorage.removeItem('eldoria_entityMappings');
      localStorage.removeItem('eldoria_templates');
      localStorage.removeItem('eldoria_categoryOptions');
    }
  }
} catch (e) {
  // Ignore
}

export const useKingdomStore = create((set, get) => ({
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

  syncSettings: async (updates) => {
    set(updates);
    Object.entries(updates).forEach(([key, val]) => {
      saveLocal(key, val);
    });
    const userId = get().user?.id;
    if (userId) {
      const settings = {
        templates: get().templates,
        fromOptions: get().fromOptions,
        entityOptions: get().entityOptions,
        categoryOptions: get().categoryOptions,
        entityMappings: get().entityMappings,
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
  subClassOptions: ["Banks","Investments","Personal Debt","Other Debts","Living & Household","Utilities","Personal Transports","Public Transports","Health","Markets & Personal care","Payroll","Education","Entertainment","Food & Consumables","Tools & Materials","Clothing & Shoes","Insurances","Other Consumables","Taxes & State"],
  entityOptions: loadLocal('entityOptions', [
    'CGD', 'ActiveBank', 'Inter(Brasil)', 'Savings (Pedro) 0%', 'Universo', 'Cofidis', 'Inter',
    'Jota (Marmitas)', 'Mae (Burrow)', 'Reni (Burrow)', 'Pedro (Burrow)', 'Social Security',
    'Finances', 'NOS', 'Home Decor', 'Repairs', 'Kitchen/Home', 'Oeiras', 'Portela',
    'ENDESA', 'SIMAS', 'DIGAL', 'Car Gasoline', 'Motorcycle Gasoline',
    'Car Repair & Maintenance', 'Motorcycle Repair & Maintenance', 'Parking', 'Tolls',
    'Traffic Fine', 'Transport Insurance', 'Bus', 'Metro', 'Train',
    'Psicologist 1', 'Psicologist 2', 'Psichiatry 1', 'Psichiatry 2',
    'Public', 'CUF', 'Lusiadas', 'Luz', 'Doctor session & Medical Exams',
    'Beatriz', 'Dentist 2', 'Pharmacy Oeiras', 'Pharmacy Portela',
    'Salary', 'Bonus', 'Vacation subsidy', 'Christmas subsidy', 'Teaching classes',
    'Freelance', 'Consultancy', 'Gift', 'Rewards', 'PhD', 'Trainings',
    'Restaurants', 'Nightlife & Disco', 'Cinema', 'Gaming', 'Supermarket',
    'Refrigerantes', 'Alcoholic', 'Personal Care', 'Cosmetics', 'Tools and Equipment',
    'Other materials', 'Clothing', 'Shoes', 'Car', 'motorcycle', 'house', 'Equipment',
    'IMI', 'State Tax', 'Gov Tax', 'Fees/Duties', 'Vehicle Tax', 'Transit Fine',
    'Gov payment', 'Gov refund'
  ]),
  categoryOptions: loadLocal('categoryOptions', [
    "Bank account", "Saving account", "Investment account", "Loans", "Burrow", "Credit Cards",
    "Other Debts", "Household Décor", "Household Utensils", "Rent", "Electricity (house)",
    "Water (house)", "Gas (house)", "Comunications (house)", "Vehicle Gasoline",
    "Vehicle Repair & Maintenance", "Parking", "Tolls", "Vehicle Fines", "Vehicle Bills",
    "Public Transports", "Psicology session", "Psichiatry session", "Hospital",
    "Doctor session & Medical Exams", "Dentist", "Pharmacy", "Salary", "Bonus",
    "Vacation subsidy", "Christmas subsidy", "Teaching classes", "Freelancer",
    "Consultancy", "Other Incomes", "PhD", "Trainings", "Restaurants", "Nightlife & Disco",
    "Cinema", "Gaming", "Food", "Drinks", "Supermarket (Other)", "Tools", "Other materials",
    "Clothing", "Shoes", "Insurances", "General Taxes", "Tax Fines", "IRS payment", "IRS refund"
  ]),
  entityMappings: loadLocal('entityMappings', {
    "CGD": "Bank account",
    "ActiveBank": "Bank account",
    "Inter(Brasil)": "Bank account",
    "Savings (Pedro) 0%": "Saving account",
    "Universo": "Credit Cards",
    "Cofidis": "Loans",
    "Inter": "Saving account",
    "Jota (Marmitas)": "Burrow",
    "Mae (Burrow)": "Burrow",
    "Reni (Burrow)": "Burrow",
    "Pedro (Burrow)": "Burrow",
    "Social Security": "Other Debts",
    "Finances": "Other Debts",
    "Home Decor": "Household Décor",
    "Repairs": "Household Utensils",
    "Kitchen/Home": "Household Utensils",
    "Oeiras": "Rent",
    "Portela": "Rent",
    "ENDESA": "Electricity (house)",
    "SIMAS": "Water (house)",
    "DIGAL": "Gas (house)",
    "NOS": "Comunications (house)",
    "Car Gasoline": "Vehicle Gasoline",
    "Motorcycle Gasoline": "Vehicle Gasoline",
    "Car Repair & Maintenance": "Vehicle Repair & Maintenance",
    "Motorcycle Repair & Maintenance": "Vehicle Repair & Maintenance",
    "Parking": "Parking",
    "Tolls": "Tolls",
    "Traffic Fine": "Vehicle Fines",
    "Transport Insurance": "Vehicle Bills",
    "Bus": "Public Transports",
    "Metro": "Public Transports",
    "Train": "Public Transports",
    "Psicologist 1": "Psicology session",
    "Psicologist 2": "Psicology session",
    "Psichiatry 1": "Psichiatry session",
    "Psichiatry 2": "Psichiatry session",
    "Public": "Hospital",
    "CUF": "Hospital",
    "Lusiadas": "Hospital",
    "Luz": "Hospital",
    "Doctor session & Medical Exams": "Doctor session & Medical Exams",
    "Beatriz": "Dentist",
    "Dentist 2": "Dentist",
    "Pharmacy Oeiras": "Pharmacy",
    "Pharmacy Portela": "Pharmacy",
    "Salary": "Salary",
    "Bonus": "Bonus",
    "Vacation subsidy": "Vacation subsidy",
    "Christmas subsidy": "Christmas subsidy",
    "Teaching classes": "Teaching classes",
    "Freelance": "Freelancer",
    "Consultancy": "Consultancy",
    "Gift": "Other Incomes",
    "Rewards": "Other Incomes",
    "PhD": "PhD",
    "Trainings": "Trainings",
    "Restaurants": "Restaurants",
    "Nightlife & Disco": "Nightlife & Disco",
    "Cinema": "Cinema",
    "Gaming": "Gaming",
    "Supermarket": "Food",
    "Refrigerantes": "Drinks",
    "Alcoholic": "Drinks",
    "Personal Care": "Supermarket (Other)",
    "Cosmetics": "Supermarket (Other)",
    "Tools and Equipment": "Tools",
    "Other materials": "Other materials",
    "Clothing": "Clothing",
    "Shoes": "Shoes",
    "Car": "Insurances",
    "motorcycle": "Insurances",
    "house": "Insurances",
    "Equipment": "Insurances",
    "IMI": "General Taxes",
    "State Tax": "General Taxes",
    "Gov Tax": "General Taxes",
    "Fees/Duties": "General Taxes",
    "Vehicle Tax": "General Taxes",
    "Transit Fine": "Tax Fines",
    "Gov payment": "IRS payment",
    "Gov refund": "IRS refund"
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
      "target_account": "131001",
      "source_dest_bank": "111001",
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
      "entity": "Credit Card Universo",
      "transaction_category": "Credit Cards",
      "target_account": "",
      "source_dest_bank": "221002",
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
      "entity": "WizInk",
      "transaction_category": "Credit Cards",
      "target_account": "221004",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Pay credit card bill"
    }
  },
  {
    "name": "Amortize Loan",
    "icon": "📉",
    "data": {
      "from": "Pedro",
      "transaction_type": "Liabilities",
      "transaction_subtype": "Personal Debt",
      "entity": "CGD",
      "transaction_category": "Loans",
      "target_account": "211001",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Loan amortization"
    }
  },
  {
    "name": "Burrow cash",
    "icon": "🪙",
    "data": {
      "from": "Consolidated",
      "transaction_type": "Liabilities",
      "transaction_subtype": "Other Debts",
      "entity": "Jota (Marmitas)",
      "transaction_category": "Burrow",
      "target_account": "111001",
      "source_dest_bank": "212001",
      "flow": "inflow",
      "payment_status": "Completed",
      "description": "Borrow cash"
    }
  },
  {
    "name": "Repay Personal Debt",
    "icon": "🤝",
    "data": {
      "from": "Pedro",
      "transaction_type": "Liabilities",
      "transaction_subtype": "Personal Debt",
      "entity": "Mae (Burrow)",
      "transaction_category": "Burrow",
      "target_account": "212002",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Repay personal debt"
    }
  },
  {
    "name": "Rent",
    "icon": "🏰",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Living & Household",
      "entity": "Landlord",
      "transaction_category": "Rent",
      "target_account": "611001",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Rent payment"
    }
  },
  {
    "name": "Repairs",
    "icon": "🔧",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Living & Household",
      "entity": "Repairs",
      "transaction_category": "Household Utensils",
      "target_account": "611002",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Repairs"
    }
  },
  {
    "name": "Decorations",
    "icon": "🎨",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Living & Household",
      "entity": "Home Decor",
      "transaction_category": "Household Décor",
      "target_account": "611003",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Decorations"
    }
  },
  {
    "name": "Utensils",
    "icon": "🍽️",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Living & Household",
      "entity": "Kitchen/Home",
      "transaction_category": "Household Utensils",
      "target_account": "611004",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Utensils"
    }
  },
  {
    "name": "Electricity",
    "icon": "⚡",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Utilities",
      "entity": "Energy",
      "transaction_category": "Electricity (house)",
      "target_account": "621001",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Electricity bill"
    }
  },
  {
    "name": "Gas",
    "icon": "🔥",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Utilities",
      "entity": "Gas",
      "transaction_category": "Gas (house)",
      "target_account": "621002",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Gas bill"
    }
  },
  {
    "name": "Water",
    "icon": "💧",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Utilities",
      "entity": "Water",
      "transaction_category": "Water (house)",
      "target_account": "621003",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Water bill"
    }
  },
  {
    "name": "Communications",
    "icon": "📞",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Utilities",
      "entity": "Internet",
      "transaction_category": "Comunications (house)",
      "target_account": "621004",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Communications bill"
    }
  },
  {
    "name": "Gasoline",
    "icon": "⛽",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Personal Transports",
      "entity": "Gasoline",
      "transaction_category": "Vehicle Gasoline",
      "target_account": "631001",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Gasoline"
    }
  },
  {
    "name": "Repairs/maintenance",
    "icon": "🛠️",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Personal Transports",
      "entity": "Vehicle repairs",
      "transaction_category": "Vehicle Repair & Maintenance",
      "target_account": "642001",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Vehicle maintenance"
    }
  },
  {
    "name": "Parking",
    "icon": "🅿️",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Personal Transports",
      "entity": "Parking",
      "transaction_category": "Parking",
      "target_account": "631003",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Parking fee"
    }
  },
  {
    "name": "Tolls",
    "icon": "🛣️",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Personal Transports",
      "entity": "Tolls",
      "transaction_category": "Tolls",
      "target_account": "631002",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Highway toll"
    }
  },
  {
    "name": "Taxes (Transport)",
    "icon": "🏷️",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Taxes & State",
      "entity": "Vehicle Tax",
      "transaction_category": "General Taxes",
      "target_account": "681002",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Vehicle tax"
    }
  },
  {
    "name": "Fines (Personal)",
    "icon": "⚠️",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Taxes & State",
      "entity": "Traffic Fine",
      "transaction_category": "Vehicle Fines",
      "target_account": "681002",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Traffic fine"
    }
  },
  {
    "name": "Metro",
    "icon": "🚇",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Public Transports",
      "entity": "Public Transit",
      "transaction_category": "Parking",
      "target_account": "631003",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Metro public transit"
    }
  },
  {
    "name": "Bus",
    "icon": "🚌",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Public Transports",
      "entity": "Bus",
      "transaction_category": "Parking",
      "target_account": "631003",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Bus public transit"
    }
  },
  {
    "name": "Train",
    "icon": "🚆",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Public Transports",
      "entity": "Public Transit",
      "transaction_category": "Parking",
      "target_account": "631003",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Train public transit"
    }
  },
  {
    "name": "Fines (Public)",
    "icon": "🚨",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Taxes & State",
      "entity": "Transit Fine",
      "transaction_category": "Vehicle Fines",
      "target_account": "681002",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Transit fine"
    }
  },
  {
    "name": "Food & Consumables",
    "icon": "🍎",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Food & Consumables",
      "entity": "Supermarket",
      "transaction_category": "Food",
      "target_account": "641001",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Groceries"
    }
  },
  {
    "name": "Tools & Materials",
    "icon": "🔨",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Tools & Materials",
      "entity": "Tools and Equipment",
      "transaction_category": "Tools",
      "target_account": "642001",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Hardware tools & materials"
    }
  },
  {
    "name": "Clothing",
    "icon": "👕",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Clothing & Shoes",
      "entity": "Clothing",
      "transaction_category": "Clothing",
      "target_account": "643001",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Clothing"
    }
  },
  {
    "name": "Restaurants",
    "icon": "🍔",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Entertainment",
      "entity": "Restaurant",
      "transaction_category": "Restaurants",
      "target_account": "661001",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Dining out at restaurant"
    }
  },
  {
    "name": "Cinema",
    "icon": "🎬",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Entertainment",
      "entity": "Cinema",
      "transaction_category": "Cinema",
      "target_account": "662001",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Cinema movies"
    }
  },
  {
    "name": "Bars & Nightlife",
    "icon": "🍻",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Entertainment",
      "entity": "Shows",
      "transaction_category": "Nightlife & Disco",
      "target_account": "661001",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Bars & nightlife drinks"
    }
  },
  {
    "name": "Pharmacy",
    "icon": "💊",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Health",
      "entity": "Medicine",
      "transaction_category": "Pharmacy",
      "target_account": "651002",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Pharmacy medication"
    }
  },
  {
    "name": "Hospital",
    "icon": "🏥",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Health",
      "entity": "Medical Appointments",
      "transaction_category": "Hospital",
      "target_account": "651004",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Medical appointment/hospital"
    }
  },
  {
    "name": "Exams",
    "icon": "📝",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Health",
      "entity": "Medical Exams",
      "transaction_category": "Doctor session & Medical Exams",
      "target_account": "651005",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Medical exams/tests"
    }
  },
  {
    "name": "Haircuts/Grooming",
    "icon": "✂️",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Markets & Personal care",
      "entity": "Personal Care",
      "transaction_category": "Supermarket (Other)",
      "target_account": "643001",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Personal care grooming"
    }
  },
  {
    "name": "Makeups",
    "icon": "💄",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Markets & Personal care",
      "entity": "Cosmetics",
      "transaction_category": "Supermarket (Other)",
      "target_account": "641001",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Cosmetics/makeups"
    }
  },
  {
    "name": "Base Salary",
    "icon": "💰",
    "data": {
      "from": "Consolidated",
      "transaction_type": "Income",
      "transaction_subtype": "Payroll",
      "entity": "Salary",
      "transaction_category": "Salary",
      "target_account": "711001",
      "source_dest_bank": "",
      "flow": "inflow",
      "payment_status": "Completed",
      "description": "Base salary income"
    }
  },
  {
    "name": "Meal Allowance",
    "icon": "🍱",
    "data": {
      "from": "Consolidated",
      "transaction_type": "Income",
      "transaction_subtype": "Payroll",
      "entity": "Salary",
      "transaction_category": "Salary",
      "target_account": "711002",
      "source_dest_bank": "",
      "flow": "inflow",
      "payment_status": "Completed",
      "description": "Meal allowance subsidies"
    }
  },
  {
    "name": "Holiday & Xmas Bonus",
    "icon": "🎁",
    "data": {
      "from": "Consolidated",
      "transaction_type": "Income",
      "transaction_subtype": "Payroll",
      "entity": "Bonus",
      "transaction_category": "Bonus",
      "target_account": "711003",
      "source_dest_bank": "",
      "flow": "inflow",
      "payment_status": "Completed",
      "description": "Holiday & Christmas bonus"
    }
  },
  {
    "name": "Consulting/Contracts",
    "icon": "📈",
    "data": {
      "from": "Consolidated",
      "transaction_type": "Income",
      "transaction_subtype": "Payroll",
      "entity": "Freelance",
      "transaction_category": "Freelancer",
      "target_account": "712001",
      "source_dest_bank": "",
      "flow": "inflow",
      "payment_status": "Completed",
      "description": "Consulting contract income"
    }
  },
  {
    "name": "Social Security",
    "icon": "🛡️",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Taxes & State",
      "entity": "State Tax",
      "transaction_category": "General Taxes",
      "target_account": "681002",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Social security state tax"
    }
  },
  {
    "name": "Finance",
    "icon": "🏢",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Taxes & State",
      "entity": "Gov Tax",
      "transaction_category": "General Taxes",
      "target_account": "681002",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Finance government tax"
    }
  },
  {
    "name": "Other Taxes & State",
    "icon": "🏛️",
    "data": {
      "from": "Pedro",
      "transaction_type": "Expense",
      "transaction_subtype": "Taxes & State",
      "entity": "Fees/Duties",
      "transaction_category": "General Taxes",
      "target_account": "681002",
      "source_dest_bank": "111001",
      "flow": "outflow",
      "payment_status": "Completed",
      "description": "Other taxes and state duties"
    }
  },
  {
    "name": "IRS Tax Refund",
    "icon": "💸",
    "data": {
      "from": "Consolidated",
      "transaction_type": "Income",
      "transaction_subtype": "Taxes & State",
      "entity": "Gov Refund",
      "transaction_category": "IRS refund",
      "target_account": "731001",
      "source_dest_bank": "",
      "flow": "inflow",
      "payment_status": "Completed",
      "description": "IRS tax refund"
    }
  },
  {
    "name": "Family Gifts",
    "icon": "💝",
    "data": {
      "from": "Consolidated",
      "transaction_type": "Income",
      "transaction_subtype": "Payroll",
      "entity": "Gift",
      "transaction_category": "Other Incomes",
      "target_account": "731002",
      "source_dest_bank": "",
      "flow": "inflow",
      "payment_status": "Completed",
      "description": "Family gifts"
    }
  },
  {
    "name": "Cashbacks & Rewards",
    "icon": "🏆",
    "data": {
      "from": "Consolidated",
      "transaction_type": "Income",
      "transaction_subtype": "Payroll",
      "entity": "Rewards",
      "transaction_category": "Other Incomes",
      "target_account": "731003",
      "source_dest_bank": "",
      "flow": "inflow",
      "payment_status": "Completed",
      "description": "Cashbacks & rewards"
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
          level: data.level || 1,
          xp: data.xp || 0,
        });

        if (data.settings) {
          const s = data.settings;
          let categoryOpts = s.categoryOptions || get().categoryOptions;
          let entityMaps = s.entityMappings || get().entityMappings;
          let temps = s.templates || get().templates;
          let subClassOpts = s.subClassOptions || get().subClassOptions;

          if (categoryOpts.includes('Payroll') || categoryOpts.includes('Burrowed')) {
            categoryOpts = get().categoryOptions;
            entityMaps = get().entityMappings;
            temps = get().templates;
            subClassOpts = get().subClassOptions;
            
            supabase
              .from('profiles')
              .update({
                settings: {
                  ...s,
                  categoryOptions: categoryOpts,
                  entityMappings: entityMaps,
                  templates: temps,
                  subClassOptions: subClassOpts
                }
              })
              .eq('id', userId)
              .then();
          }

          set({
            templates: temps,
            fromOptions: s.fromOptions || get().fromOptions,
            entityOptions: s.entityOptions || get().entityOptions,
            categoryOptions: categoryOpts,
            entityMappings: entityMaps,
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
      const calculatedGold = Math.max(0, startingGold + netCash);

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

      // Update profiles directly in database to ensure sync even if trigger is missing
      await supabase
        .from('profiles')
        .update({
          gold: newGold,
          xp: newXp,
          level: newLevel
        })
        .eq('id', userId);

      set({
        gold: newGold,
        xp: newXp,
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

  // Insert multiple transactions to database in a single query, triggering updates, and synchronize state
  registerTransactions: async (profileId, transactionsList) => {
    const userId = get().user?.id || profileId;
    const tempIds = [];
    const tempTxs = transactionsList.map((tx, idx) => {
      const tempId = 'temp-batch-' + idx + '-' + Date.now();
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
        target_account: tx.target_account,
        source_dest_bank: tx.source_dest_bank,
        flow: tx.flow,
        description: tx.description,
        created_at: new Date().toISOString()
      };
    });

    const prevTransactions = get().transactions;
    set({ transactions: [...tempTxs, ...prevTransactions], isLoading: true });

    try {
      const formatted = transactionsList.map((tx) => ({
        profile_id: userId,
        transaction_type: tx.transaction_type,
        amount: Number(tx.amount),
        value_date: tx.value_date || null,
        posting_date: tx.posting_date || null,
        due_date: tx.due_date || null,
        payment_status: tx.payment_status || 'Completed',
        transaction_subtype: tx.transaction_subtype,
        entity: tx.entity,
        origin: tx.from,
        target_account: tx.target_account,
        source_dest_bank: tx.source_dest_bank,
        flow: tx.flow,
        description: tx.description
      }));

      const { data, error } = await supabase
        .from('transactions')
        .insert(formatted)
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

            if (categoryOpts.includes('Payroll') || categoryOpts.includes('Burrowed')) {
              categoryOpts = get().categoryOptions;
              entityMaps = get().entityMappings;
              temps = get().templates;
              subClassOpts = get().subClassOptions;
              
              supabase
                .from('profiles')
                .update({
                  settings: {
                    ...s,
                    categoryOptions: categoryOpts,
                    entityMappings: entityMaps,
                    templates: temps,
                    subClassOptions: subClassOpts
                  }
                })
                .eq('id', session.user.id)
                .then();
            }

            set({
              templates: temps,
              fromOptions: s.fromOptions || get().fromOptions,
              entityOptions: s.entityOptions || get().entityOptions,
              categoryOptions: categoryOpts,
              entityMappings: entityMaps,
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

  resetStore: () => set({
    gold: 0,
    gems: 100,
    xp: 0,
    level: 1,
    email: 'lord.eldoria@kingdom.gov',
    transactions: [],
    accountBalances: [],
    isLoading: false,
    language: 'en'
  })
}));

export default useKingdomStore;
