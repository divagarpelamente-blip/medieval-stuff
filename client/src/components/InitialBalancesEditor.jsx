import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useKingdomStore } from '../store/useKingdomStore';

export default function InitialBalancesEditor({ t, accountMappings }) {
  const accountBalances = useKingdomStore((state) => state.accountBalances) || [];
  const updateAccountBalance = useKingdomStore((state) => state.updateAccountBalance);
  const activeProfileId = useKingdomStore((state) => state.user?.id) || '00000000-0000-0000-0000-000000000000';

  const [searchTerm, setSearchTerm] = useState('');
  const [editingCode, setEditingCode] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'assets', 'liabilities', 'expenses', 'income'
  const [isSaving, setIsSaving] = useState(false);

  // Group accounts based on their code prefix
  const getAccountGroup = (code) => {
    if (code.startsWith('1')) return 'assets';
    if (code.startsWith('2')) return 'liabilities';
    if (code.startsWith('6')) return 'expenses';
    if (code.startsWith('7')) return 'income';
    return 'other';
  };

  const handleEditClick = (code, currentBalance) => {
    setEditingCode(code);
    setEditValue(String(currentBalance));
  };

  const handleCancelClick = () => {
    setEditingCode(null);
    setEditValue('');
  };

  const handleSaveClick = async (code) => {
    const val = Number(editValue);
    if (isNaN(val)) {
      toast.error(t('err_invalid_amount', 'Please enter a valid numeric balance amount.'));
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateAccountBalance(activeProfileId, code, val);
      if (res.success) {
        toast.success(t('balance_updated_success', 'Initial balance updated successfully!'));
        setEditingCode(null);
      } else {
        toast.error(t('balance_updated_error', 'Failed to update balance: ') + res.error);
      }
    } catch (err) {
      console.error(err);
      toast.error(t('balance_updated_error', 'Failed to update balance.'));
    } finally {
      setIsSaving(false);
    }
  };

  // Convert accountMappings object to array and filter
  const accountsList = Object.entries(accountMappings)
    .map(([code, fullName]) => {
      // Parse clean name (remove code prefix)
      let name = fullName;
      if (name.startsWith(code)) {
        name = name.substring(code.length).replace(/^\s*-\s*/, '');
      }

      // Find current starting balance in store
      const balRecord = accountBalances.find(b => b.account_code === code);
      const balance = balRecord ? Number(balRecord.balance) : 0;

      return {
        code,
        name,
        fullName,
        balance,
        group: getAccountGroup(code)
      };
    })
    .filter(acc => {
      // Filter by type
      if (filterType !== 'all' && acc.group !== filterType) return false;

      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return acc.code.includes(term) || acc.name.toLowerCase().includes(term);
      }

      return true;
    })
    .sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div className="flex flex-col h-full overflow-hidden font-sans">
      {/* Title */}
      <div className="border-b border-[#8b4513]/20 pb-2 mb-4 font-sans">
        <h3 className="title-font text-sm font-black text-[#4b2c20] uppercase">
          {t('initial_balances_editor', 'Account Initial Balances')}
        </h3>
        <p className="text-[9px] text-[#5d4037]/75 font-bold uppercase tracking-wider font-sans">
          {t('initial_balances_desc', 'Set the starting amounts for all accounts before transaction flows are calculated.')}
        </p>
      </div>

      {/* Controls: Search and Filter */}
      <div className="flex gap-2 mb-3 font-sans">
        <div className="flex-1">
          <input
            type="text"
            placeholder={t('search_accounts', 'Search by code or name...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2.5 text-[10px] font-bold text-[#4b2c20] placeholder-[#5d4037]/50 focus:outline-none focus:border-[#8b4513]/50 font-sans"
          />
        </div>
        <div className="w-[120px]">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 cursor-pointer font-sans"
          >
            <option value="all">All Groups</option>
            <option value="assets">Assets (1xxx)</option>
            <option value="liabilities">Liabilities (2xxx)</option>
            <option value="expenses">Expenses (6xxx)</option>
            <option value="income">Income (7xxx)</option>
          </select>
        </div>
      </div>

      {/* Table container */}
      <div className="flex-1 overflow-y-auto border border-[#8b4513]/20 rounded-xl bg-[#faf4e5]/20 custom-scrollbar font-sans">
        {accountsList.length > 0 ? (
          <table className="w-full text-left border-collapse text-[9.5px]">
            <thead className="sticky top-0 bg-[#faf4e5] z-10 border-b border-[#8b4513]/25 shadow-sm">
              <tr className="text-[#4b2c20] font-black uppercase tracking-wider title-font">
                <th className="py-2 px-3 w-[80px]">Code</th>
                <th className="py-2 px-2">Account Name</th>
                <th className="py-2 px-2 w-[110px] text-right">Initial Balance</th>
                <th className="py-2 px-3 w-[80px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8b4513]/10">
              {accountsList.map((acc) => {
                const isEditing = editingCode === acc.code;
                const isAssetOrIncome = acc.group === 'assets' || acc.group === 'income';
                
                // Color style based on positive/negative and type
                let colorClass = 'text-stone-500';
                if (Math.abs(acc.balance) >= 0.005) {
                  if (isAssetOrIncome) {
                    colorClass = acc.balance > 0 ? 'text-emerald-700' : 'text-rose-700';
                  } else {
                    colorClass = acc.balance > 0 ? 'text-rose-700' : 'text-emerald-700';
                  }
                }

                // Format number
                const formatNum = (val) => {
                  const num = Number(val) || 0;
                  if (num < 0) {
                    const formatted = Math.abs(num).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).replace(/,/g, ' ');
                    return `(${formatted})`;
                  }
                  return num.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).replace(/,/g, ' ');
                };

                return (
                  <tr key={acc.code} className="hover:bg-[#8b4513]/5 transition-colors duration-150 font-medium text-[#4b2c20]/90">
                    <td className="py-2 px-3 font-mono font-bold text-[#8b4513]/80">{acc.code}</td>
                    <td className="py-2 px-2 truncate max-w-[200px]" title={acc.name}>{acc.name}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full bg-white border border-[#8b4513]/40 rounded px-1.5 py-0.5 text-right font-mono text-[9px] font-bold text-[#4b2c20] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                          disabled={isSaving}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveClick(acc.code);
                            if (e.key === 'Escape') handleCancelClick();
                          }}
                        />
                      ) : (
                        <span className={colorClass}>{formatNum(acc.balance)}</span>
                      )}
                    </td>
                    <td className="py-1 px-3 text-center">
                      {isEditing ? (
                        <div className="flex gap-1 justify-center">
                          <button
                            type="button"
                            onClick={() => handleSaveClick(acc.code)}
                            className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition-colors cursor-pointer"
                            title="Save"
                            disabled={isSaving}
                          >
                            💾
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelClick}
                            className="p-1 hover:bg-rose-100 rounded text-rose-700 transition-colors cursor-pointer"
                            title="Cancel"
                            disabled={isSaving}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEditClick(acc.code, acc.balance)}
                          className="px-2 py-0.5 hover:bg-[#8b4513]/10 border border-[#8b4513]/20 rounded text-[#8b4513] font-bold transition-all text-[8px] uppercase tracking-wider cursor-pointer"
                          title="Edit Initial Balance"
                          disabled={editingCode !== null}
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center opacity-60">
            <div className="text-3xl font-sans">📭</div>
            <p className="text-xs font-serif italic mt-1">No accounts found matching filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
