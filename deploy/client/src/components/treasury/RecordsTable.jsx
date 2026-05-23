import React, { useEffect, useState } from 'react';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const RecordsTable = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('treasury_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(r => 
    r.from_source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.entity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const Th = ({ children, className = "" }) => (
    <th className={`px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#4b2c20]/70 border-b-2 border-[#4b2c20]/10 ${className}`}>
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown size={10} className="opacity-30" />
      </div>
    </th>
  );

  const Td = ({ children, className = "" }) => (
    <td className={`px-4 py-3 text-xs text-[#4b2c20] font-medium border-b border-[#4b2c20]/5 ${className}`}>
      {children}
    </td>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Filters/Search */}
      <div className="flex gap-4 mb-6 px-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b2c20]/40" size={16} />
          <input 
            type="text" 
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/5 border-2 border-[#4b2c20]/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-[#4b2c20]/20 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-black/5 border-2 border-[#4b2c20]/10 rounded-xl text-xs font-bold text-[#4b2c20] hover:bg-black/10 transition-all">
          <Filter size={14} />
          Filters
        </button>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto rounded-xl border-2 border-[#4b2c20]/10 bg-white/30 backdrop-blur-sm custom-scrollbar">
        <table className="w-full border-collapse min-w-[1200px]">
          <thead className="sticky top-0 bg-[#e8d5c0] z-20">
            <tr>
              <Th>From</Th>
              <Th>Month</Th>
              <Th>Entity</Th>
              <Th>Limit</Th>
              <Th>Expense</Th>
              <Th>Cash</Th>
              <Th>Interest</Th>
              <Th>Tax</Th>
              <Th>Paid With</Th>
              <Th>Type</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" className="py-20 text-center italic text-[#2d1e1e]/40">Gathering records from the archives...</td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="11" className="py-20 text-center italic text-[#2d1e1e]/40">No records found in the ledger.</td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-[#4b2c20]/5 transition-colors group">
                  <Td className="font-bold">{record.from_source}</Td>
                  <Td>{record.month}</Td>
                  <Td>{record.entity}</Td>
                  <Td className="font-mono">${record.limit_amount}</Td>
                  <Td className="font-mono text-red-700">-${record.expense_amount}</Td>
                  <Td className="font-mono text-emerald-700">${record.payment_receipt_cash}</Td>
                  <Td className="font-mono">${record.interests}</Td>
                  <Td className="font-mono text-red-600">${record.tax}</Td>
                  <Td>{record.paid_with}</Td>
                  <Td>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${record.transaction_type === 'Income' ? 'bg-emerald-500/20 text-emerald-800' : 'bg-red-500/20 text-red-800'}`}>
                      {record.transaction_type}
                    </span>
                  </Td>
                  <Td>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${record.status === 'Paid' ? 'bg-blue-500/20 text-blue-800' : 'bg-amber-500/20 text-amber-800'}`}>
                      {record.status}
                    </span>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Placeholder */}
      <div className="flex justify-between items-center mt-4 px-2">
        <span className="text-[10px] font-bold text-[#4b2c20]/40 uppercase tracking-widest">
          Showing {filteredRecords.length} entries
        </span>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-black/5 rounded-lg transition-all"><ChevronLeft size={16} /></button>
          <button className="p-2 hover:bg-black/5 rounded-lg transition-all"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
};

export default RecordsTable;
