import React from 'react';

const QuickActionFormFields = ({
  qaName,
  setQaName,
  qaIcon,
  setQaIcon,
  qaClass,
  setQaClass,
  qaSubClass,
  setQaSubClass,
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
  subClassOptions = [],
  statusOptions = [],
  fromOptions = [],
  categoryOptions = [],
  entityOptions = [],
  entityMappings = {},
  accountMappings = {},
  isCompact = false
}) => {
  const rowSpacing = isCompact ? "space-y-1.5" : "space-y-2";
  const gridGap = isCompact ? "gap-1.5" : "gap-2";
  const labelMargin = "mb-0.5";
  const inputHeight = isCompact ? "h-[26px]" : "h-[30px]";
  const fontSize = "text-[10px]";

  return (
    <div className={`${rowSpacing} text-[#4b2c20]`}>
      {/* Row 1: Name (4), Icon (2), Type (3), Subtype (3) */}
      <div className={`grid grid-cols-12 ${gridGap} items-end`}>
        <div className="col-span-12 sm:col-span-4">
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
        <div className="col-span-12 sm:col-span-2">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Icon</label>
          <input
            type="text"
            value={qaIcon}
            onChange={(e) => setQaIcon(e.target.value)}
            placeholder="e.g. 🪵"
            required
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-2.5 ${fontSize} font-bold placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50`}
          />
        </div>
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Type</label>
          <select
            value={qaClass}
            onChange={(e) => setQaClass(e.target.value)}
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
            value={qaSubClass}
            onChange={(e) => setQaSubClass(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-1.5 ${fontSize} font-bold focus:outline-none focus:border-[#8b4513]/50`}
          >
            <option value="">-- Choose Subtype --</option>
            {subClassOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Flow (3), Status (3), Origin/From (3), Category (3) */}
      <div className={`grid grid-cols-12 ${gridGap} items-end`}>
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
            {categoryOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Entity (3), Amount (3), Value Date (3), Due Date (3) */}
      <div className={`grid grid-cols-12 ${gridGap} items-end`}>
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Entity</label>
          <select
            value={qaEntity}
            onChange={(e) => setQaEntity(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-1.5 ${fontSize} font-bold focus:outline-none focus:border-[#8b4513]/50 font-sans`}
          >
            <option value="">-- Choose Entity --</option>
            {Object.entries(
              entityOptions.reduce((acc, opt) => {
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
            type="number"
            value={qaAmount}
            onChange={(e) => setQaAmount(e.target.value)}
            placeholder="Amount"
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-2.5 ${fontSize} font-bold placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50 font-mono`}
          />
        </div>
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
      </div>

      {/* Row 4: Posting Date (3), Description (3), Source Account (3), Target Account (3) */}
      <div className={`grid grid-cols-12 ${gridGap} items-end`}>
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Posting Date</label>
          <input
            type="date"
            value={qaPostingDate}
            onChange={(e) => setQaPostingDate(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-2.5 ${fontSize} font-bold focus:outline-none focus:border-[#8b4513]/50 font-mono`}
          />
        </div>
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Description</label>
          <input
            type="text"
            value={qaDescription}
            onChange={(e) => setQaDescription(e.target.value)}
            placeholder="e.g. Custom action"
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-2.5 ${fontSize} font-bold placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50`}
          />
        </div>
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Source Account</label>
          <select
            value={qaSourceDestBank}
            onChange={(e) => setQaSourceDestBank(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-1.5 ${fontSize} font-bold focus:outline-none focus:border-[#8b4513]/50 font-mono`}
          >
            <option value="">-- Choose Source --</option>
            {Object.entries(accountMappings)
              .filter(([code]) => code.startsWith('1') || code.startsWith('2'))
              .map(([code, name]) => (
                <option key={code} value={code}>{code} - {name}</option>
              ))
            }
          </select>
        </div>
        <div className="col-span-12 sm:col-span-3">
          <label className={`block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 ${labelMargin} font-sans`}>Target Account</label>
          <select
            value={qaTargetAccount}
            onChange={(e) => setQaTargetAccount(e.target.value)}
            className={`w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg ${inputHeight} px-1.5 ${fontSize} font-bold focus:outline-none focus:border-[#8b4513]/50 font-mono`}
          >
            <option value="">-- Choose Target --</option>
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
