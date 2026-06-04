import React, { useState, useEffect } from 'react';
import HUD from './components/HUD';
import BottomNav from './components/BottomNav';
import IsometricMap from './components/IsometricMap';
import Modal from './components/Modal';
import bgMap from './assets/Medieval_Town_Backround.png';
import { useKingdomStore } from './store/useKingdomStore';
import { Toaster, toast } from 'react-hot-toast';

const GUEST_PROFILE_ID = '00000000-0000-0000-0000-000000000000';

function App() {
  const [activeTab] = useState('quests');
  const [isMineModalOpen, setIsMineModalOpen] = useState(false);

  // Form states
  const [txType, setTxType] = useState('income');
  const [txCategory, setTxCategory] = useState('Gold Mine');
  const [txAmount, setTxAmount] = useState('');
  const [txFrom, setTxFrom] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txStatus, setTxStatus] = useState('Completed');
  const [txSubcategory, setTxSubcategory] = useState('');
  const [txEntity, setTxEntity] = useState('');
  const [txEntityCategory, setTxEntityCategory] = useState('');
  const [txDescription, setTxDescription] = useState('');

  // Bind Zustand states
  const email = useKingdomStore((state) => state.email);
  const gold = useKingdomStore((state) => state.gold);
  const level = useKingdomStore((state) => state.level);
  const xp = useKingdomStore((state) => state.xp);
  const gems = useKingdomStore((state) => state.gems);
  const transactions = useKingdomStore((state) => state.transactions);
  const isLoading = useKingdomStore((state) => state.isLoading);
  
  // Actions
  const fetchKingdomData = useKingdomStore((state) => state.fetchKingdomData);
  const registerTransaction = useKingdomStore((state) => state.registerTransaction);

  const profile = { email, gold, level, xp };

  // Fetch initial profile state on mount
  useEffect(() => {
    fetchKingdomData(GUEST_PROFILE_ID);
  }, [fetchKingdomData]);

  const handleMineClick = () => {
    setIsMineModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!txAmount || isNaN(txAmount) || Number(txAmount) <= 0) {
      toast.error('Please enter a valid amount of Gold Coins!');
      return;
    }
    if (!txFrom.trim()) {
      toast.error('Please specify the "From" (origin/payer) field!');
      return;
    }

    const amountNum = Number(txAmount);
    const res = await registerTransaction(GUEST_PROFILE_ID, {
      type: txType,
      amount: amountNum,
      from: txFrom,
      date: txDate,
      status: txStatus,
      category: txCategory,
      subcategory: txSubcategory,
      entity: txEntity,
      entityCategory: txEntityCategory,
      description: txDescription || `${txCategory} log`
    });

    if (res.success) {
      toast.success(
        txType === 'income'
          ? `Added ${amountNum} Gold! Level and XP updated.`
          : `Spent ${amountNum} Gold!`
      );
      setTxAmount('');
      setTxDescription('');
      setTxFrom('');
      setTxSubcategory('');
      setTxEntity('');
      setTxEntityCategory('');
      setTxDate(new Date().toISOString().split('T')[0]);
      setTxStatus('Completed');
    } else {
      toast.error(`Transaction failed: ${res.error}`);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#f4e4bc',
            color: '#4b2c20',
            borderColor: '#8b4513',
            borderWidth: '2px'
          },
          success: {
            iconTheme: { primary: '#059669', secondary: '#f4e4bc' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#f4e4bc' },
          },
        }}
      />
      <div className="game-viewport">
        {/* HUD Superior */}
        <HUD profile={profile} diamonds={gems} />

        {/* Mapa Isométrico */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Background Map */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgMap})` }}
          />
          
          <IsometricMap onMineClick={handleMineClick} />
        </div>

        {/* Navegação Inferior (Estática) */}
        <BottomNav activeTab={activeTab} onTabChange={() => {}} />

        {/* Modal da Mina de Ouro (Ledger de Transações - Widescreen Layout) */}
        <Modal
          isOpen={isMineModalOpen}
          onClose={() => setIsMineModalOpen(false)}
          title="Livro de Transações"
          size="max-w-6xl"
        >
          <div className="space-y-6">
            {/* Form Title & Icon */}
            <div className="flex items-center gap-4 border-b border-[#8b4513]/20 pb-4">
              <div className="w-12 h-12 bg-[#8b4513]/10 rounded-full flex items-center justify-center border-2 border-[#8b4513]/20 text-2xl">
                📜
              </div>
              <div>
                <h3 className="title-font text-lg font-black text-[#4b2c20] uppercase">Registar Movimento</h3>
                <p className="text-[10px] text-[#5d4037]/75 font-bold uppercase tracking-wider">Mina de Ouro & Comércio</p>
              </div>
            </div>

            {/* Form in columns */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Tipo
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 h-[38px]">
                    <button
                      type="button"
                      onClick={() => setTxType('income')}
                      className={`rounded-lg border font-black text-[10px] uppercase tracking-wider transition-all ${
                        txType === 'income'
                          ? 'bg-emerald-800/20 border-emerald-600 text-emerald-800 shadow-sm'
                          : 'bg-stone-100/50 border-stone-300 text-stone-600 hover:bg-stone-200/50'
                      }`}
                    >
                      🟢 Receita
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxType('expense')}
                      className={`rounded-lg border font-black text-[10px] uppercase tracking-wider transition-all ${
                        txType === 'expense'
                          ? 'bg-rose-800/20 border-rose-600 text-rose-800 shadow-sm'
                          : 'bg-stone-100/50 border-stone-300 text-stone-600 hover:bg-stone-200/50'
                      }`}
                    >
                      🔴 Despesa
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Ouro (Coins)
                  </label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="Ex: 500"
                    required
                    min="1"
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>

                {/* From */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    From (Origem)
                  </label>
                  <input
                    type="text"
                    value={txFrom}
                    onChange={(e) => setTxFrom(e.target.value)}
                    placeholder="Ex: Gold Mine, Guild"
                    required
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    required
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Status
                  </label>
                  <select
                    value={txStatus}
                    onChange={(e) => setTxStatus(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Categoria
                  </label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
                  >
                    <option value="Gold Mine">Gold Mine</option>
                    <option value="Central Market">Central Market</option>
                    <option value="The Tavern">The Tavern</option>
                    <option value="Royal Treasury">Royal Treasury</option>
                    <option value="Tributes">Tributes</option>
                  </select>
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Subcategoria
                  </label>
                  <input
                    type="text"
                    value={txSubcategory}
                    onChange={(e) => setTxSubcategory(e.target.value)}
                    placeholder="Ex: Ore Sale, Wages"
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>

                {/* Entity */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Entity (Entidade)
                  </label>
                  <input
                    type="text"
                    value={txEntity}
                    onChange={(e) => setTxEntity(e.target.value)}
                    placeholder="Ex: Blacksmith Guild"
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Entity Category */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Entity Category
                  </label>
                  <input
                    type="text"
                    value={txEntityCategory}
                    onChange={(e) => setTxEntityCategory(e.target.value)}
                    placeholder="Ex: Guild, Merchant"
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>

                {/* Description / Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
                    Descrição (Notes)
                  </label>
                  <input
                    type="text"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    placeholder="Ex: Venda de excedente de minério"
                    className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] placeholder-[#5d4037]/45 focus:outline-none focus:border-[#8b4513]/50"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#8b4513] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.01] active:scale-99 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md border-2 border-[#d4af37]/30"
              >
                {isLoading ? 'Registando Movimento...' : 'Registar no Livro'}
              </button>
            </form>

            {/* Transactions History Table Section */}
            <div className="border-t border-[#8b4513]/20 pt-4 space-y-3">
              <h4 className="title-font text-sm font-black text-[#4b2c20] uppercase flex justify-between items-center">
                <span>Histórico de Transações</span>
                <span className="text-[9px] font-sans font-bold text-[#5d4037]/60 tracking-normal normal-case">
                  Livro de Contas Consolidado
                </span>
              </h4>

              {/* Responsive Table with horizontal scroll */}
              <div className="max-h-64 overflow-y-auto overflow-x-auto border border-[#8b4513]/25 rounded-xl bg-[#faf4e5]/40 custom-scrollbar">
                {transactions && transactions.length > 0 ? (
                  <table className="w-full text-left border-collapse text-[10px] font-sans">
                    <thead>
                      <tr className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 text-[#4b2c20] font-black uppercase tracking-wider title-font">
                        <th className="py-2.5 px-3 whitespace-nowrap">From</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Month</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Year</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Quarter</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Type</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Category</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Subcategory</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Entity</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Entity Category</th>
                        <th className="py-2.5 px-3 whitespace-nowrap text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#8b4513]/5 transition-colors">
                          <td className="py-2 px-3 whitespace-nowrap font-bold text-[#4b2c20]">{tx.from || '-'}</td>
                          <td className="py-2 px-3 whitespace-nowrap font-mono">{tx.date || '-'}</td>
                          <td className="py-2 px-3 whitespace-nowrap font-serif italic text-stone-600">{tx.month || '-'}</td>
                          <td className="py-2 px-3 whitespace-nowrap font-mono">{tx.year || '-'}</td>
                          <td className="py-2 px-3 whitespace-nowrap font-mono">{tx.quarter || '-'}</td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              tx.type === 'income' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' 
                                : 'bg-rose-100 text-rose-800 border border-rose-250'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                              tx.status === 'Completed' 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {tx.status || 'Completed'}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.category}</td>
                          <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.subcategory || '-'}</td>
                          <td className="py-2 px-3 whitespace-nowrap text-stone-600">{tx.entity || '-'}</td>
                          <td className="py-2 px-3 whitespace-nowrap text-stone-500 font-medium">{tx.entity_category || '-'}</td>
                          <td className={`py-2 px-3 whitespace-nowrap text-right font-mono font-black ${
                            tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toLocaleString()} 💰
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center py-8 text-xs text-[#5d4037]/60 italic font-serif">
                    Nenhum registo no livro de transações.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default App;
