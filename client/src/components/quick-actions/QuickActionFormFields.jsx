// =====================================================================
// 🛑 AI AGENT DIRECTIVE: DO NOT MODIFY THIS FILE
// This component's 7-row grid layout is fully modularized and strictly final.
// Antigravity: Treat this file as strictly READ-ONLY.
// @antigravity-ignore
// =====================================================================
import React from 'react';
import { useKingdomStore } from '../../store/useKingdomStore';

const QuickActionFormFields = ({
  qaName,
  setQaName,
  qaIcon,
  setQaIcon,
  qaType,
  setQaType,
  qaSubType,
  setQaSubType,
  qaFlow,
  setQaFlow,
  qaStatus,
  setQaStatus,
  qaFrom,
  setQaFrom,
  qaCategory,
  setQaCategory,
  qaEntity,
  setQaEntity,
  qaAmount,
  setQaAmount,
  qaValueDate,
  setQaValueDate,
  qaDueDate,
  setQaDueDate,
  qaPostingDate,
  setQaPostingDate,
  qaDescription,
  setQaDescription,
  qaSourceDestBank,
  setQaSourceDestBank,
  qaTargetAccount,
  setQaTargetAccount,
  classOptions = [],
  subTypeOptions = [],
  statusOptions = [],
  fromOptions = [],
  categoryOptions = [],
  entityOptions = [],
  entityMappings = {},
  accountMappings = {},
  isCompact = false
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
  if (qaSubType) {
    const allowedCategories = Array.from(new Set([
      ...(subtypeToCategoryMap[qaSubType] || []),
      ...(defaultSubtypeToCategoryMap[qaSubType] || [])
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
  if (qaCategory) {
    filteredEntities = entityOptions.filter(opt => 
      entityMappings[opt] === qaCategory ||
      coaMappings.some(m => m.category === qaCategory && m.entity === opt)
    );
  } else if (qaSubType) {
    const allowedCategories = subtypeToCategoryMap[qaSubType] || [];
    filteredEntities = entityOptions.filter(opt => 
      allowedCategories.includes(entityMappings[opt]) ||
      coaMappings.some(m => allowedCategories.includes(m.category) && m.entity === opt)
    );
  }

  const rowSpacing = isCompact ? "space-y-1.5" : "space-y-2";
  const gridGap = isCompact ? "gap-1.5" : "gap-2";
  const labelMargin = "mb-0.5";
  const inputHeight = isCompact ? "h-[26px]" : "h-[30px]";
  const fontSize = "text-[10px]";

  return (
    <div className={`${rowSpacing} text-[#4b2c20]`}>
      {/* Row 1: Name */}
      <div className={`grid grid-cols-12 ${gridGap} items-end`}>
        <div className="col-span-12">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Name</label>
          <input
            type="text"
            value={qaName}
            onChange={(e) => setQaName(e.target.value)}
            placeholder="e.g. Purchase Wood"
            required
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-2.5 ${fontSize} font-bold placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50`}
          />
        </div>
      </div>

      {/* Row 2: Type / Subtype / Flow / Status */}
      <div className={`grid grid-cols-12 ${gridGap} items-end`}>
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Type</label>
          <select
            value={qaType}
            onChange={(e) => setQaType(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-1.5 ${fontSize} font-bold focus:outline-none focus:border-[#8b4513]/50`}
          >
            <option value="">-- Choose Type --</option>
            {classOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Subtype</label>
          <select
            value={qaSubType}
            onChange={(e) => setQaSubType(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-1.5 ${fontSize} font-bold focus:outline-none focus:border-[#8b4513]/50`}
          >
            <option value="">-- Choose Subtype --</option>
            {subTypeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Flow</label>
          <select
            value={qaFlow}
            onChange={(e) => setQaFlow(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-1.5 ${fontSize} font-bold focus:outline-none`}
          >
            <option value="">-- Choose Flow --</option>
            <option value="inflow">Inflow</option>
            <option value="outflow">Outflow</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Status</label>
          <select
            value={qaStatus}
            onChange={(e) => setQaStatus(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-1.5 ${fontSize} font-bold focus:outline-none`}
          >
            <option value="">-- Choose Status --</option>
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Origin/From / Category / Entity / Amount */}
      <div className={`grid grid-cols-12 ${gridGap} items-end`}>
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Origin/From</label>
          <select
            value={qaFrom}
            onChange={(e) => setQaFrom(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-1.5 ${fontSize} font-bold focus:outline-none`}
          >
            <option value="">-- Choose Origin/From --</option>
            {fromOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Category</label>
          <select
            value={qaCategory}
            onChange={(e) => setQaCategory(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-1.5 ${fontSize} font-bold focus:outline-none focus:border-[#8b4513]/50`}
          >
            <option value="">-- Choose Category --</option>
            {filteredCategories.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Entity</label>
          <select
            value={qaEntity}
            onChange={(e) => setQaEntity(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-1.5 ${fontSize} font-bold focus:outline-none focus:border-[#8b4513]/50 font-sans`}
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
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Amount</label>
          <input
            type="number" value={qaAmount} onChange={(e) => setQaAmount(e.target.value)} placeholder="Amount" min="0.01" step="0.01"
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-2.5 ${fontSize} font-bold placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50 font-mono`}
          />
        </div>
      </div>

      {/* Row 4: Value date / Due date / Posting date */}
      <div className={`grid grid-cols-12 ${gridGap} items-end`}>
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Value Date</label>
          <input
            type="date"
            value={qaValueDate}
            onChange={(e) => setQaValueDate(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-2.5 ${fontSize} font-bold focus:outline-none focus:border-[#8b4513]/50 font-mono`}
          />
        </div>
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Due Date</label>
          <input
            type="date"
            value={qaDueDate}
            onChange={(e) => setQaDueDate(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-2.5 ${fontSize} font-bold focus:outline-none focus:border-[#8b4513]/50 font-mono`}
          />
        </div>
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Posting Date</label>
          <input
            type="date"
            value={qaPostingDate}
            onChange={(e) => setQaPostingDate(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-2.5 ${fontSize} font-bold focus:outline-none focus:border-[#8b4513]/50 font-mono`}
          />
        </div>
      </div>

      {/* Row 5: Description */}
      <div className={`grid grid-cols-12 ${gridGap} items-end`}>
        <div className="col-span-12 sm:col-span-6">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Description</label>
          <input
            type="text"
            value={qaDescription}
            onChange={(e) => setQaDescription(e.target.value)}
            placeholder="e.g. Custom action"
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-2.5 ${fontSize} font-bold placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50`}
          />
        </div>
      </div>

      {/* Row 6: Source Account */}
      <div className={`grid grid-cols-12 ${gridGap} items-end`}>
        <div className="col-span-12 sm:col-span-6">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Source Account</label>
          <select
            value={qaSourceDestBank}
            onChange={(e) => setQaSourceDestBank(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-1.5 ${fontSize} font-bold focus:outline-none focus:border-[#8b4513]/50 font-mono`}
          >
            <option value="">-- Choose Source Account --</option>
            {Object.entries(accountMappings)
              .map(([code, name]) => (
                <option key={code} value={code}>{code} - {name}</option>
              ))
            }
          </select>
        </div>
      </div>

      {/* Row 7: Target Account */}
      <div className={`grid grid-cols-12 ${gridGap} items-end`}>
        <div className="col-span-12 sm:col-span-6">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Target Account</label>
          <select
            value={qaTargetAccount}
            onChange={(e) => setQaTargetAccount(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-1.5 ${fontSize} font-bold focus:outline-none focus:border-[#8b4513]/50 font-mono`}
          >
            <option value="">-- Choose Target Account --</option>
            {Object.entries(accountMappings).map(([code, name]) => (
              <option key={code} value={code}>{code} - {name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default QuickActionFormFields;
