import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import { STANDARD_MODAL_PROPS } from '../constants/UI_UX';
import { parseCSV } from '../utils/csvHelpers';

export default function COAEditor({
  t,
  accountMappings,
  syncSettings
}) {
  const fileInputRef = useRef(null);
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [editingCode, setEditingCode] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  // Sort States
  const [sortField, setSortField] = useState('code');
  const [sortDirection, setSortDirection] = useState('asc');

  // Convert mapping object to array of rows
  const allRows = Object.entries(accountMappings).map(([code, name]) => ({
    code,
    name
  }));

  // Filtering
  const filteredRows = allRows.filter(row => {
    const q = searchQuery.toLowerCase();
    return row.code.includes(q) || row.name.toLowerCase().includes(q);
  });

  // Sorting
  const sortedRows = [...filteredRows].sort((a, b) => {
    const valA = a[sortField] || '';
    const valB = b[sortField] || '';
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddAccount = (e) => {
    e.preventDefault();
    const cleanCode = newCode.trim();
    const cleanName = newName.trim();

    if (!/^\d{8}$/.test(cleanCode)) {
      toast.error('O código da conta deve conter exatamente 8 dígitos.');
      return;
    }

    if (!cleanName) {
      toast.error('Por favor, informe o nome da conta.');
      return;
    }

    if (accountMappings[cleanCode]) {
      toast.error('Este código de conta já existe.');
      return;
    }

    const updated = {
      ...accountMappings,
      [cleanCode]: cleanName
    };

    syncSettings({ accountMappings: updated });
    toast.success('Conta adicionada com sucesso!');
    setIsAddModalOpen(false);
    setNewCode('');
    setNewName('');
  };

  const handleStartEdit = (row) => {
    setEditingCode(row.code);
    setEditingName(row.name);
  };

  const handleSaveEdit = (code) => {
    const cleanName = editingName.trim();
    if (!cleanName) {
      toast.error('O nome da conta não pode ser vazio.');
      return;
    }

    const updated = {
      ...accountMappings,
      [code]: cleanName
    };

    syncSettings({ accountMappings: updated });
    toast.success('Conta atualizada com sucesso!');
    setEditingCode(null);
    setEditingName('');
  };

  const handleDeleteAccount = (code) => {
    if (!confirm('Deseja realmente remover esta conta do Plano de Contas?')) {
      return;
    }
    const updated = { ...accountMappings };
    delete updated[code];
    syncSettings({ accountMappings: updated });
    setSelectedCodes(prev => prev.filter(c => c !== code));
    toast.success('Conta removida com sucesso!');
  };

  const handleDeleteSelections = () => {
    if (!confirm(`Remover as ${selectedCodes.length} contas selecionadas?`)) {
      return;
    }
    const updated = { ...accountMappings };
    selectedCodes.forEach(code => {
      delete updated[code];
    });
    syncSettings({ accountMappings: updated });
    setSelectedCodes([]);
    toast.success('Contas selecionadas removidas com sucesso!');
  };

  // Export COA to CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['Code', 'Account Name'].join(','),
      ...sortedRows.map(row => {
        // Escape quotes
        const safeName = row.name.replace(/"/g, '""');
        return `"${row.code}","${safeName}"`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `chart_of_accounts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Plano de Contas exportado com sucesso!');
  };

  // Import COA from CSV
  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCSV(text);
        if (parsed.length < 2) {
          toast.error('Arquivo CSV vazio ou inválido.');
          return;
        }

        const headers = parsed[0].map(h => h.trim().toLowerCase());
        const codeIdx = headers.findIndex(h => h.includes('code') || h.includes('codigo') || h.includes('código'));
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('nome') || h.includes('account') || h.includes('conta'));

        if (codeIdx === -1 || nameIdx === -1) {
          toast.error('Cabeçalhos inválidos. Certifique-se de que o CSV possui as colunas "Code" e "Account Name".');
          return;
        }

        const updated = { ...accountMappings };
        let importedCount = 0;

        for (let i = 1; i < parsed.length; i++) {
          const row = parsed[i];
          if (row.length < 2) continue;

          const rawCode = row[codeIdx]?.trim();
          const rawName = row[nameIdx]?.trim();

          if (rawCode && /^\d{8}$/.test(rawCode) && rawName) {
            updated[rawCode] = rawName;
            importedCount++;
          }
        }

        if (importedCount === 0) {
          toast.error('Nenhuma conta válida de 8 dígitos encontrada no CSV.');
          return;
        }

        syncSettings({ accountMappings: updated });
        toast.success(`${importedCount} contas importadas/mescladas com sucesso!`);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao processar o arquivo CSV.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header bar */}
      <div className="border-b border-[#8b4513]/20 pb-2 mb-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h3 className="title-font text-sm font-black text-[#4b2c20] uppercase">Chart of Accounts</h3>
          <p className="text-[9px] text-[#5d4037]/75 font-bold uppercase tracking-wider font-sans">Official Ledger Accounts</p>
        </div>
        <div className="flex items-center gap-2.5">
          <input
            type="text"
            placeholder="Search code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-2 py-1 bg-white border border-[#8b4513]/30 rounded-lg text-[10px] font-bold text-[#4b2c20] placeholder-[#5d4037]/50 focus:outline-none focus:ring-1 focus:ring-[#8b4513] w-[150px]"
          />
          <div className="flex gap-1">
            {selectedCodes.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelections}
                className="px-2.5 h-[28px] bg-red-755 hover:bg-red-800 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-black text-[9px] uppercase tracking-wider gap-1"
              >
                🗑️ Delete ({selectedCodes.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-2.5 h-[28px] bg-[#8b4513] hover:bg-[#8b4513]/90 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-black text-[9px] uppercase tracking-wider gap-1"
            >
              ➕ New Account
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="px-2.5 h-[28px] bg-[#faf4e5]/90 border border-[#8b4513]/25 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              📥 Import
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportCSV}
              accept=".csv"
              className="hidden"
            />
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-2.5 h-[28px] bg-[#faf4e5]/90 border border-[#8b4513]/25 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              📤 Export
            </button>
          </div>
        </div>
      </div>

      {/* Main table container */}
      <div className="flex-1 overflow-y-auto border border-[#8b4513]/20 rounded-xl bg-[#faf4e5]/20 custom-scrollbar">
        <table className="w-full text-left border-collapse text-[10px] font-sans">
          <thead>
            <tr className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 text-[#4b2c20] font-black uppercase tracking-wider title-font select-none">
              <th className="py-2 px-2 w-8 text-center">
                <input
                  type="checkbox"
                  checked={selectedCodes.length === sortedRows.length && sortedRows.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCodes(sortedRows.map(r => r.code));
                    } else {
                      setSelectedCodes([]);
                    }
                  }}
                  className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
                />
              </th>
              <th className="py-2 px-2 cursor-pointer w-24 hover:bg-[#8b4513]/5" onClick={() => handleSort('code')}>
                Code {sortField === 'code' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th className="py-2 px-2 cursor-pointer hover:bg-[#8b4513]/5" onClick={() => handleSort('name')}>
                Account Name {sortField === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th className="py-2 px-2 w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
            {sortedRows.map((row) => {
              const isChecked = selectedCodes.includes(row.code);
              const isEditing = editingCode === row.code;

              return (
                <tr key={row.code} className={`hover:bg-[#8b4513]/5 transition-colors ${isChecked ? 'bg-[#8b4513]/10' : ''}`}>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCodes(prev => [...prev, row.code]);
                        } else {
                          setSelectedCodes(prev => prev.filter(c => c !== row.code));
                        }
                      }}
                      className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
                    />
                  </td>
                  <td className="py-2 px-2 font-mono text-[#8b4513] font-bold text-[10.5px]">
                    {row.code}
                  </td>
                  <td className="py-2 px-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="bg-white border border-[#8b4513]/30 rounded px-1.5 py-0.5 w-full text-[10px] font-bold text-[#4b2c20]"
                      />
                    ) : (
                      row.name
                    )}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex justify-center items-center gap-1.5">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(row.code)}
                            className="text-emerald-700 hover:text-emerald-900 font-black cursor-pointer hover:scale-110 active:scale-95 transition-all text-xs"
                            title="Save"
                          >
                            💾
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCode(null)}
                            className="text-stone-500 hover:text-stone-700 font-black cursor-pointer hover:scale-110 active:scale-95 transition-all text-xs"
                            title="Cancel"
                          >
                            ❌
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(row)}
                            className="text-amber-700 hover:text-amber-900 font-black cursor-pointer hover:scale-110 active:scale-95 transition-all text-xs"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(row.code)}
                            className="text-red-700 hover:text-red-900 font-black cursor-pointer hover:scale-110 active:scale-95 transition-all text-xs"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add New Account Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Create Account"
          widthClass={STANDARD_MODAL_PROPS.widthClass}
          heightClass={STANDARD_MODAL_PROPS.heightClass}
        >
          <form onSubmit={handleAddAccount} className="p-4 flex flex-col gap-4 text-xs font-bold text-[#4b2c20]">
            <div className="flex flex-col gap-1.5">
              <label>Account Code (Exactly 8 digits)</label>
              <input
                type="text"
                placeholder="e.g. 10102005"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="p-2 border border-[#8b4513]/30 rounded-lg text-xs"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label>Account Name</label>
              <input
                type="text"
                placeholder="e.g. 10102005 - Savings account - CGD Premium"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="p-2 border border-[#8b4513]/30 rounded-lg text-xs"
                required
              />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#8b4513] text-white hover:bg-[#8b4513]/90 rounded-lg"
              >
                Add Account
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
