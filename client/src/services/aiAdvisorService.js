import { supabase } from '../lib/supabaseClient';

/**
 * Fetches the deterministic financial health packet directly from the Supabase RPC.
 * @param {string} profileId 
 * @returns {Promise<Object>} The JSON packet
 */
export const fetchFinancialHealthPacket = async (profileId) => {
  if (!profileId) throw new Error('Profile ID is required to fetch financial health packet.');
  
  const { data, error } = await supabase.rpc('get_financial_health_report', { p_profile_id: profileId });
  
  if (error) {
    console.error('Error fetching financial health packet:', error);
    throw error;
  }
  
  return data;
};

/**
 * Stub for future integration with the AI LLM (Backend / Edge Function).
 * @param {Object} contextJson The financial packet
 * @param {string} userQuery Optional user question
 * @returns {Promise<string>} The generated advice
 */
export const generateAdvice = async (contextJson, userQuery = '') => {
  console.log('Context Packet Sent to AI:', contextJson);
  console.log('User Query:', userQuery);
  
  // Future implementation: fetch to /api/ai/advisor or Supabase Edge Function
  // return fetch('/api/ai/advisor', { body: { context: contextJson, query: userQuery } })
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("I am your Royal Advisor. Your financial packet has been processed, but the AI module is not yet linked. Check your browser console to inspect the data packet.");
    }, 1500);
  });
};
