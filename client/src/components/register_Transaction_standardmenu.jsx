{/* STANDARD LAYOUT (6 ROWS) - REGISTER TRANSACTION FORM */}
<div className="bg-[#faf4e5]/80 border border-[#8b4513]/30 rounded-xl p-3.5 space-y-3 shadow-sm">
  
  {/* Row 1: Class (Type) / SubClass / Flow / Status */}
  <div className="grid grid-cols-12 gap-3">
    {/* Class (Type) */}
    <div className="col-span-12 sm:col-span-3">
      <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
        Class (Type)
      </label>
      <select
        value={txClass}
        onChange={(e) => setTxClass(e.target.value)}
        className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
      >
        {classOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>

    {/* Subclass */}
    <div className="col-span-12 sm:col-span-3">
      <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
        Subclass
      </label>
      <select
        value={txSubClass}
        onChange={(e) => setTxSubClass(e.target.value)}
        className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
      >
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
        {t.origin_from}
      </label>
      <select
        value={txFrom}
        onChange={(e) => setTxFrom(e.target.value)}
        className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
      >
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
        {categoryOptions.map((opt) => (
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

    {/* Amount */}
    <div className="col-span-12 sm:col-span-3">
      <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
        {t.amount_gold}
      </label>
      <input
        type="number"
        value={txAmount}
        onChange={(e) => setTxAmount(e.target.value)}
        placeholder={t('placeholder.amount')}
        required
        min="1"
        className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50 font-mono"
      />
    </div>
  </div>

  {/* Row 3: Value Date / Posting Date */}
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
        className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
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
        className="w-full bg-[#faf4e5]/90 border border-[#8b4513]/25 rounded-lg h-[34px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
      />
    </div>
  </div>

  {/* Row 4: Description */}
  <div>
    <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1 font-sans">
      {t.description}
    </label>
    <input
      type="text"
      value={txDescription}
      onChange={(e) => setTxDescription(e.target.value)}
      placeholder={t('placeholder.notes')}
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
      {Object.entries(accountMappings)
        .filter(([code]) => code.startsWith('1') || code.startsWith('2'))
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
      {Object.entries(accountMappings).map(([code, name]) => (
        <option key={code} value={code}>{code} - {name}</option>
      ))}
    </select>
  </div>
</div>
