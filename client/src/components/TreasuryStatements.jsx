import React from 'react';

export default function TreasuryStatements({ cashFlowStatement, balanceSheet, t, formatNumberCompact, show = 'all' }) {
  const {
    operating = [],
    investing = [],
    financing = [],
    netOperating = 0,
    netInvesting = 0,
    netFinancing = 0,
    netCashFlow = 0,
    formattedNet = '0 / g',
    formattedOperating = '0 / g',
    formattedInvesting = '0 / g',
    formattedFinancing = '0 / g'
  } = cashFlowStatement || {};

  const {
    assets = {},
    liabilities = {},
    equity = {}
  } = balanceSheet || {};

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. IMPERIAL BALANCE SHEET */}
      {(show === 'all' || show === 'balanceSheet') && (
        <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col space-y-4">
        <h4 className="title-font text-[12px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-2 flex justify-center items-center text-center">
          <span>⚖️ {t('imperial_balance_sheet', 'Imperial Balance Sheet')}</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assets Section */}
          <div className="space-y-3">
            <h5 className="title-font text-[10px] font-black text-[#8b4513]/90 uppercase tracking-widest border-b border-[#8b4513]/5 pb-1">
              {t('assets', 'Assets (Resources Owned)')}
            </h5>
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between items-center py-1 border-b border-[#8b4513]/5">
                <span className="font-bold text-[#5d4037]">🏰 {t('vault_cash', 'Vault Cash')}</span>
                <span className="font-mono font-bold text-emerald-700">{assets.formattedVaultCash || '0 / g'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#8b4513]/5">
                <span className="font-bold text-[#5d4037]">📜 {t('receivables', 'Outstanding Receivables')}</span>
                <span className="font-mono font-bold text-emerald-700">{assets.formattedReceivables || '0 / g'}</span>
              </div>
              <div className="flex justify-between items-center pt-2 font-bold text-[#4b2c20] border-t border-[#8b4513]/10">
                <span>{t('total_assets', 'Total Assets')}</span>
                <span className="font-mono text-emerald-700">{assets.formattedTotal || '0 / g'}</span>
              </div>
            </div>
          </div>

          {/* Liabilities Section */}
          <div className="space-y-3">
            <h5 className="title-font text-[10px] font-black text-[#8b4513]/90 uppercase tracking-widest border-b border-[#8b4513]/5 pb-1">
              {t('liabilities', 'Liabilities (Obligations Owed)')}
            </h5>
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between items-center py-1 border-b border-[#8b4513]/5">
                <span className="font-bold text-[#5d4037]">🏦 {t('outstanding_debt', 'Outstanding Debt')}</span>
                <span className="font-mono font-bold text-rose-700">{liabilities.formattedDebt || '0 / g'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#8b4513]/5">
                <span className="font-bold text-[#5d4037]">⏳ {t('outstanding_payables', 'Outstanding Payables')}</span>
                <span className="font-mono font-bold text-rose-700">{liabilities.formattedPayables || '0 / g'}</span>
              </div>
              <div className="flex justify-between items-center pt-2 font-bold text-[#4b2c20] border-t border-[#8b4513]/10">
                <span>{t('total_liabilities', 'Total Liabilities')}</span>
                <span className="font-mono text-rose-700">{liabilities.formattedTotal || '0 / g'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Equity Section Summary */}
        <div className="bg-[#f4e4bc]/50 border border-[#8b4513]/15 rounded-lg p-2.5 flex justify-between items-center font-serif text-[11px] font-black uppercase text-[#4b2c20] tracking-wide mt-2">
          <span>🛡️ {t('accumulated_wealth', 'Accumulated Wealth (Net Equity)')}</span>
          <span className={`font-mono text-xs ${equity.accumulatedWealth >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {equity.formattedTotal || '0 / g'}
          </span>
        </div>
      </div>
      )}

      {/* 2. TREASURY CASH FLOW STATEMENT */}
      {(show === 'all' || show === 'cashFlow') && (
        <div className="bg-[#faf4e5]/60 border border-[#8b4513]/25 rounded-xl p-4 shadow-sm flex flex-col space-y-4">
          <h4 className="title-font text-[12px] font-black text-[#4b2c20] uppercase tracking-wider border-b border-[#8b4513]/10 pb-2 flex justify-center items-center text-center">
            <span>💸 {t('treasury_cash_flow', 'Treasury Cash Flow Statement')}</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Operating Cash Flows */}
            <div className="bg-[#faf4e5]/40 border border-[#8b4513]/10 rounded-lg p-3 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <h5 className="title-font text-[9px] font-black text-[#8b4513]/95 uppercase tracking-wider border-b border-[#8b4513]/5 pb-1">
                  ⚙️ {t('operating_activities', 'Operating Activities')}
                </h5>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar-subtle pr-1 text-[9px]">
                  {operating.length > 0 ? (
                    operating.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-0.5 border-b border-[#8b4513]/5">
                        <span className="font-bold text-[#5d4037]">{item.name}</span>
                        <span className={`font-mono font-bold ${item.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{item.formatted}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-center text-[8px] text-[#5d4037]/50 italic font-serif">
                      {t('no_operating_flows', 'No operating cash flows.')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-[9.5px] font-bold text-[#4b2c20] pt-1.5 border-t border-[#8b4513]/10">
                <span>{t('net_operating', 'Net Operating')}</span>
                <span className={`font-mono ${netOperating >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formattedOperating}</span>
              </div>
            </div>

            {/* Investing Cash Flows */}
            <div className="bg-[#faf4e5]/40 border border-[#8b4513]/10 rounded-lg p-3 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <h5 className="title-font text-[9px] font-black text-[#8b4513]/95 uppercase tracking-wider border-b border-[#8b4513]/5 pb-1">
                  🛡️ {t('investing_activities', 'Investing Activities')}
                </h5>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar-subtle pr-1 text-[9px]">
                  {investing.length > 0 ? (
                    investing.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-0.5 border-b border-[#8b4513]/5">
                        <span className="font-bold text-[#5d4037]">{item.name}</span>
                        <span className={`font-mono font-bold ${item.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{item.formatted}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-center text-[8px] text-[#5d4037]/50 italic font-serif">
                      {t('no_investing_flows', 'No investing cash flows.')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-[9.5px] font-bold text-[#4b2c20] pt-1.5 border-t border-[#8b4513]/10">
                <span>{t('net_investing', 'Net Investing')}</span>
                <span className={`font-mono ${netInvesting >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formattedInvesting}</span>
              </div>
            </div>

            {/* Financing Cash Flows */}
            <div className="bg-[#faf4e5]/40 border border-[#8b4513]/10 rounded-lg p-3 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <h5 className="title-font text-[9px] font-black text-[#8b4513]/95 uppercase tracking-wider border-b border-[#8b4513]/5 pb-1">
                  🏦 {t('financing_activities', 'Financing Activities')}
                </h5>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar-subtle pr-1 text-[9px]">
                  {financing.length > 0 ? (
                    financing.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-0.5 border-b border-[#8b4513]/5">
                        <span className="font-bold text-[#5d4037]">{item.name}</span>
                        <span className={`font-mono font-bold ${item.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{item.formatted}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-center text-[8px] text-[#5d4037]/50 italic font-serif">
                      {t('no_financing_flows', 'No financing cash flows.')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-[9.5px] font-bold text-[#4b2c20] pt-1.5 border-t border-[#8b4513]/10">
                <span>{t('net_financing', 'Net Financing')}</span>
                <span className={`font-mono ${netFinancing >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formattedFinancing}</span>
              </div>
            </div>

          </div>

          {/* Net Cash Flow Footer */}
          <div className="bg-[#f4e4bc]/50 border border-[#8b4513]/15 rounded-lg p-2.5 flex justify-between items-center font-serif text-[11px] font-black uppercase text-[#4b2c20] tracking-wide mt-2">
            <span>💰 {t('net_cash_flow', 'Net Cash Flow (Periodic Change)')}</span>
            <span className={`font-mono text-xs ${netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formattedNet}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
