import React, { useMemo, useState } from 'react';
import { X, TrendingUp, TrendingDown, Lightbulb, Calendar } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalyticsOverlay = ({ isOpen, onClose, title, data, type = 'income' }) => {
  const [timeframe, setTimeframe] = useState('Month');

  const chartData = useMemo(() => {
    let labels = [];
    let values = [];

    const getMetricValue = (r) => {
      if (type === 'income') {
        return (Number(r.payment_receipt_cash) || 0);
      } else {
        const inc = ['Income Cash', 'Income Credit', 'Earning'].includes(r.transaction_type) ? (Number(r.payment_receipt_cash) || 0) : 0;
        const out = ['Payment Cash', 'Payment Credit', 'Expense'].includes(r.transaction_type) ? (Number(r.expense_amount) || 0) : 0;
        return inc - out;
      }
    };

    if (timeframe === 'Year') {
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      values = labels.map(m => 
        data.filter(r => r.month?.startsWith(m)).reduce((sum, r) => sum + getMetricValue(r), 0)
      );
    } else if (timeframe === 'Quarter') {
      labels = ['Q1', 'Q2', 'Q3', 'Q4'];
      const quarters = [
        ['January', 'February', 'March'],
        ['April', 'May', 'June'],
        ['July', 'August', 'September'],
        ['October', 'November', 'December']
      ];
      values = quarters.map(qMonths => 
        data.filter(r => qMonths.includes(r.month)).reduce((sum, r) => sum + getMetricValue(r), 0)
      );
    } else if (timeframe === 'Month') {
      // Show 30 days
      labels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      values = labels.map(day => {
        return data.filter(r => {
          const rDate = new Date(r.created_at);
          return r.month === currentMonth && rDate.getDate() === parseInt(day);
        }).reduce((sum, r) => sum + getMetricValue(r), 0);
      });
    } else {
      // Week - show last 7 days
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      // Simplified: just show last 7 entries or group by day of week
      values = labels.map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return data.filter(r => {
          const rDate = new Date(r.created_at);
          return rDate.toDateString() === d.toDateString();
        }).reduce((sum, r) => sum + getMetricValue(r), 0);
      });
    }

    return {
      labels,
      datasets: [
        {
          label: title,
          data: values,
          borderColor: '#2d1e1e', // Coal color
          borderWidth: 3,
          tension: 0.4, 
          pointRadius: timeframe === 'Month' ? 2 : 4,
          pointBackgroundColor: '#2d1e1e',
          fill: true,
          backgroundColor: 'rgba(45, 30, 30, 0.05)',
        },
      ],
    };
  }, [data, title, type, timeframe]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#4b2c20',
        titleFont: { family: 'MedievalSharp, serif' },
        bodyFont: { weight: 'bold' },
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(75, 44, 32, 0.1)', drawBorder: false },
        ticks: { color: '#4b2c20', font: { weight: 'bold', size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#4b2c20', font: { weight: 'bold', size: 10 } }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-[#2d1e1e]/40">
      <div 
        className="relative w-full max-w-4xl bg-[#f4e4bc] border-[12px] border-[#8b4513] shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm p-8 animate-in fade-in zoom-in duration-300 overflow-hidden"
        style={{
          backgroundImage: `url('https://www.transparenttextures.com/patterns/paper-fibers.png')`,
          boxShadow: 'inset 0 0 100px rgba(139, 69, 19, 0.2), 0 0 50px rgba(0,0,0,0.5)'
        }}
      >
        {/* Decorative Corner Seals */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#8b4513] m-2 opacity-40" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#8b4513] m-2 opacity-40" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#8b4513] m-2 opacity-40" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#8b4513] m-2 opacity-40" />

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-4 text-[#4b2c20] hover:bg-[#4b2c20]/10 rounded-full transition-all group z-50"
          aria-label="Close"
        >
          <X size={32} className="group-hover:scale-110 transition-transform" />
        </button>

        <div className="space-y-8 relative z-10">
          <div className="text-center space-y-2">
            <h2 className="title-font text-4xl font-black text-[#4b2c20] uppercase tracking-widest">{title}</h2>
            <div className="w-48 h-1 bg-[#4b2c20]/20 mx-auto rounded-full" />
            <p className="text-sm italic text-[#4b2c20]/60">"The scribes have traced the flow of gold through the seasons."</p>
          </div>

          <div className="flex justify-center gap-3">
            {['Week', 'Month', 'Quarter', 'Year'].map(t => (
              <button 
                key={t}
                onClick={() => setTimeframe(t)}
                className={`min-w-[100px] px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md ${timeframe === t ? 'bg-[#4b2c20] text-[#f4e4bc] scale-105' : 'bg-[#4b2c20]/10 text-[#4b2c20] hover:bg-[#4b2c20]/20'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Chart Area */}
          <div className="h-64 bg-white/20 rounded-xl p-4 border border-[#4b2c20]/10 relative">
            <Line data={chartData} options={options} />
            {/* Charcoal smudge effect overlays */}
            <div className="absolute inset-0 pointer-events-none opacity-5 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]" />
          </div>

          {/* Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#4b2c20]/5 rounded-2xl p-6 border border-[#4b2c20]/10">
              <div className="flex items-center gap-3 mb-4 text-[#4b2c20]">
                <TrendingUp size={20} />
                <h3 className="font-black uppercase tracking-widest text-sm">Strategic Insights</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-xs font-bold text-[#4b2c20]/80">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#4b2c20]" />
                  Income has increased by 14% since the last moon cycle.
                </li>
                <li className="flex items-start gap-2 text-xs font-bold text-[#4b2c20]/80">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#4b2c20]" />
                  Entities from the Western Marches are contributing 40% more.
                </li>
                <li className="flex items-start gap-2 text-xs font-bold text-[#4b2c20]/80">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#4b2c20]" />
                  Recommend aggressive tax collection in the upcoming quarter.
                </li>
              </ul>
            </div>

            <div className="bg-[#4b2c20]/5 rounded-2xl p-6 border border-[#4b2c20]/10">
              <div className="flex items-center gap-3 mb-4 text-[#4b2c20]">
                <Lightbulb size={20} />
                <h3 className="font-black uppercase tracking-widest text-sm">Royal Counsel</h3>
              </div>
              <p className="text-xs italic text-[#4b2c20]/70 leading-relaxed">
                "The current balance suggests a surplus. It might be wise to invest in royal fortifications or perhaps another expedition to the Dragon's lair. Be wary of rising maintenance costs for the standing army."
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-black opacity-40">Risk Level</p>
                  <p className="text-sm font-black text-emerald-800">LOW</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-black opacity-40">Next Forecast</p>
                  <p className="text-sm font-black text-[#4b2c20]">12 DAYS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverlay;
