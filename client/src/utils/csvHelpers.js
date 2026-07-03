import { toast } from 'react-hot-toast';

const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean; // Already YYYY-MM-DD
  
  // Try parsing M/D/YYYY or D/M/YYYY or YYYY/MM/DD
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    
    // Check if it's D/M/YYYY or M/D/YYYY
    let first = parts[0];
    let second = parts[1];
    let y = parts[2];
    if (y.length === 2) {
      y = '20' + y;
    }
    
    // In European/Portuguese locales, CSV dates are D/M/YYYY (e.g. 25/6/2026).
    // Let's assume D/M/YYYY. If month (second part) > 12, swap them.
    let d = first;
    let m = second;
    if (Number(m) > 12) {
      d = second;
      m = first;
    }
    
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  
  // Fallback to standard JS Date parsing
  try {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {}
  
  return null;
};

export const handleExportCSV = (transactions, t) => {
  const headers = [
    'id',
    'profile_id',
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
    'quick_action_name',
    'target_account',
    'source_dest_bank',
    'flow',
    'description',
    'month',
    'year',
    'quarter',
    'created_at'
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
  // Strip BOM if present
  const cleanText = text.replace(/^\uFEFF/, '');

  // Detect separator: count commas vs semicolons vs tabs in the first line
  const firstLine = cleanText.split(/\r?\n/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let separator = ',';
  if (semicolonCount > commaCount && semicolonCount > tabCount) {
    separator = ';';
  } else if (tabCount > commaCount && tabCount > semicolonCount) {
    separator = '\t';
  }

  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const c = cleanText[i];
    const next = cleanText[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === separator && !inQuotes) {
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
          const normHeader = header.trim().toLowerCase();
          
          if (normHeader === 'id') {
            tx.id = val || null;
          } else if (normHeader === 'profile_id') {
            tx.profile_id = val || null;
          } else if (normHeader === 'amount' || normHeader === 'ouro' || normHeader === 'coins') {
            let cleanAmt = val.trim().replace(/\s/g, '');
            if (cleanAmt.includes(',') && cleanAmt.includes('.')) {
              if (cleanAmt.lastIndexOf(',') > cleanAmt.lastIndexOf('.')) {
                cleanAmt = cleanAmt.replace(/\./g, '').replace(/,/g, '.');
              } else {
                cleanAmt = cleanAmt.replace(/,/g, '');
              }
            } else if (cleanAmt.includes(',')) {
              cleanAmt = cleanAmt.replace(/,/g, '.');
            }
            tx.amount = Number(cleanAmt) || 0;
          } else if (normHeader === 'from' || normHeader === 'from (origem)' || normHeader === 'origin') {
            tx.from = val;
          } else if (normHeader === 'value_date' || normHeader === 'value date' || normHeader === 'date' || normHeader === 'data') {
            tx.value_date = normalizeDate(val);
          } else if (normHeader === 'posting_date' || normHeader === 'posting date') {
            tx.posting_date = normalizeDate(val);
          } else if (normHeader === 'due_date' || normHeader === 'due date') {
            tx.due_date = normalizeDate(val);
          } else if (normHeader === 'payment_status' || normHeader === 'status') {
            tx.payment_status = val;
          } else if (normHeader === 'transaction_type' || normHeader === 'entity class' || normHeader === 'class' || normHeader === 'classe') {
            tx.transaction_type = val;
          } else if (normHeader === 'transaction_subtype' || normHeader === 'sub classe' || normHeader === 'sub_class' || normHeader === 'sub class') {
            tx.transaction_subtype = val;
          } else if (normHeader === 'entity') {
            tx.entity = val;
          } else if (normHeader === 'transaction_category' || normHeader === 'category') {
            tx.transaction_category = val;
          } else if (normHeader === 'quick_action_name' || normHeader === 'quick action name' || normHeader === 'quickactionname') {
            tx.quick_action_name = val;
          } else if (normHeader === 'target_account' || normHeader === 'target account') {
            tx.target_account = val;
          } else if (normHeader === 'source_dest_bank' || normHeader === 'source dest bank' || normHeader === 'source_account' || normHeader === 'source account') {
            tx.source_dest_bank = val;
          } else if (normHeader === 'flow' || normHeader === 'transaction_flow') {
            tx.flow = val ? val.trim().toLowerCase() : '';
          } else if (normHeader === 'description') {
            tx.description = val;
          } else if (normHeader === 'month') {
            tx.month = val;
          } else if (normHeader === 'year') {
            tx.year = val ? Number(val) : null;
          } else if (normHeader === 'quarter') {
            tx.quarter = val;
          } else if (normHeader === 'created_at' || normHeader === 'created at') {
            tx.created_at = val || null;
          } else {
            tx[header] = val;
          }
        });

        // Skip blank/empty rows containing only delimiters (e.g. ,,,,,,,,,,,,,,)
        const isRowEmpty = Object.keys(tx).every(key => {
          if (key === 'id' || key === 'profile_id' || key === 'created_at') return true;
          return !tx[key];
        });
        if (isRowEmpty) continue;

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
        if (!tx.flow) {
          tx.flow = tx.transaction_flow ? tx.transaction_flow.trim().toLowerCase() : ((isIncome || isReceipt) ? 'inflow' : 'outflow');
        } else {
          tx.flow = tx.flow.trim().toLowerCase();
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
          flow: fields.flow ? fields.flow.trim().toLowerCase() : '',
          payment_status: fields.status || '',
          description: fields.description || '',
          amount: fields.amount || '',
          due_date: fields.due_date || null,
          value_date: fields.value_date || null,
          posting_date: fields.posting_date || null
        };

        const newTemplate = {
          name: nameVal,
          icon: '⚡',
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

export const handleExportSettingsCSV = (storeData, getMatrixRows) => {
  const matrixRows = getMatrixRows() || [];

  let csv = 'subtype,category,entity\n';
  matrixRows.forEach(row => {
    csv += `${escapeCsvField(row.subtype)},${escapeCsvField(row.category)},${escapeCsvField(row.entity)}\n`;
  });

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `categories_matrix_${new Date().toISOString().split('T')[0]}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  setTimeout(() => {
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);

  toast.success('Categories exported successfully!');
};

export const handleImportSettingsCSV = (e, { syncSettings }) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const text = event.target.result;
      const parsedRows = parseCSV(text);

      let matrixRows = [];
      let isSectionBased = false;

      for (let i = 0; i < parsedRows.length; i++) {
        if (parsedRows[i][0] && parsedRows[i][0].trim().startsWith('# SECTION:')) {
          isSectionBased = true;
          break;
        }
      }

      if (isSectionBased) {
        let inCategoriesSection = false;
        parsedRows.forEach(row => {
          if (row.length === 0 || row.every(cell => !cell || cell.trim() === '')) return;
          const firstVal = row[0].trim();
          if (firstVal.startsWith('# SECTION:')) {
            const rawSec = firstVal.replace('# SECTION:', '').trim().toUpperCase();
            inCategoriesSection = (rawSec === 'CATEGORIES');
            return;
          }
          if (inCategoriesSection) {
            matrixRows.push(row);
          }
        });
      } else {
        matrixRows = parsedRows;
      }

      if (matrixRows.length <= 1) {
        toast.error('No category mapping found in CSV.');
        return;
      }

      const headers = matrixRows[0].map(h => h.trim().toLowerCase());
      const subtypeIdx = headers.indexOf('subtype');
      const categoryIdx = headers.indexOf('category');
      const entityIdx = headers.indexOf('entity');

      if (subtypeIdx === -1 && categoryIdx === -1 && entityIdx === -1) {
        toast.error('Invalid CSV headers. Must contain subtype, category, or entity.');
        return;
      }

      const parsedMatrixRows = [];
      matrixRows.slice(1).forEach(row => {
        if (row.length === 0 || row.every(cell => !cell || cell.trim() === '')) return;
        
        const subtype = subtypeIdx !== -1 && row[subtypeIdx] ? row[subtypeIdx].trim() : '';
        const category = categoryIdx !== -1 && row[categoryIdx] ? row[categoryIdx].trim() : '';
        const entity = entityIdx !== -1 && row[entityIdx] ? row[entityIdx].trim() : '';

        if (subtype || category || entity) {
          parsedMatrixRows.push({ subtype, category, entity });
        }
      });

      if (parsedMatrixRows.length === 0) {
        toast.error('No valid category mappings found.');
        return;
      }

      const newSubClassOptions = new Set();
      const newCategoryOptions = new Set();
      const newEntityOptions = new Set();
      const newEntityMappings = {};
      const newSubtypeToCategoryMap = {};

      parsedMatrixRows.forEach((row) => {
        const sub = row.subtype ? row.subtype.trim() : '';
        const cat = row.category ? row.category.trim() : '';
        const ent = row.entity ? row.entity.trim() : '';

        if (sub) {
          newSubClassOptions.add(sub);
          if (!newSubtypeToCategoryMap[sub]) {
            newSubtypeToCategoryMap[sub] = [];
          }
        }

        if (cat) {
          newCategoryOptions.add(cat);
          if (sub) {
            if (!newSubtypeToCategoryMap[sub].includes(cat)) {
              newSubtypeToCategoryMap[sub].push(cat);
            }
          }
        }

        if (ent) {
          newEntityOptions.add(ent);
          if (cat) {
            newEntityMappings[ent] = cat;
          }
        }
      });

      newSubClassOptions.forEach(sub => {
        if (!newSubtypeToCategoryMap[sub]) {
          newSubtypeToCategoryMap[sub] = [];
        }
      });

      const updates = {
        subClassOptions: Array.from(newSubClassOptions),
        categoryOptions: Array.from(newCategoryOptions),
        entityOptions: Array.from(newEntityOptions),
        entityMappings: newEntityMappings,
        subtypeToCategoryMap: newSubtypeToCategoryMap
      };

      await syncSettings(updates);
      toast.success('Categories configuration updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to import CSV configuration.');
    } finally {
      e.target.value = '';
    }
  };
  reader.readAsText(file);
};

function escapeCsvField(val) {
  if (val === null || val === undefined) return '';
  let stringVal = String(val);
  if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
    stringVal = '"' + stringVal.replace(/"/g, '""') + '"';
  }
  return stringVal;
}


