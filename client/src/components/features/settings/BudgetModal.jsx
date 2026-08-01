import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../../../lib/supabaseClient';
import { useKingdomStore } from '../../../store/useKingdomStore';
import { X, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';

export const BudgetModal = ({ isOpen, onClose, onSaved }) => {
  const user = useKingdomStore(s => s.user);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch existing budgets
        const { data: budgetData, error: budgetError } = await supabase
          .from('budgets')
          .select('*')
          .eq('profile_id', user.id);

        if (budgetError) throw budgetError;

        // Fetch distinct expense categories from dim_contas
        const { data: catData, error: catError } = await supabase
          .from('dim_contas')
          .select('category, subtype')
          .eq('type', 'Expenses');

        if (catError) throw catError;

        const grouped = {};
        catData.forEach(c => {
          if (!grouped[c.subtype]) grouped[c.subtype] = new Set();
          grouped[c.subtype].add(c.category);
        });

        const categorizedData = Object.keys(grouped).sort().map(subtype => ({
          subtype,
          categories: [...grouped[subtype]].sort()
        }));
        setCategories(categorizedData);

        const budgetMap = {};
        if (budgetData) {
          budgetData.forEach(b => {
            budgetMap[b.coa_category] = b.monthly_limit;
          });
        }
        setBudgets(budgetMap);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen, user?.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleBudgetChange = (category, value) => {
    setBudgets(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    setError(null);
    try {
      const upsertPayload = Object.entries(budgets)
        .filter(([_, limit]) => limit !== '' && limit !== null && Number(limit) >= 0)
        .map(([category, limit]) => ({
          profile_id: user.id,
          coa_category: category,
          monthly_limit: Number(limit)
        }));

      if (upsertPayload.length > 0) {
        const { error: upsertError } = await supabase
          .from('budgets')
          .upsert(upsertPayload, { onConflict: 'profile_id, coa_category' });

        if (upsertError) throw upsertError;
      }
      
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[85vh] bg-[#faf4e5] border-4 border-[#8b4513] rounded-2xl flex flex-col font-serif shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div>
            <h2 className="text-lg font-serif font-bold text-gray-900">Budget Decrees</h2>
            <p className="text-xs font-sans text-gray-500 mt-1">Set monthly target caps for your expenditures</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-amber-800/40">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map(group => (
                <div key={group.subtype}>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8b4513] border-b border-[#8b4513]/20 pb-1 mb-2">
                    {group.subtype}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {group.categories.map(cat => (
                      <div key={cat} className="p-2 rounded bg-stone-100/80 border border-[#8b4513]/20 flex flex-col gap-1 transition-colors hover:border-[#8b4513]/40">
                        <label className="text-[10px] font-bold text-stone-700 uppercase truncate" title={cat}>
                          {cat}
                        </label>
                        <div className="relative w-full shrink-0">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-[10px]">g</span>
                          <input 
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={budgets[cat] || ''}
                            onChange={(e) => handleBudgetChange(cat, e.target.value)}
                            className="w-full pl-6 pr-2 py-1 text-sm font-mono text-right text-stone-900 bg-white border border-[#8b4513]/40 rounded focus:ring-1 focus:ring-[#8b4513] focus:border-[#8b4513] outline-none transition-colors placeholder:text-stone-300"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-700 border border-transparent rounded-lg hover:bg-amber-800 focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Seal Decrees
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
