import { toast } from 'react-hot-toast';

export const handleExportCSV = (transactions, t) => {
  const headers = [
    'amount',
    'from',
    'value_date',
    'posting_date',
    'due_date',
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
          } else if (header === 'value_date' || header === 'value date' || header === 'date' || header === 'data') {
            tx.value_date = val;
          } else if (header === 'posting_date' || header === 'posting date') {
            tx.posting_date = val;
          } else if (header === 'due_date' || header === 'due date') {
            tx.due_date = val || null;
          } else {
            tx[header] = val;
          }
        });

        // Validation
        if (!tx.transaction_type || !['Income', 'Expense', 'Assets', 'Liabilities'].includes(tx.transaction_type)) {
          tx.transaction_type = 'Expense'; // default fallback
        }
        if (!tx.amount || isNaN(tx.amount)) {
          tx.amount = 0; // default fallback
        }
        if (!tx.from) {
          tx.from = fromOptions[0] || 'Pedro';
        }

        // Populate missing dates with safe defaults
        const todayDate = new Date().toISOString().split('T')[0];
        if (!tx.posting_date) {
          tx.posting_date = tx.date || todayDate;
        }
        if (!tx.value_date) {
          tx.value_date = tx.date || tx.posting_date;
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

export const handleExportAllActionsCSV = (templates, t) => {
  const headers = [
    'name',
    'icon',
    'type',
    'subtype',
    'flow',
    'status',
    'from',
    'category',
    'entity',
    'amount',
    'value_date',
    'due_date',
    'posting_date',
    'description',
    'source_account',
    'target_account'
  ];

  let csvContent = headers.join(',') + '\n';

  if (templates && templates.length > 0) {
    templates.forEach((tpl) => {
      const data = tpl.data || {};
      const fields = {
        name: tpl.name,
        icon: tpl.icon,
        type: data.transaction_type,
        subtype: data.transaction_subtype,
        flow: data.flow,
        status: data.payment_status,
        from: data.from,
        category: data.transaction_category,
        entity: data.entity,
        amount: data.amount,
        value_date: data.value_date,
        due_date: data.due_date,
        posting_date: data.posting_date,
        description: data.description,
        source_account: data.source_dest_bank,
        target_account: data.target_account
      };

      const row = headers.map((header) => {
        let val = fields[header];
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

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `quick_actions_${new Date().toISOString().split('T')[0]}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);

  setTimeout(() => {
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);

  toast.success(
    templates && templates.length > 0
      ? 'Ações Rápidas exportadas com sucesso!'
      : 'Lista de Ações Rápidas vazia.'
  );
};

export const handleImportQuickActionsCSV = (e, { t, addOption, templates }) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const text = event.target.result;
      const parsed = parseCSV(text);
      if (parsed.length === 0 || (parsed.length === 1 && parsed[0][0] === '')) {
        toast.success('Nenhum template encontrado no arquivo CSV.');
        return;
      }

      const headers = parsed[0].map(h => h.trim().toLowerCase());
      const rows = parsed.slice(1);

      if (rows.length === 0 || (rows.length === 1 && rows[0].length === 1 && rows[0][0] === '')) {
        toast.success('Nenhum template encontrado no arquivo CSV.');
        return;
      }

      let importedCount = 0;
      const updatedTemplates = [...templates];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 1 && row[0] === '') continue; // skip empty lines

        const fields = {};
        headers.forEach((header, idx) => {
          // Normalize header keys
          const normHeader = header.trim().toLowerCase();
          fields[normHeader] = row[idx] ? row[idx].trim() : '';
        });

        // The name column is required to save/identify a template
        const nameVal = fields.name;
        if (!nameVal) {
          continue; // skip rows without a name
        }

        const templateData = {
          from: fields.from || '',
          transaction_type: fields.type || '',
          transaction_subtype: fields.subtype || '',
          entity: fields.entity || '',
          transaction_category: fields.category || '',
          target_account: fields.target_account || '',
          source_dest_bank: fields.source_account || '',
          flow: fields.flow || '',
          payment_status: fields.status || '',
          description: fields.description || '',
          amount: fields.amount || '',
          due_date: fields.due_date || null,
          value_date: fields.value_date || null,
          posting_date: fields.posting_date || null
        };

        const newTemplate = {
          name: nameVal,
          icon: fields.icon || '⚡',
          data: templateData
        };

        // Check if template with the same name already exists, update if it does, otherwise append
        const existingIndex = updatedTemplates.findIndex(tpl => tpl.name.toLowerCase() === nameVal.toLowerCase());
        if (existingIndex > -1) {
          updatedTemplates[existingIndex] = newTemplate;
        } else {
          updatedTemplates.push(newTemplate);
        }
        importedCount++;
      }

      if (importedCount === 0) {
        toast.error('Nenhum template válido (com nome) foi importado.');
        return;
      }

      // Update the store templates
      addOption('quickActionImportBulk', updatedTemplates);
      toast.success(`${importedCount} Ações Rápidas importadas com sucesso!`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao importar CSV de Ações Rápidas.');
    } finally {
      e.target.value = '';
    }
  };
  reader.readAsText(file);
};
