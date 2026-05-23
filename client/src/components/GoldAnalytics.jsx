import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TrendingUp, Coins, Calendar, ChevronDown } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const GoldAnalytics = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProduction: 0,
    goldPerWeek: 0,
    growthRate: 0
  });
  const [chartData, setChartData] = useState(null);
  const [timeframe, setTimeframe] = useState('Month'); // Week, Month, Quarter, Year
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    if (userId) fetchAnalytics();
  }, [userId, timeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('treasury_records')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // 1. Calculate Production (Total Earnings)
      const earnings = data.filter(r => r.transaction_type?.toLowerCase().includes('receipt') || r.transaction_type?.toLowerCase().includes('income'));
      const totalProduction = earnings.reduce((sum, r) => sum + (r.payment_receipt_cash || 0), 0);

      // 2. Calculate Gold Per Week (Balance / Weeks)
      const totalExpenses = data.filter(r => r.transaction_type?.toLowerCase().includes('payment') || r.transaction_type?.toLowerCase().includes('expense'))
                               .reduce((sum, r) => sum + (r.expense_amount || 0), 0);
      const balance = totalProduction - totalExpenses;
      
      let weeks = 1;
      if (data.length > 0) {
        const firstDate = new Date(data[0].created_at);
        const lastDate = new Date();
        const diffDays = Math.ceil(Math.abs(lastDate - firstDate) / (1000 * 60 * 60 * 24));
        weeks = Math.max(1, Math.ceil(diffDays / 7));
      }
      const goldPerWeek = balance / weeks;

      // 3. Growth Rate (Percentage increase in production compared to previous period)
      // For simplicity, comparing last 30 days vs previous 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentProd = earnings.filter(r => new Date(r.created_at) > thirtyDaysAgo)
                                 .reduce((sum, r) => sum + (r.payment_receipt_cash || 0), 0);
      const previousProd = earnings.filter(r => new Date(r.created_at) > sixtyDaysAgo && new Date(r.created_at) <= thirtyDaysAgo)
                                   .reduce((sum, r) => sum + (r.payment_receipt_cash || 0), 0);
      
      const growthRate = previousProd === 0 ? 100 : ((recentProd - previousProd) / previousProd) * 100;

      setStats({ totalProduction, goldPerWeek, growthRate });

      // 4. Process Chart Data
      processChartData(data);

    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (records) => {
    // Group by month for now (default)
    const grouped = {};
    records.forEach(r => {
      const d = new Date(r.created_at);
      let key;
      if (timeframe === 'Week') {
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
        key = `W${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`;
      } else if (timeframe === 'Month') {
        key = d.toLocaleString('default', { month: 'short' });
      } else if (timeframe === 'Quarter') {
        key = `Q${Math.floor(d.getMonth() / 3) + 1}`;
      } else {
        key = d.getFullYear().toString();
      }

      if (!grouped[key]) grouped[key] = { income: 0, expense: 0 };
      if (r.transaction_type?.toLowerCase().includes('receipt') || r.transaction_type?.toLowerCase().includes('income')) grouped[key].income += (r.payment_receipt_cash || 0);
      else grouped[key].expense += (r.expense_amount || 0);
    });

    const labels = Object.keys(grouped);
    const incomes = labels.map(l => grouped[l].income);
    const expenses = labels.map(l => grouped[l].expense);

    setChartData({
      labels,
      datasets: [
        {
          label: 'Gold Inflow',
          data: incomes,
          borderColor: '#8b4513',
          backgroundColor: 'rgba(139, 69, 19, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#8b4513'
        },
        {
          label: 'Gold Outflow',
          data: expenses,
          borderColor: '#b22222',
          backgroundColor: 'rgba(178, 34, 34, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.4,
          fill: false,
          pointRadius: 2,
          pointBackgroundColor: '#b22222'
        }
      ]
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          font: {
            family: 'Cinzel',
            weight: 'bold',
            size: 10
          },
          color: '#4b2c20'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#4b2c20',
        bodyColor: '#4b2c20',
        borderColor: '#4b2c20',
        borderWidth: 1,
        titleFont: { family: 'Cinzel', weight: 'bold' },
        bodyFont: { family: 'Inter' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(75, 44, 32, 0.1)' },
        ticks: { 
          color: '#4b2c20', 
          font: { family: 'Cinzel', size: 10 },
          callback: (val) => `${val}g`
        }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#4b2c20', font: { family: 'Cinzel', size: 10 } }
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <Coins size={40} className="text-[#8b4513] mb-4" />
      <p className="title-font text-[#8b4513] uppercase tracking-widest text-sm">Consulting the Scribes...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/5 border-2 border-[#4b2c20]/10 rounded-2xl p-4 flex items-center gap-4 group hover:bg-black/10 transition-all">
          <div className="w-12 h-12 bg-[#8b4513] text-white rounded-xl flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#4b2c20]/60">Total Production</p>
            <p className="text-xl font-black text-[#4b2c20] tracking-tighter">{Math.floor(stats.totalProduction)}g</p>
          </div>
        </div>

        <div className="bg-black/5 border-2 border-[#4b2c20]/10 rounded-2xl p-4 flex items-center gap-4 group hover:bg-black/10 transition-all">
          <div className="w-12 h-12 bg-amber-600 text-white rounded-xl flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform">
            <Coins size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#4b2c20]/60">Gold per Week</p>
            <p className="text-xl font-black text-[#4b2c20] tracking-tighter">{Math.floor(stats.goldPerWeek)}g</p>
          </div>
        </div>

        <div className="bg-black/5 border-2 border-[#4b2c20]/10 rounded-2xl p-4 flex items-center gap-4 group hover:bg-black/10 transition-all">
          <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#4b2c20]/60">Growth Rate</p>
            <p className="text-xl font-black text-[#4b2c20] tracking-tighter">{stats.growthRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-[#f2e2ce] border-2 border-[#4b2c20]/30 rounded-3xl p-6 relative shadow-inner overflow-hidden">
        {/* Subtle Paper Texture Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6 border-b border-[#4b2c20]/20 pb-4">
            <h3 className="title-font text-[#4b2c20] text-lg uppercase tracking-[0.2em] font-black">Financial Ledger</h3>
            
            <div className="flex gap-2">
              <div className="relative group">
                <button className="px-3 py-1 bg-black/5 border border-[#4b2c20]/30 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#4b2c20] flex items-center gap-2">
                  {timeframe} <ChevronDown size={12} />
                </button>
                <div className="absolute right-0 top-full mt-1 bg-[#e8d5c0] border-2 border-[#4b2c20]/30 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden w-24">
                  {['Week', 'Month', 'Quarter', 'Year'].map(tf => (
                    <button 
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className="w-full px-4 py-2 text-left text-[10px] font-black uppercase hover:bg-black/10 text-[#4b2c20]"
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setChartType(chartType === 'line' ? 'bar' : 'line')}
                className="px-3 py-1 bg-[#4b2c20] text-[#e8d5c0] rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md"
              >
                Switch to {chartType === 'line' ? 'Bar' : 'Line'}
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            {chartData && (
              chartType === 'line' ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <Bar data={chartData} options={chartOptions} />
              )
            )}
          </div>

          <div className="mt-4 text-center border-t border-[#4b2c20]/10 pt-4">
            <p className="text-[10px] italic text-[#4b2c20]/80 font-serif">"The ink remains while the gold may fade. Your kingdom's prosperity is carved in history."</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoldAnalytics;
