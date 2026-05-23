import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../../lib/supabaseClient';

const ImportView = ({ onComplete, userId }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid CSV file.');
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    if (!userId) {
      setError('User identity not found. Please log in.');
      return;
    }
    setLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Map CSV headers to database columns
          const mappedData = results.data.map(row => ({
            profile_id: userId,
            from_source: row.From || row.source || '',
            month: row.Month || '',
            entity: row.Entity || '',
            limit_amount: parseFloat(row.Limit) || 0,
            expense_amount: parseFloat(row.Expense) || 0,
            payment_receipt_cash: parseFloat(row.Cash) || parseFloat(row['Payment/Receipt Cash']) || 0,
            interests: parseFloat(row.Interest) || parseFloat(row.Interests) || 0,
            late_fee_interests: parseFloat(row['Late Fee']) || 0,
            penalties: parseFloat(row.Penalties) || 0,
            tax: parseFloat(row.Tax) || parseFloat(row.TAX) || 0,
            description: row.Description || '',
            paid_with: row['Paid With'] || row.PaidWith || 'Gold',
            transaction_type: (row.Type?.toLowerCase() === 'expense' || row.Type?.toLowerCase() === 'saída') ? 'Expense' : 'Income',
            status: row.Status || 'Paid',
            losses: parseFloat(row.Losses) || 0,
            quests: row.Quests || ''
          }));

          const { error: insertError } = await supabase
            .from('treasury_records')
            .insert(mappedData);

          if (insertError) throw insertError;

          setStats({ count: mappedData.length });
          setTimeout(() => onComplete(), 2000);
        } catch (err) {
          console.error('Import error:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      error: (err) => {
        setError('Error parsing CSV file: ' + err.message);
        setLoading(false);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-8">
      <div className="text-center space-y-2">
        <h3 className="title-font text-[#4b2c20] text-2xl font-black uppercase tracking-widest">Import Archives</h3>
        <p className="text-[#4b2c20]/60 text-sm italic">"Bring forth the historical ledgers, scribe."</p>
      </div>

      <div className="w-full max-w-md">
        {!stats ? (
          <div className="space-y-6">
            <label className="relative flex flex-col items-center justify-center w-full h-48 bg-black/5 border-4 border-dashed border-[#4b2c20]/10 rounded-3xl cursor-pointer hover:bg-black/10 hover:border-[#4b2c20]/20 transition-all group">
              <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} disabled={loading} />
              
              {file ? (
                <div className="flex flex-col items-center space-y-2">
                  <FileText size={48} className="text-[#4b2c20]/40 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-[#4b2c20] text-sm">{file.name}</span>
                  <span className="text-[10px] text-[#4b2c20]/40 uppercase font-black tracking-widest">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <Upload size={48} className="text-[#4b2c20]/20 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-[#4b2c20]/40 uppercase text-xs tracking-widest">Select CSV File</span>
                </div>
              )}
            </label>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="w-full py-4 bg-[#4b2c20] text-white rounded-2xl title-font font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Parsing Ledger...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Process Import
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border-2 border-emerald-500/20 rounded-3xl p-8 text-center space-y-4 animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white">
              <CheckCircle size={32} />
            </div>
            <h4 className="title-font text-emerald-900 text-xl font-black uppercase">Success!</h4>
            <p className="text-emerald-800 text-sm">
              <span className="font-black">{stats.count}</span> records have been successfully added to the Royal Archives.
            </p>
          </div>
        )}
      </div>

      <div className="bg-black/5 rounded-2xl p-4 text-[10px] text-[#1a1a1a]/70 font-medium w-full max-w-md">
        <p className="font-black uppercase tracking-widest mb-2 text-[#1a1a1a]/50">CSV Template Tip:</p>
        <p>Ensure your CSV has headers matching: <span className="font-bold">From, Month, Entity, Limit, Expense, Cash, Interest, Tax, Description, Type, Status</span></p>
      </div>
    </div>
  );
};

export default ImportView;
