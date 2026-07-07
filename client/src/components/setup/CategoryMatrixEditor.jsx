/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import { STANDARD_MODAL_PROPS } from '../constants/UI_UX';
import { useKingdomStore } from '../store/useKingdomStore';
import TableSortHeader from './shared/TableSortHeader';
import TablePagination from './shared/TablePagination';
import BulkActionBar from './shared/BulkActionBar';

export default function CategoryMatrixEditor({
  t,
  subClassOptions,
  categoryOptions,
  entityOptions,
  entityMappings,
  subtypeToCategoryMap,
  syncSettings,
  getMatrixRows,
  handleSaveMatrix,
  settingsFileInputRef,
  importSettingsCSV,
  exportSettingsCSV
}) {
  const subtypeTypes = useKingdomStore(state => state.subtypeTypes) || {};
  const classOptions = useKingdomStore(state => state.classOptions) || [];
  const accountMappings = useKingdomStore(state => state.accountMappings) || {};

  const [selectedMatrixKeys, setSelectedMatrixKeys] = useState([]);
  const [isAddMatrixModalOpen, setIsAddMatrixModalOpen] = useState(false);
  const [newMatrixSubtype, setNewMatrixSubtype] = useState('');
  const [newMatrixCategory, setNewMatrixCategory] = useState('');
  const [newMatrixEntity, setNewMatrixEntity] = useState('');
  const [customSubtypeInput, setCustomSubtypeInput] = useState('');
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Edit Modal States
  const [isEditMatrixModalOpen, setIsEditMatrixModalOpen] = useState(false);
  const [editMatrixRowKey, setEditMatrixRowKey] = useState(null);
  const [editMatrixSubtype, setEditMatrixSubtype] = useState('');
  const [editMatrixCategory, setEditMatrixCategory] = useState('');
  const [editMatrixEntity, setEditMatrixEntity] = useState('');
  const [editCustomSubtypeInput, setEditCustomSubtypeInput] = useState('');
  const [editCustomCategoryInput, setEditCustomCategoryInput] = useState('');

  // Sort states
  const [categoriesSortField, setCategoriesSortField] = useState(null);
  const [categoriesSortDirection, setCategoriesSortDirection] = useState('asc');

  // Warning filter state
  const [showIncompleteActiveOnly, setShowIncompleteActiveOnly] = useState(false);

  // Filter states
  const [filterMatrixType, setFilterMatrixType] = useState('');
  const [filterMatrixSubtype, setFilterMatrixSubtype] = useState('');
  const [filterMatrixCategory, setFilterMatrixCategory] = useState('');
  const [filterMatrixEntity, setFilterMatrixEntity] = useState('');

  // Pagination states
  const [matrixCurrentPage, setMatrixCurrentPage] = useState(1);
  const [manualMatrixPageInput, setManualMatrixPageInput] = useState('1');

  const handleDeleteMatrixSelections = () => {
    const selectedKeys = new Set(selectedMatrixKeys);
    const updatedRows = getMatrixRows().filter(row => !selectedKeys.has(row.key));
    handleSaveMatrix(updatedRows);
    setSelectedMatrixKeys([]);
  };

  const handleAutoReconcile = () => {
    const currentRows = getMatrixRows();
    let reconciledCount = 0;

    const isEntityInvalid = (ent) => {
      const val = (ent || '').trim().toLowerCase();
      return !val || val === 'none' || val === 'null' || val === 'undefined';
    };

    const defaultSubtypeToCategoryMap = {
      "Banks": ["Bank account", "Savings account", "Investments account"],
      "Fixed Assets": ["Fixed Assets"],
      "Personal Debt": ["Loans & Burrow", "Credit Cards"],
      "Other Debts": ["Other Debts"],
      "Living & Household": ["Household", "Utilities"],
      "Personal Transports": ["Gasoline", "Tolls", "Parking", "Repairs"],
      "Public Transports": ["Public Transports"],
      "Other Transports": ["Other Transports"],
      "Markets & Consumables": ["Markets & Groceries", "Markets and Tools", "Markets and Clothing", "Other Market consumables"],
      "Health": ["Health"],
      "Entertainment": ["Entertainment"],
      "Education": ["Education"],
      "Insurances": ["Insurances"],
      "Insurances (income)": ["Insurances"],
      "Taxes & State": ["Taxes", "Interest"],
      "Taxes & State (income)": ["Taxes", "Interest"],
      "Financial Expenses": ["Interest paid", "Fines", "Loans & Burrow", "Credit Cards"],
      "Payroll": ["Salary", "Payroll Subsidies"],
      "Other Income": ["Other Incomes"],
      "Financial Income": ["Fines", "Loans & Burrow", "Credit Cards"]
    };

    const defaultCategoryToSubtype = {};
    Object.entries(defaultSubtypeToCategoryMap).forEach(([sub, cats]) => {
      cats.forEach(c => {
        if (!defaultCategoryToSubtype[c]) {
          defaultCategoryToSubtype[c] = [];
        }
        if (!defaultCategoryToSubtype[c].includes(sub)) {
          defaultCategoryToSubtype[c].push(sub);
        }
      });
    });

    const defaultAccountMappings = {
      '10101001': '10101001 - Bank account - CGD',
      '10101002': '10101002 - Bank account - Universo',
      '10101003': '10101003 - Bank account - Active Bank',
      '10101004': '10101004 - Bank account - Inter Bank',
      '10102001': '10102001 - Savings account - CGD',
      '10102002': '10102002 - Savings account - Active Bank',
      '10102003': '10102003 - Savings account - Inter Bank',
      '10103001': '10103001 - Investments account - CGD',
      '10103002': '10103002 - Investments account - Universo',
      '10103003': '10103003 - Investments account - Active Bank',
      '10103004': '10103004 - Investments account - Wizink',
      '10103005': '10103005 - Investments account - Inter Bank',
      '10104001': '10104001 - Fixed Assets - Jota',
      '20101001': '20101001 - Loans & Burrow - CGD',
      '20101002': '20101002 - Loans & Burrow - Universo',
      '20101003': '20101003 - Loans & Burrow - Active Bank',
      '20101004': '20101004 - Loans & Burrow - Inter Bank',
      '20101005': '20101005 - Loans & Burrow - Wizink',
      '20101006': '20101006 - Loans & Burrow - Cofidis',
      '20101007': '20101007 - Loans & Burrow - Other Loans',
      '20102001': '20102001 - Loans & Burrow - Jota',
      '20102002': '20102002 - Loans & Burrow - Mae',
      '20102003': '20102003 - Loans & Burrow - Reni',
      '20102004': '20102004 - Loans & Burrow - Pedro',
      '20102005': '20102005 - Loans & Burrow - Other Burrow',
      '20103001': '20103001 - Credit Cards - CGD',
      '20103002': '20103002 - Credit Cards - Universo',
      '20103003': '20103003 - Credit Cards - Active Bank',
      '20103004': '20103004 - Credit Cards - Inter Bank',
      '20103005': '20103005 - Credit Cards - Wizink',
      '20201001': '20201001 - Other Debts - Social Security',
      '20201002': '20201002 - Other Debts - Finances',
      '20201003': '20201003 - Other Debts - NOS',
      '60101001': '60101001 - Household - Oeiras',
      '60101002': '60101002 - Household - Oeiras Utensils',
      '60101003': '60101003 - Household - Oeiras Decoration',
      '60101004': '60101004 - Household - Other Household',
      '60101005': '60101005 - Household - Portela',
      '60102001': '60102001 - Utilities - DIGAL',
      '60102002': '60102002 - Utilities - SIMAS',
      '60102003': '60102003 - Utilities - NOS',
      '60102004': '60102004 - Utilities - Other Utilities',
      '60201001': '60201001 - Gasoline - Motorcycle',
      '60201002': '60201002 - Gasoline - Car',
      '60202001': '60202001 - Tolls - Via Verde',
      '60203001': '60203001 - Parking - Parking',
      '60204001': '60204001 - Repairs - Motorcycle',
      '60204002': '60204002 - Repairs - Car',
      '60301001': '60301001 - Public Transports - Public Transport (Metro/Train/Bus)',
      '60401001': '60401001 - Other Transports - Uber / Chauffeur',
      '60401002': '60401002 - Other Transports - Taxis',
      '60501001': '60501001 - Markets & Groceries - Food',
      '60501002': '60501002 - Markets & Groceries - Pet Food',
      '60501003': '60501003 - Markets & Groceries - Food (work lunch)',
      '60501004': '60501004 - Markets & Groceries - Soda Drinks',
      '60501005': '60501005 - Markets & Groceries - Alcoholic Drinks',
      '60501006': '60501006 - Markets & Groceries - Cleaning Products',
      '60501007': '60501007 - Markets & Groceries - Personal Hygiene',
      '60501008': '60501008 - Markets & Groceries - Cosmetics',
      '60502001': '60502001 - Markets and Tools - Tools',
      '60503001': '60503001 - Markets and Clothing - Clothing',
      '60503002': '60503002 - Markets and Clothing - Shoes',
      '60504001': '60504001 - Other Market consumables - Other Market consumables',
      '60601001': '60601001 - Health - Public Hospital',
      '60601002': '60601002 - Health - Private Hospital',
      '60601003': '60601003 - Health - Medical Sessions & Exams',
      '60601004': '60601004 - Health - Active Psicologia Coimbra',
      '60601005': '60601005 - Health - Psicologist 2',
      '60601006': '60601006 - Health - Marco (Jota Mateus)',
      '60601007': '60601007 - Health - Marco Consultas (private)',
      '60601008': '60601008 - Health - Dentist Beatriz',
      '60601009': '60601009 - Health - Dentist 2',
      '60601010': '60601010 - Health - Farmacia Oeiras',
      '60601011': '60601011 - Health - Farmacia Portela',
      '60701001': '60701001 - Entertainment - Restaurant dinner',
      '60701002': '60701002 - Entertainment - Cinema',
      '60701003': '60701003 - Entertainment - Streaming',
      '60701004': '60701004 - Entertainment - Nightlife & Disco',
      '60701005': '60701005 - Entertainment - Gaming',
      '60801001': '60801001 - Education - PhD',
      '60801002': '60801002 - Education - Trainings',
      '60901001': '60901001 - Insurances - Health Insurance',
      '60901002': '60901002 - Insurances - Car',
      '60901003': '60901003 - Insurances - Motorcycle',
      '60901004': '60901004 - Insurances - Life insurance',
      '61001001': '61001001 - Taxes - Mobility (IUC)',
      '61001002': '61001002 - Taxes - Finances',
      '61001003': '61001003 - Taxes - Social Security',
      '61001004': '61001004 - Taxes - Justice',
      '61001005': '61001005 - Taxes - IRS',
      '61101001': '61101001 - Interest paid - Interest',
      '61102001': '61102001 - Fines - Fines',
      '61103001': '61103001 - Loans & Burrow - CGD',
      '61103002': '61103002 - Loans & Burrow - Universo',
      '61103003': '61103003 - Loans & Burrow - Cofidis',
      '61103004': '61103004 - Loans & Burrow - Jota',
      '61103005': '61103005 - Loans & Burrow - Mae',
      '61104001': '61104001 - Credit Cards - CGD',
      '61104002': '61104002 - Credit Cards - Universo',
      '61104003': '61104003 - Credit Cards - Active Bank',
      '61104004': '61104004 - Credit Cards - Inter Bank',
      '70101001': '70101001 - Salary - Base Salary',
      '70101002': '70101002 - Salary - Consulting / Contract Services',
      '70101003': '70101003 - Salary - Teaching Classes',
      '70101004': '70101004 - Salary - Bonus (Scorecard)',
      '70201001': '70201001 - Other Incomes - Family Gifts',
      '70201002': '70201002 - Other Incomes - Cashbacks & Rewards',
      '70301001': '70301001 - Insurances - Health Insurance',
      '70301002': '70301002 - Insurances - Car',
      '70301003': '70301003 - Insurances - Motorcycle',
      '70301004': '70301004 - Insurances - Life insurance',
      '70401001': '70401001 - Taxes - IRS',
      '70401002': '70401002 - Taxes - Mobility (IUC)',
      '70401003': '70401003 - Taxes - Finances',
      '70401004': '70401004 - Taxes - Social Security',
      '70401005': '70401005 - Taxes - Justice',
      '70401006': '70401006 - Taxes - IRS',
      '70501001': '70501001 - Interest - Interest',
      '70502001': '70502001 - Fines - Fines',
      '70503001': '70503001 - Loans & Burrow - CGD',
      '70503002': '70503002 - Loans & Burrow - Universo',
      '70503003': '70503003 - Loans & Burrow - Cofidis',
      '70503004': '70503004 - Loans & Burrow - Jota',
      '70503005': '70503005 - Loans & Burrow - Mae',
      '70504001': '70504001 - Credit Cards - CGD',
      '70504002': '70504002 - Credit Cards - Universo',
      '70504003': '70504003 - Credit Cards - Active Bank',
      '70504004': '70504004 - Credit Cards - Inter Bank'
    };

    const activeSubtypeToCategoryMap = { ...subtypeToCategoryMap };

    // Auto-heal empty subclasses/subtypes (e.g. Insurances (income))
    Object.keys(defaultSubtypeToCategoryMap).forEach(sub => {
      if (!activeSubtypeToCategoryMap[sub] || activeSubtypeToCategoryMap[sub].length === 0) {
        activeSubtypeToCategoryMap[sub] = [...(defaultSubtypeToCategoryMap[sub] || [])];
      }
    });

    const getCategorySubtypes = (cat) => {
      const subs = [];
      Object.entries(activeSubtypeToCategoryMap).forEach(([sub, cats]) => {
        if (cats && cats.includes(cat)) {
          subs.push(sub);
        }
      });
      if (subs.length > 0) return subs;
      if (defaultCategoryToSubtype[cat]) {
        return defaultCategoryToSubtype[cat];
      }
      let defaultCat = '';
      Object.entries(accountMappings || {}).forEach(([code, fullName]) => {
        let remaining = fullName;
        if (remaining.startsWith(code)) {
          remaining = remaining.substring(code.length).replace(/^\s*-\s*/, '');
        }
        const parts = remaining.split(/\s*-\s*/);
        const c = parts[0] || '';
        if (c.trim().toLowerCase() === cat.trim().toLowerCase()) {
          const defaultFullName = defaultAccountMappings[code];
          if (defaultFullName) {
            let defRemaining = defaultFullName;
            if (defRemaining.startsWith(code)) {
              defRemaining = defRemaining.substring(code.length).replace(/^\s*-\s*/, '');
            }
            const defParts = defRemaining.split(/\s*-\s*/);
            defaultCat = defParts[0] || '';
          }
        }
      });

      if (defaultCat && defaultCategoryToSubtype[defaultCat]) {
        return defaultCategoryToSubtype[defaultCat];
      }
      return [];
    };

    // Heal missing Subtypes for categories in activeSubtypeToCategoryMap
    currentRows.forEach(row => {
      if (!row.subtype && row.category) {
        const subs = getCategorySubtypes(row.category);
        subs.forEach(s => {
          if (!activeSubtypeToCategoryMap[s]) {
            activeSubtypeToCategoryMap[s] = [];
          }
          if (!activeSubtypeToCategoryMap[s].includes(row.category)) {
            activeSubtypeToCategoryMap[s].push(row.category);
          }
        });
      }
    });

    // Ensure all categories in activeSubtypeToCategoryMap are also in categoryOptions
    const updatedCategoryOptions = [...(categoryOptions || [])];
    Object.values(activeSubtypeToCategoryMap).forEach(cats => {
      if (cats && Array.isArray(cats)) {
        cats.forEach(c => {
          if (c && !updatedCategoryOptions.includes(c)) {
            updatedCategoryOptions.push(c);
          }
        });
      }
    });

    // Sync healed subcategories map and categoryOptions
    syncSettings({ 
      subtypeToCategoryMap: activeSubtypeToCategoryMap,
      categoryOptions: updatedCategoryOptions
    });

    // Parse COA
    const coaMatches = {};
    Object.entries(accountMappings).forEach(([code, fullName]) => {
      let remaining = fullName;
      if (remaining.startsWith(code)) {
        remaining = remaining.substring(code.length).replace(/^\s*-\s*/, '');
      }
      const parts = remaining.split(/\s*-\s*/);
      const category = parts[0] || '';
      const entity = parts.slice(1).join(' - ') || '';
      
      if (entity && category && !isEntityInvalid(entity)) {
        const subs = getCategorySubtypes(category);
        subs.forEach(subtype => {
          const key = entity.trim().toLowerCase();
          if (!coaMatches[key]) {
            coaMatches[key] = [];
          }
          coaMatches[key].push({ subtype, category });
        });
      }
    });

    // Phase 1: Reconcile rows with populated Entity but empty Subtype/Category
    const phase1UpdatedRows = currentRows.map(row => {
      let subtype = row.subtype;
      let category = row.category;
      const isRowIncomplete = !subtype || !category;
      if (isRowIncomplete && row.entity && !isEntityInvalid(row.entity)) {
        const key = row.entity.trim().toLowerCase();
        const matches = coaMatches[key] || [];
        if (matches.length > 0) {
          subtype = matches[0].subtype;
          category = matches[0].category;
          reconciledCount++;
        } else {
          // Trace back via defaultAccountMappings fallback
          Object.entries(defaultAccountMappings).forEach(([code, defaultName]) => {
            let defRemaining = defaultName;
            if (defRemaining.startsWith(code)) {
              defRemaining = defRemaining.substring(code.length).replace(/^\s*-\s*/, '');
            }
            const defParts = defRemaining.split(/\s*-\s*/);
            const defCat = defParts[0] || '';
            const defEnt = defParts.slice(1).join(' - ') || '';
            if (defEnt.trim().toLowerCase() === row.entity.trim().toLowerCase() && !isEntityInvalid(defEnt)) {
              const subs = getCategorySubtypes(defCat);
              if (subs.length > 0) {
                subtype = subs[0];
                category = defCat;
                reconciledCount++;
              }
            }
          });
        }
      }
      return { ...row, subtype, category };
    });

    // Phase 2: Expand generic rows (missing entity) and clean up
    const existingSpecificKeys = new Set(
      phase1UpdatedRows
        .filter(r => r.subtype && r.category && r.entity && !isEntityInvalid(r.entity))
        .map(r => `${r.subtype.toLowerCase()}|||${r.category.toLowerCase()}|||${r.entity.toLowerCase()}`)
    );
    
    const newGeneratedRows = [];
    const keysToRemove = new Set();

    phase1UpdatedRows.forEach(row => {
      const isGenericRow = row.subtype && row.category && isEntityInvalid(row.entity);
      if (isGenericRow) {
        let expandedCount = 0;
        
        // Match using active COA
        Object.entries(accountMappings).forEach(([code, fullName]) => {
          let remaining = fullName;
          if (remaining.startsWith(code)) {
            remaining = remaining.substring(code.length).replace(/^\s*-\s*/, '');
          }
          const parts = remaining.split(/\s*-\s*/);
          const category = parts[0] || '';
          let entity = parts.slice(1).join(' - ') || '';
          
          if (category.trim().toLowerCase() === row.category.trim().toLowerCase()) {
            // Fallback to default entity if parsed entity is invalid
            if (isEntityInvalid(entity)) {
              const defName = defaultAccountMappings[code];
              if (defName) {
                let defRemaining = defName;
                if (defRemaining.startsWith(code)) {
                  defRemaining = defRemaining.substring(code.length).replace(/^\s*-\s*/, '');
                }
                const defParts = defRemaining.split(/\s*-\s*/);
                const defEnt = defParts.slice(1).join(' - ') || '';
                if (!isEntityInvalid(defEnt)) {
                  entity = defEnt;
                }
              }
            }

            if (entity && !isEntityInvalid(entity)) {
              const specKey = `${row.subtype.toLowerCase()}|||${row.category.toLowerCase()}|||${entity.toLowerCase()}`;
              if (!existingSpecificKeys.has(specKey)) {
                existingSpecificKeys.add(specKey);
                newGeneratedRows.push({
                  key: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  subtype: row.subtype,
                  category: row.category,
                  entity: entity.trim()
                });
              }
              expandedCount++;
            }
          }
        });

        // Fallback match using defaultAccountMappings directly if no expansion occurred
        if (expandedCount === 0) {
          Object.entries(defaultAccountMappings).forEach(([code, defaultName]) => {
            let defRemaining = defaultName;
            if (defRemaining.startsWith(code)) {
              defRemaining = defRemaining.substring(code.length).replace(/^\s*-\s*/, '');
            }
            const defParts = defRemaining.split(/\s*-\s*/);
            const defCat = defParts[0] || '';
            const defEnt = defParts.slice(1).join(' - ') || '';
            if (defCat.trim().toLowerCase() === row.category.trim().toLowerCase() && !isEntityInvalid(defEnt)) {
              const specKey = `${row.subtype.toLowerCase()}|||${row.category.toLowerCase()}|||${defEnt.toLowerCase()}`;
              if (!existingSpecificKeys.has(specKey)) {
                existingSpecificKeys.add(specKey);
                newGeneratedRows.push({
                  key: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  subtype: row.subtype,
                  category: row.category,
                  entity: defEnt.trim()
                });
              }
              expandedCount++;
            }
          });
        }

        if (expandedCount > 0) {
          keysToRemove.add(row.key);
        }
      }
    });

    const finalRows = [
      ...phase1UpdatedRows.filter(r => !keysToRemove.has(r.key)),
      ...newGeneratedRows
    ];

    if (reconciledCount > 0 || newGeneratedRows.length > 0) {
      handleSaveMatrix(finalRows);
      toast.success(
        `Successfully reconciled ${reconciledCount} row(s) and generated ${newGeneratedRows.length} new entity mapping(s)!`
      );
    } else {
      toast.error("No incomplete or generic rows could be reconciled from COA.");
    }
  };

  const allRows = getMatrixRows();

  // Filter logic
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (showIncompleteActiveOnly) {
        const isIncomplete = !row.subtype || !row.category || !row.entity;
        if (!isIncomplete) return false;
      }
      const types = subtypeTypes[row.subtype] || [];
      if (filterMatrixType && !types.includes(filterMatrixType)) return false;
      if (filterMatrixSubtype && row.subtype !== filterMatrixSubtype) return false;
      if (filterMatrixCategory && row.category !== filterMatrixCategory) return false;
      if (filterMatrixEntity && row.entity !== filterMatrixEntity) return false;
      return true;
    });
  }, [allRows, filterMatrixType, filterMatrixSubtype, filterMatrixCategory, filterMatrixEntity, subtypeTypes, showIncompleteActiveOnly]);

  // Dynamic filter options
  const dynamicSubtypes = useMemo(() => {
    return Array.from(new Set(
      allRows
        .filter(row => {
          const types = subtypeTypes[row.subtype] || [];
          return !filterMatrixType || types.includes(filterMatrixType);
        })
        .map(row => row.subtype)
        .filter(Boolean)
    )).sort();
  }, [allRows, filterMatrixType, subtypeTypes]);

  const dynamicCategories = useMemo(() => {
    return Array.from(new Set(
      allRows
        .filter(row => {
          const types = subtypeTypes[row.subtype] || [];
          if (filterMatrixType && !types.includes(filterMatrixType)) return false;
          if (filterMatrixSubtype && row.subtype !== filterMatrixSubtype) return false;
          return true;
        })
        .map(row => row.category)
        .filter(Boolean)
    )).sort();
  }, [allRows, filterMatrixType, filterMatrixSubtype, subtypeTypes]);

  const dynamicEntities = useMemo(() => {
    return Array.from(new Set(
      allRows
        .filter(row => {
          const types = subtypeTypes[row.subtype] || [];
          if (filterMatrixType && !types.includes(filterMatrixType)) return false;
          if (filterMatrixSubtype && row.subtype !== filterMatrixSubtype) return false;
          if (filterMatrixCategory && row.category !== filterMatrixCategory) return false;
          return true;
        })
        .map(row => row.entity)
        .filter(Boolean)
    )).sort();
  }, [allRows, filterMatrixType, filterMatrixSubtype, filterMatrixCategory, subtypeTypes]);

  // Sort logic
  const sortedRows = useMemo(() => {
    let list = [...filteredRows];
    if (categoriesSortField) {
      list.sort((a, b) => {
        const valA = (a[categoriesSortField] || '').toLowerCase();
        const valB = (b[categoriesSortField] || '').toLowerCase();
        if (valA < valB) return categoriesSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return categoriesSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [filteredRows, categoriesSortField, categoriesSortDirection]);

  // Pagination logic
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedRows.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(matrixCurrentPage, 1), totalPages);
  const paginatedRows = useMemo(() => {
    return sortedRows.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);
  }, [sortedRows, safeCurrentPage]);


  const incompleteEntities = useMemo(() => {
    return new Set(
      allRows
        .filter(r => !r.subtype || !r.category || !r.entity)
        .map(r => r.entity)
        .filter(Boolean)
    );
  }, [allRows]);

  const matchedCOAAccounts = useMemo(() => {
    if (!showIncompleteActiveOnly) return [];
    
    const list = [];
    Object.entries(accountMappings).forEach(([code, fullName]) => {
      let remaining = fullName;
      if (remaining.startsWith(code)) {
        remaining = remaining.substring(code.length).replace(/^\s*-\s*/, '');
      }
      const parts = remaining.split(/\s*-\s*/);
      const category = parts[0] || '';
      const entity = parts.slice(1).join(' - ') || '';
      
      if (entity && incompleteEntities.has(entity)) {
        // Derive Type from code
        const firstDigit = code.charAt(0);
        let type = 'Unknown';
        if (firstDigit === '1') type = 'Assets';
        else if (firstDigit === '2') type = 'Liabilities';
        else if (firstDigit === '6') type = 'Expense';
        else if (firstDigit === '7') type = 'Income';
        
        // Derive Subtype by searching subtypeToCategoryMap
        let subtype = '';
        for (const [sub, cats] of Object.entries(subtypeToCategoryMap || {})) {
          if (cats && cats.includes(category)) {
            subtype = sub;
            break;
          }
        }
        
        list.push({
          code,
          fullName,
          category,
          entity,
          type,
          subtype
        });
      }
    });
    
    // Sort by entity name
    list.sort((a, b) => a.entity.localeCompare(b.entity));
    return list;
  }, [accountMappings, incompleteEntities, showIncompleteActiveOnly, subtypeToCategoryMap]);

  const modalMatchedCOA = useMemo(() => {
    if (!editMatrixEntity) return [];
    const list = [];
    const targetEntity = editMatrixEntity.trim().toLowerCase();
    
    Object.entries(accountMappings).forEach(([code, fullName]) => {
      let remaining = fullName;
      if (remaining.startsWith(code)) {
        remaining = remaining.substring(code.length).replace(/^\s*-\s*/, '');
      }
      const parts = remaining.split(/\s*-\s*/);
      const category = parts[0] || '';
      const entity = parts.slice(1).join(' - ') || '';
      
      if (entity.trim().toLowerCase() === targetEntity) {
        // Derive Type from code
        const firstDigit = code.charAt(0);
        let type = 'Unknown';
        if (firstDigit === '1') type = 'Assets';
        else if (firstDigit === '2') type = 'Liabilities';
        else if (firstDigit === '6') type = 'Expense';
        else if (firstDigit === '7') type = 'Income';
        
        // Derive Subtype by searching subtypeToCategoryMap
        let subtype = '';
        for (const [sub, cats] of Object.entries(subtypeToCategoryMap || {})) {
          if (cats && cats.includes(category)) {
            subtype = sub;
            break;
          }
        }
        
        list.push({
          code,
          fullName,
          category,
          entity,
          type,
          subtype
        });
      }
    });
    return list;
  }, [accountMappings, editMatrixEntity, subtypeToCategoryMap]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Action Buttons Header */}
      <div className="border-b border-[#8b4513]/20 pb-2 mb-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h3 className="title-font text-sm font-black text-[#4b2c20] uppercase">Categories Matrix</h3>
          <p className="text-[9px] text-[#5d4037]/75 font-bold uppercase tracking-wider font-sans">{t.official_ledger_editor}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1">
            {selectedMatrixKeys.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteMatrixSelections}
                className="px-2.5 h-[28px] bg-red-755 hover:bg-red-850 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-black text-[9px] uppercase tracking-wider gap-1"
                title="Delete Selected"
              >
                🗑️ Delete ({selectedMatrixKeys.length})
              </button>
            )}
            <button
              type="button"
              onClick={handleAutoReconcile}
              className="px-2.5 h-[28px] bg-amber-600 hover:bg-amber-700 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-black text-[9px] uppercase tracking-wider gap-1 mr-1"
              title="Automatically Reconcile Incomplete Rows from COA"
            >
              ⚡ Reconcile
            </button>
            <button
              type="button"
              onClick={() => {
                setNewMatrixSubtype('');
                setNewMatrixCategory('');
                setNewMatrixEntity('');
                setCustomSubtypeInput('');
                setCustomCategoryInput('');
                setIsAddMatrixModalOpen(true);
              }}
              className="px-2.5 h-[28px] bg-[#8b4513] hover:bg-[#8b4513]/90 text-white rounded-lg hover:scale-[1.05] active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center font-black text-[9px] uppercase tracking-wider gap-1"
              title="Add New Row"
            >
              ➕ New
            </button>
            <button
              type="button"
              onClick={() => settingsFileInputRef.current.click()}
              className="px-2.5 h-[28px] bg-[#faf4e5]/90 border border-[#8b4513]/25 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1 cursor-pointer ml-1"
              title="Import Settings CSV"
            >
              <span>📥</span> Import
            </button>
            <input
              type="file"
              ref={settingsFileInputRef}
              onChange={importSettingsCSV}
              accept=".csv"
              className="hidden"
            />
            <button
              type="button"
              onClick={exportSettingsCSV}
              className="px-2.5 h-[28px] bg-[#faf4e5]/90 border border-[#8b4513]/25 text-[#4b2c20] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#8b4513]/10 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              title="Export Settings CSV"
            >
              <span>📤</span> Export
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Filtering Row */}
      <div className="grid grid-cols-12 gap-3 mb-4 p-3 bg-[#faf4e5]/40 border border-[#8b4513]/15 rounded-xl flex-shrink-0 items-end">
        <div className="col-span-6 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
            Type
          </label>
          <select
            value={filterMatrixType}
            onChange={(e) => {
              setFilterMatrixType(e.target.value);
              setMatrixCurrentPage(1);
              setFilterMatrixSubtype('');
              setFilterMatrixCategory('');
              setFilterMatrixEntity('');
            }}
            className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 cursor-pointer"
          >
            <option value="">All Types</option>
            {classOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="col-span-6 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
            Subtype
          </label>
          <select
            value={filterMatrixSubtype}
            onChange={(e) => {
              setFilterMatrixSubtype(e.target.value);
              setMatrixCurrentPage(1);
              setFilterMatrixCategory('');
              setFilterMatrixEntity('');
            }}
            className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 cursor-pointer"
          >
            <option value="">All Subtypes</option>
            {dynamicSubtypes.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="col-span-6 sm:col-span-3">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
            Category
          </label>
          <select
            value={filterMatrixCategory}
            onChange={(e) => {
              setFilterMatrixCategory(e.target.value);
              setMatrixCurrentPage(1);
              setFilterMatrixEntity('');
            }}
            className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 cursor-pointer"
          >
            <option value="">All Categories</option>
            {dynamicCategories.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="col-span-6 sm:col-span-2">
          <label className="block text-[9px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
            Entity
          </label>
          <select
            value={filterMatrixEntity}
            onChange={(e) => {
              setFilterMatrixEntity(e.target.value);
              setMatrixCurrentPage(1);
            }}
            className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/20 rounded-lg h-[28px] px-2 text-[10px] font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50 cursor-pointer"
          >
            <option value="">All Entities</option>
            {dynamicEntities.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="col-span-12 sm:col-span-1 flex gap-1 h-[28px] items-center justify-start mb-[1px]">
          <button
            type="button"
            onClick={() => {
              setFilterMatrixType('');
              setFilterMatrixSubtype('');
              setFilterMatrixCategory('');
              setFilterMatrixEntity('');
              setMatrixCurrentPage(1);
              setShowIncompleteActiveOnly(false);
              toast.success("Filters cleared!");
            }}
            className="w-7 h-[26px] bg-[#faf4e5]/90 border border-[#8b4513]/25 hover:bg-[#8b4513]/10 text-stone-700 text-xs flex items-center justify-center rounded-lg cursor-pointer transition-all shadow-sm"
            title="Clear All Filters"
          >
            🧹
          </button>
          <button
            type="button"
            onClick={() => {
              setShowIncompleteActiveOnly(!showIncompleteActiveOnly);
              setMatrixCurrentPage(1);
            }}
            className={`w-7 h-[26px] border text-xs flex items-center justify-center rounded-lg cursor-pointer transition-all shadow-sm ${
              showIncompleteActiveOnly
                ? 'bg-[#8b4513] text-[#ffd700] border-[#d4af37]/40'
                : 'bg-[#faf4e5]/90 border-[#8b4513]/25 hover:bg-[#8b4513]/10 text-stone-700'
            }`}
            title="Show Incomplete Rows & Uncategorized COA"
          >
            ⚠️
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedMatrixKeys.length}
        label="Selected"
        className="mb-2"
      />

      {/* Matrix Table */}
      <div className="flex-1 overflow-y-auto border border-[#8b4513]/20 rounded-xl bg-[#faf4e5]/20 custom-scrollbar">
        <table className="w-full text-left border-collapse text-[10px] font-sans">
          <thead className="sticky top-0 bg-[#faf4e5] z-10 border-b border-[#8b4513]/25 shadow-sm">
            <tr className="text-[#4b2c20] font-black uppercase tracking-wider title-font">
              <th className="py-2 px-2 w-8 text-center">
                <input
                  type="checkbox"
                  checked={paginatedRows.length > 0 && paginatedRows.every(r => selectedMatrixKeys.includes(r.key))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMatrixKeys(prev => Array.from(new Set([...prev, ...paginatedRows.map(r => r.key)])));
                    } else {
                      setSelectedMatrixKeys(prev => prev.filter(k => !paginatedRows.some(r => r.key === k)));
                    }
                  }}
                  className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
                />
              </th>
              <TableSortHeader
                label="Subtype"
                field="subtype"
                sortField={categoriesSortField}
                sortDirection={categoriesSortDirection}
                onSort={(field) => {
                  if (categoriesSortField === field) {
                    setCategoriesSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  } else {
                    setCategoriesSortField(field);
                    setCategoriesSortDirection('asc');
                  }
                }}
                className="py-2 px-2"
              />
              <TableSortHeader
                label="Category"
                field="category"
                sortField={categoriesSortField}
                sortDirection={categoriesSortDirection}
                onSort={(field) => {
                  if (categoriesSortField === field) {
                    setCategoriesSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  } else {
                    setCategoriesSortField(field);
                    setCategoriesSortDirection('asc');
                  }
                }}
                className="py-2 px-2"
              />
              <TableSortHeader
                label="Entity"
                field="entity"
                sortField={categoriesSortField}
                sortDirection={categoriesSortDirection}
                onSort={(field) => {
                  if (categoriesSortField === field) {
                    setCategoriesSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  } else {
                    setCategoriesSortField(field);
                    setCategoriesSortDirection('asc');
                  }
                }}
                className="py-2 px-2"
              />
              <th className="py-2 px-2 text-right">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
            {paginatedRows.map((row) => {
              const isChecked = selectedMatrixKeys.includes(row.key);
              return (
                <tr key={row.key} className={`hover:bg-[#8b4513]/5 transition-colors ${isChecked ? 'bg-[#8b4513]/10' : ''}`}>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMatrixKeys(prev => [...prev, row.key]);
                        } else {
                          setSelectedMatrixKeys(prev => prev.filter(k => k !== row.key));
                        }
                      }}
                      className="cursor-pointer rounded border-[#8b4513]/30 text-[#8b4513] focus:ring-[#8b4513]"
                    />
                  </td>
                  <td className="py-2 px-2">
                    {row.subtype || <span className="text-[#5d4037]/40 italic font-medium">None</span>}
                  </td>
                  <td className="py-2 px-2">
                    {row.category || <span className="text-[#5d4037]/40 italic font-medium">None</span>}
                  </td>
                  <td className="py-2 px-2">
                    {row.entity || <span className="text-[#5d4037]/40 italic font-medium">None</span>}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditMatrixRowKey(row.key);
                        setEditMatrixSubtype(row.subtype || '');
                        setEditMatrixCategory(row.category || '');
                        setEditMatrixEntity(row.entity || '');
                        setEditCustomSubtypeInput('');
                        setEditCustomCategoryInput('');
                        setIsEditMatrixModalOpen(true);
                      }}
                      className="text-blue-700 hover:text-blue-900 border border-transparent hover:border-blue-200 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-all text-[10px] font-bold cursor-pointer"
                      title="Edit Mapping"
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <TablePagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={sortedRows.length}
            onPageChange={setMatrixCurrentPage}
            manualPageInput={manualMatrixPageInput}
            onManualPageInputChange={setManualMatrixPageInput}
            colSpan={5}
          />
        </table>
      </div>


      {/* Add Row Modal */}
      <Modal
        isOpen={isAddMatrixModalOpen}
        onClose={() => setIsAddMatrixModalOpen(false)}
        title="Add New Category/Entity Mapping"
        {...STANDARD_MODAL_PROPS}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const subtype = newMatrixSubtype === 'NEW_SUBTYPE' ? customSubtypeInput.trim() : newMatrixSubtype;
            const category = newMatrixCategory === 'NEW_CATEGORY' ? customCategoryInput.trim() : newMatrixCategory;
            const entity = newMatrixEntity.trim();

            if (!subtype && !category && !entity) {
              toast.error("At least one field must be filled!");
              return;
            }

            const currentRows = getMatrixRows();
            const isDuplicate = currentRows.some(row => 
              (row.subtype || '').toLowerCase() === (subtype || '').toLowerCase() &&
              (row.category || '').toLowerCase() === (category || '').toLowerCase() &&
              (row.entity || '').toLowerCase() === (entity || '').toLowerCase()
            );
            
            if (isDuplicate) {
              toast.error("This mapping already exists!");
              return;
            }

            const newRow = {
              subtype,
              category,
              entity,
              key: `k_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            handleSaveMatrix([...currentRows, newRow]);
            setIsAddMatrixModalOpen(false);
          }}
          className="space-y-4 font-sans"
        >
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
              Subtype
            </label>
            <select
              value={newMatrixSubtype}
              onChange={(e) => {
                setNewMatrixSubtype(e.target.value);
                setNewMatrixCategory('');
              }}
              className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/25 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
            >
              <option value="">-- Select Subtype --</option>
              {subClassOptions.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
              <option value="NEW_SUBTYPE">+ Add New Subtype...</option>
            </select>
            {newMatrixSubtype === 'NEW_SUBTYPE' && (
              <input
                type="text"
                placeholder="Enter New Subtype"
                value={customSubtypeInput}
                onChange={(e) => setCustomSubtypeInput(e.target.value)}
                required
                className="w-full mt-2 bg-[#faf4e5]/85 border border-[#8b4513]/25 rounded-lg h-[34px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
              Category
            </label>
            <select
              value={newMatrixCategory}
              onChange={(e) => setNewMatrixCategory(e.target.value)}
              className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/25 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
            >
              <option value="">-- Select Category --</option>
              {(newMatrixSubtype && subtypeToCategoryMap[newMatrixSubtype]
                ? (subtypeToCategoryMap[newMatrixSubtype] || [])
                : categoryOptions
              ).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="NEW_CATEGORY">+ Add New Category...</option>
            </select>
            {newMatrixCategory === 'NEW_CATEGORY' && (
              <input
                type="text"
                placeholder="Enter New Category"
                value={customCategoryInput}
                onChange={(e) => setCustomCategoryInput(e.target.value)}
                required
                className="w-full mt-2 bg-[#faf4e5]/85 border border-[#8b4513]/25 rounded-lg h-[34px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
              Entity
            </label>
            <input
              type="text"
              placeholder="Enter Entity Name (Optional)"
              value={newMatrixEntity}
              onChange={(e) => setNewMatrixEntity(e.target.value)}
              className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/25 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#8b4513] text-white font-black text-[10px] uppercase tracking-wider rounded-xl hover:scale-[1.01] active:scale-99 transition-all shadow border border-[#d4af37]/25 cursor-pointer"
          >
            Add Mapping
          </button>
        </form>
      </Modal>

      {/* Edit Row Modal */}
      <Modal
        isOpen={isEditMatrixModalOpen}
        onClose={() => setIsEditMatrixModalOpen(false)}
        title="Edit Category/Entity Mapping"
        {...STANDARD_MODAL_PROPS}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const subtype = editMatrixSubtype === 'NEW_SUBTYPE' ? editCustomSubtypeInput.trim() : editMatrixSubtype;
            const category = editMatrixCategory === 'NEW_CATEGORY' ? editCustomCategoryInput.trim() : editMatrixCategory;
            const entity = editMatrixEntity.trim();

            if (!subtype && !category && !entity) {
              toast.error("At least one field must be filled!");
              return;
            }

            const updatedRows = getMatrixRows().map(row => {
              if (row.key === editMatrixRowKey) {
                return { ...row, subtype, category, entity };
              }
              return row;
            });

            handleSaveMatrix(updatedRows);
            setIsEditMatrixModalOpen(false);
            toast.success("Mapping updated successfully!");
          }}
          className="space-y-4 font-sans"
        >
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
              Subtype
            </label>
            <select
              value={editMatrixSubtype}
              onChange={(e) => {
                setEditMatrixSubtype(e.target.value);
                setEditMatrixCategory('');
              }}
              className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/25 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
            >
              <option value="">-- Select Subtype --</option>
              {subClassOptions.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
              <option value="NEW_SUBTYPE">+ Add New Subtype...</option>
            </select>
            {editMatrixSubtype === 'NEW_SUBTYPE' && (
              <input
                type="text"
                placeholder="Enter New Subtype"
                value={editCustomSubtypeInput}
                onChange={(e) => setEditCustomSubtypeInput(e.target.value)}
                required
                className="w-full mt-2 bg-[#faf4e5]/85 border border-[#8b4513]/25 rounded-lg h-[34px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
              Category
            </label>
            <select
              value={editMatrixCategory}
              onChange={(e) => setEditMatrixCategory(e.target.value)}
              className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/25 rounded-lg h-[38px] px-2 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
            >
              <option value="">-- Select Category --</option>
              {(editMatrixSubtype && subtypeToCategoryMap[editMatrixSubtype]
                ? (subtypeToCategoryMap[editMatrixSubtype] || [])
                : categoryOptions
              ).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="NEW_CATEGORY">+ Add New Category...</option>
            </select>
            {editMatrixCategory === 'NEW_CATEGORY' && (
              <input
                type="text"
                placeholder="Enter New Category"
                value={editCustomCategoryInput}
                onChange={(e) => setEditCustomCategoryInput(e.target.value)}
                required
                className="w-full mt-2 bg-[#faf4e5]/85 border border-[#8b4513]/25 rounded-lg h-[34px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#5d4037]/80 mb-1">
              Entity
            </label>
            <input
              type="text"
              placeholder="Enter Entity Name (Optional)"
              value={editMatrixEntity}
              onChange={(e) => setEditMatrixEntity(e.target.value)}
              className="w-full bg-[#faf4e5]/80 border border-[#8b4513]/25 rounded-lg h-[38px] px-3 text-xs font-bold text-[#4b2c20] focus:outline-none focus:border-[#8b4513]/50"
            />
          </div>

          {editMatrixEntity && (
            <div className="flex flex-col border border-[#8b4513]/20 rounded-xl bg-[#faf4e5]/20 overflow-hidden mt-2">
              <div className="bg-[#8b4513]/10 border-b border-[#8b4513]/20 p-2 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-[#4b2c20] tracking-wider">
                  Related COA Accounts ({modalMatchedCOA.length})
                </span>
              </div>
              <div className="max-h-[160px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-[10px] font-sans">
                  <thead className="sticky top-0 bg-[#faf4e5] z-10 border-b border-[#8b4513]/25 shadow-sm">
                    <tr className="text-[#4b2c20] font-black uppercase tracking-wider title-font">
                      <th className="py-1.5 px-2">Type</th>
                      <th className="py-1.5 px-2">Subtype</th>
                      <th className="py-1.5 px-2">Category</th>
                      <th className="py-1.5 px-2">Entity</th>
                      <th className="py-1.5 px-2">Account Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8b4513]/10 text-stone-700 font-bold">
                    {modalMatchedCOA.length > 0 ? (
                      modalMatchedCOA.map((account, idx) => (
                        <tr key={idx} className="hover:bg-[#8b4513]/5 transition-colors">
                          <td className="py-1 px-2">{account.type}</td>
                          <td className="py-1 px-2">{account.subtype || <span className="text-stone-400 italic">None</span>}</td>
                          <td className="py-1 px-2">{account.category || <span className="text-stone-400 italic">None</span>}</td>
                          <td className="py-1 px-2 text-[#8b4513]">{account.entity}</td>
                          <td className="py-1 px-2 font-medium text-stone-600">{account.fullName}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-stone-400 italic">
                          No matching accounts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-[#8b4513] text-white font-black text-[10px] uppercase tracking-wider rounded-xl hover:scale-[1.01] active:scale-99 transition-all shadow border border-[#d4af37]/25 cursor-pointer"
          >
            Save Changes
          </button>
        </form>
      </Modal>
    </div>
  );
}
