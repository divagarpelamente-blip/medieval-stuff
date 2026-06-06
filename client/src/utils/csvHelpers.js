import { toast } from 'react-hot-toast';

export const handleExportCSV = (transactions, t) => {
  const headers = [
    'amount',
    'from',
    'date',
    'payment_status',
    'transaction_type',
    'transaction_subtype',
    'entity',
    'transaction_category',
    'transaction_nature',
    'transaction_flow',
    'description'
  ];

  let csvContent = headers.join(',') + '\n';

  if (transactions && transactions.length > 0) {
    transactions.forEach((tx) => {
      const row = headers.map((header) => {
        let val = tx[header];
        if (val === null || val === undefined) {
          return '';
        }
        let stringVal = String(val);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          stringVal = '"' + stringVal.replace(/"/g, '""') + '"';
        }
        return stringVal;
      });
      csvContent += row.join(',') + '\n';
    });
  }

  // Add BOM for Excel UTF-8 compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tesouro_real_${new Date().toISOString().split('T')[0]}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  
  // Use a small timeout to ensure the click registers before cleanup
  setTimeout(() => {
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);

  toast.success(
    transactions && transactions.length > 0
      ? t('success_export')
      : t('success_export_empty')
  );
};

export const parseCSV = (text) => {
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push("");
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
};

export const handleImportCSV = (e, { t, fromOptions, registerTransactions, GUEST_PROFILE_ID }) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const text = event.target.result;
      const parsed = parseCSV(text);
      if (parsed.length === 0 || (parsed.length === 1 && parsed[0][0] === '')) {
        toast.success(t('success_import_zero'));
        return;
      }

      const headers = parsed[0].map(h => h.trim().toLowerCase());
      const rows = parsed.slice(1);

      if (rows.length === 0 || (rows.length === 1 && rows[0].length === 1 && rows[0][0] === '')) {
        toast.success(t('success_import_zero'));
        return;
      }

      const listToInsert = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 1 && row[0] === '') continue; // skip empty lines

        const tx = {};
        headers.forEach((header, idx) => {
          let val = row[idx] ? row[idx].trim() : '';
          // normalize header keys
          if (header === 'transaction_type' || header === 'entity class' || header === 'class' || header === 'classe') {
            tx.transaction_type = val;
          } else if (header === 'from (origem)' || header === 'from') {
            tx.from = val;
          } else if (header === 'transaction_subtype' || header === 'sub classe' || header === 'sub_class' || header === 'sub class') {
            tx.transaction_subtype = val;
          } else if (header === 'transaction_category' || header === 'category') {
            tx.transaction_category = val;
          } else if (header === 'payment_status' || header === 'status') {
            tx.payment_status = val;
          } else if (header === 'ouro' || header === 'coins' || header === 'amount') {
            tx.amount = Number(val);
          } else {
            tx[header] = val;
          }
        });

        // Validation
        if (!tx.transaction_type || !['Income', 'Expense', 'Savings', 'Debt'].includes(tx.transaction_type)) {
          tx.transaction_type = 'Expense'; // default fallback
        }
        if (!tx.amount || isNaN(tx.amount)) {
          tx.amount = 0; // default fallback
        }
        if (!tx.from) {
          tx.from = fromOptions[0] || 'Pedro';
        }

        // Derive nature and flow if they are missing
        const isReceipt = tx.transaction_subtype ? tx.transaction_subtype.toLowerCase().includes('receipt') : false;
        const isIncome = tx.transaction_type === 'Income';
        if (!tx.transaction_nature) {
          tx.transaction_nature = (tx.transaction_subtype && tx.transaction_subtype.toLowerCase().includes('cash')) ? 'cash' : 'accrual';
        }
        if (!tx.transaction_flow) {
          tx.transaction_flow = (isIncome || isReceipt) ? 'inflow' : 'outflow';
        }

        listToInsert.push(tx);
      }

      if (listToInsert.length === 0) {
        toast.success(t('success_import_zero'));
        return;
      }

      const res = await registerTransactions(GUEST_PROFILE_ID, listToInsert);
      if (res.success) {
        toast.success(t('success_import', { count: listToInsert.length }));
      } else {
        toast.error(t('err_import_db', { error: res.error }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t('err_import'));
    } finally {
      // Clear value to allow importing the same file again
      e.target.value = '';
    }
  };
  reader.readAsText(file);
};
