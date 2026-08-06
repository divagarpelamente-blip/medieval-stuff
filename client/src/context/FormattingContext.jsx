import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import dayjs from 'dayjs';

const FormattingContext = createContext();

export const FormattingProvider = ({ children }) => {
  // Mock user for now, in a real app you'd get this from your AuthContext
  const user = { id: 'd8bd5b93-4bd8-4077-863e-8a28f9ab3b6e' };
  
  const [prefs, setPrefs] = useState({
    dateFormat: 'YYYY-MM-DD',
    numberFormat: 'EU',
    currencySymbol: '€',
    currencyType: 'fiat',
    negativeFormat: 'minus'
  });

  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    if (user?.id) {
      const loadPrefs = async () => {
        setIsHydrating(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('date_format, number_format, currency_symbol, negative_format')
            .eq('id', user.id)
            .single();

          if (data && !error) {
            setPrefs({
              dateFormat: data.date_format || 'YYYY-MM-DD',
              numberFormat: data.number_format || 'EU',
              currencySymbol: data.currency_symbol || '€',
              currencyType: ['🪙', '💎'].includes(data.currency_symbol) ? 'gaming' : 'fiat',
              negativeFormat: data.negative_format || 'minus'
            });
          }
        } catch (err) {
          console.error('Failed to load user formatting preferences:', err);
        } finally {
          setIsHydrating(false);
        }
      };
      
      loadPrefs();
    } else {
      setIsHydrating(false);
    }
  }, [user?.id]);

  const updatePrefs = async (newPrefs) => {
    setPrefs(prev => ({ ...prev, ...newPrefs }));
    
    // Optimistic UI update, then sync to DB
    try {
      const { error } = await supabase.rpc('update_user_formatting_prefs', {
          p_profile_id: user?.id || 'd8bd5b93-4bd8-4077-863e-8a28f9ab3b6e',
          p_date_format: newPrefs.dateFormat,
          p_number_format: newPrefs.numberFormat,
          p_currency_symbol: newPrefs.currencySymbol,
          p_negative_format: newPrefs.negativeFormat
      });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences: ' + error.message);
    }
  };

  return (
    <FormattingContext.Provider value={{ prefs, updatePrefs, isHydrating }}>
      {children}
    </FormattingContext.Provider>
  );
};

export const useFormatting = () => useContext(FormattingContext);

export const formatCurrency = (amount, prefs) => {
  const isEU = prefs.numberFormat === 'EU';
  const formatter = new Intl.NumberFormat(isEU ? 'pt-PT' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  const isNegative = amount < 0;
  let numericString = formatter.format(Math.abs(amount));
  
  if (isNegative) {
    if (prefs.negativeFormat === 'parentheses') {
      numericString = `(${numericString})`;
    } else {
      numericString = `-${numericString}`;
    }
  }

  if (prefs.currencyType === 'gaming') {
    return `${numericString} ${prefs.currencySymbol}`;
  } else {
    return isEU ? `${numericString} ${prefs.currencySymbol}` : `${prefs.currencySymbol}${numericString}`;
  }
};

export const formatNumber = (value, prefs) => {
  const isEU = prefs.numberFormat === 'EU';
  let formattedNumber = new Intl.NumberFormat(isEU ? 'pt-PT' : 'en-US').format(value);
  
  const isNegative = value < 0;
  if (isNegative && prefs.negativeFormat === 'parentheses') {
    formattedNumber = `(${new Intl.NumberFormat(isEU ? 'pt-PT' : 'en-US').format(Math.abs(value))})`;
  }
  
  return formattedNumber;
};

export const formatDate = (dateString, prefs) => {
  if (!dateString) return '';
  return dayjs(dateString).format(prefs.dateFormat);
};
