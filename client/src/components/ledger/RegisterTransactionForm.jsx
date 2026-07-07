import React from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';

const RegisterTransactionForm = ({
  txClass,
  setTxClass,
  txSubClass,
  setTxSubClass,
  txFlow,
  setTxFlow,
  txStatus,
  setTxStatus,
  txFrom,
  setTxFrom,
  txCategory,
  setTxCategory,
  txEntity,
  handleEntityChange,
  txAmount,
  setTxAmount,
  txValueDate,
  setTxValueDate,
  txDueDate,
  setTxDueDate,
  txPostingDate,
  setTxPostingDate,
  txDescription,
  setTxDescription,
  txSourceDestBank,
  setTxSourceDestBank,
  txTargetAccount,
  setTxTargetAccount,
  classOptions = [],
  subClassOptions = [],
  statusOptions = [],
  fromOptions = [],
  categoryOptions = [],
  entityOptions = [],
  entityMappings = {},
  accountMappings = {},
  t = (key, fallback) => fallback || key
}) => {
  const subtypeToCategoryMap = useKingdomStore((state) => state.subtypeToCategoryMap) || {
    "Banks": ["Bank account", "Saving account"],
    "Investments": ["Investment account"],
    "Personal Debt": ["Loans", "Burrow", "Credit Cards"],
    "Other Debts": ["Other Debts"],
    "Living & Household": ["Household Décor", "Household Utensils", "Rent"],
    "Utilities": ["Electricity (house)", "Water (house)", "Gas (house)", "Comunications (house)"],
    "Personal Transports": ["Vehicle Gasoline", "Vehicle Repair & Maintenance", "Parking", "Tolls", "Vehicle Fines", "Vehicle Bills"],
    "Public Transports": ["Public Transports"],
    "Payroll": ["Salary", "Bonus", "Vacation subsidy", "Christmas subsidy", "Teaching classes", "Freelancer", "Consultancy", "Other Incomes"],
    "Education": ["PhD", "Trainings"],
    "Entertainment": ["Restaurants", "Nightlife & Disco", "Cinema", "Gaming"],
    "Food & Consumables": ["Food", "Drinks", "Supermarket (Other)"],
    "Tools & Materials": ["Tools", "Other materials"],
    "Clothing & Shoes": ["Clothing", "Shoes"],
    "Health": ["Psicology session", "Psichiatry session", "Hospital", "Doctor session & Medical Exams", "Dentist", "Pharmacy"],
    "Insurances": ["Insurances"],
    "Taxes & State": ["General Taxes", "Tax Fines", "IRS payment", "IRS refund"],
    "Markets & Personal care": [],
    "Other Consumables": []
  };

  const defaultSubtypeToCategoryMap = {
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
    "Taxes & State": ["Taxes", "Interest"],
    "Financial Expenses": ["Interest paid", "Fines", "Loans & Burrow", "Credit Cards"],
    "Payroll": ["Salary", "Payroll Subsidies"],
    "Other Income": ["Other Incomes"],
    "Financial Income": ["Fines", "Loans & Burrow", "Credit Cards"]
  };

  let filteredCategories = categoryOptions;
  if (txSubClass) {
    const allowedCategories = Array.from(new Set([
      ...(subtypeToCategoryMap[txSubClass] || []),
      ...(defaultSubtypeToCategoryMap[txSubClass] || [])
    ]));
    filteredCategories = categoryOptions.filter(opt => allowedCategories.includes(opt));
  }

  const coaMappings = [];
  Object.entries(accountMappings || {}).forEach(([code, fullName]) => {
    let remaining = fullName;
    if (remaining.startsWith(code)) {
      remaining = remaining.substring(code.length).replace(/^\s*-\s*/, '');
    }
    const parts = remaining.split(/\s*-\s*/);
    const category = parts[0] || '';
    const entity = parts.slice(1).join(' - ') || '';
    if (category && entity) {
      coaMappings.push({ category, entity });
    }
  });

  let filteredEntities = entityOptions;
  if (txCategory) {
    filteredEntities = entityOptions.filter(opt => 
      entityMappings[opt] === txCategory ||
      coaMappings.some(m => m.category === txCategory && m.entity === opt)
    );
  } else if (txSubClass) {
    const allowedCategories = subtypeToCategoryMap[txSubClass] || [];
    filteredEntities = entityOptions.filter(opt => 
      allowedCategories.includes(entityMappings[opt]) ||
      coaMappings.some(m => allowedCategories.includes(m.category) && m.entity === opt)
    );
  }

  return (
    <div className="bg-[#faf4e5]/80 border border-[#8b4513]/30 rounded-xl p-3.5 space-y-3 shadow-sm">
      
      {/* Row 1: Type / SubClass / Flow / Status */}
      <div className="grid grid-cols-12 gap-3">
        {/* Type */}
        <div className="col-span-12 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
            Type
          </label>
          <select
            value={txClass}
            onChange={(e) => setTxClass(e.target.value)}
            className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
          >
            <option value="">-- Choose Type --</option>
            {classOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Subtype */}
        <div className="col-span-12 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
            Subtype
          </label>
          <select
            value={txSubClass}
            onChange={(e) => setTxSubClass(e.target.value)}
            className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
          >
            <option value="">-- Choose Subtype --</option>
            {subClassOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Flow */}
        <div className="col-span-12 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
            Flow
          </label>
          <select
            value={txFlow}
            onChange={(e) => setTxFlow(e.target.value)}
            className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
          >
            <option value="">-- Choose Flow --</option>
            <option value="inflow">Inflow</option>
            <option value="outflow">Outflow</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>

        {/* Status */}
        <div className="col-span-12 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
            Status
          </label>
          <select
            value={txStatus}
            onChange={(e) => setTxStatus(e.target.value)}
            className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
          >
            <option value="">-- Choose Status --</option>
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: origin/from / Category / Entity / Amount */}
      <div className="grid grid-cols-12 gap-3">
        {/* Origin/From */}
        <div className="col-span-12 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
            {typeof t === 'function' ? t('origin_from', 'Origin/From') : t.origin_from}
          </label>
          <select
            value={txFrom}
            onChange={(e) => setTxFrom(e.target.value)}
            className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
          >
            <option value="">-- Choose Origin/From --</option>
            {fromOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className="col-span-12 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
            Category
          </label>
          <select
            value={txCategory}
            onChange={(e) => setTxCategory(e.target.value)}
            className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
          >
            <option value="">-- Choose Category --</option>
            {filteredCategories.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Entity */}
        <div className="col-span-12 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
            Entity
          </label>
          <select
            value={txEntity}
            onChange={(e) => handleEntityChange(e.target.value)}
            className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 font-sans"
          >
            <option value="">-- Choose Entity --</option>
            {Object.entries(
              filteredEntities.reduce((acc, opt) => {
                const cat = entityMappings[opt] || 'Uncategorized';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(opt);
                return acc;
              }, {})
            ).map(([cat, opts]) => (
              <optgroup key={cat} label={cat} className="font-bold text-[#8b4513]">
                {opts.map((opt) => (
                  <option key={opt} value={opt} className="font-normal text-[#4b2c20]">{opt}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div className="col-span-12 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
            {typeof t === 'function' ? t('amount_gold', 'Amount (Gold)') : t.amount_gold}
          </label>
          <input
            type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder={typeof t === 'function' ? t('placeholder.amount', 'Amount') : t['placeholder.amount']} required min="0.01" step="0.01"
            className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50 font-mono"
          />
        </div>
      </div>

      {/* Row 3: Value Date / Due Date / Posting Date */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
            Value Date
          </label>
          <input
            type="date"
            value={txValueDate}
            onChange={(e) => setTxValueDate(e.target.value)}
            required
            className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 font-mono"
          />
        </div>
        <div className="col-span-12 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
            Due Date
          </label>
          <input
            type="date"
            value={txDueDate}
            onChange={(e) => setTxDueDate(e.target.value)}
            className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 font-mono"
          />
        </div>
        <div className="col-span-12 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
            Posting Date
          </label>
          <input
            type="date"
            value={txPostingDate}
            onChange={(e) => setTxPostingDate(e.target.value)}
            required
            className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 font-mono"
          />
        </div>
      </div>

      {/* Row 4: Description */}
      <div>
        <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
          {typeof t === 'function' ? t('description', 'Description') : t.description}
        </label>
        <input
          type="text"
          value={txDescription}
          onChange={(e) => setTxDescription(e.target.value)}
          placeholder={typeof t === 'function' ? t('placeholder.notes', 'Notes') : t['placeholder.notes']}
          className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
        />
      </div>

      {/* Row 5: Source Account */}
      <div>
        <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
          Source Account
        </label>
        <select
          value={txSourceDestBank}
          onChange={(e) => setTxSourceDestBank(e.target.value)}
          className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 font-sans"
        >
          <option value="">-- Choose Source Account --</option>
          {Object.entries(accountMappings)
            .map(([code, name]) => (
              <option key={code} value={code}>{code} - {name}</option>
            ))
          }
        </select>
      </div>

      {/* Row 6: Target Account */}
      <div>
        <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
          Target Account
        </label>
        <select
          value={txTargetAccount}
          onChange={(e) => setTxTargetAccount(e.target.value)}
          className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 font-sans"
        >
          <option value="">-- Choose Target Account --</option>
          {Object.entries(accountMappings).map(([code, name]) => (
            <option key={code} value={code}>{code} - {name}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default RegisterTransactionForm;
