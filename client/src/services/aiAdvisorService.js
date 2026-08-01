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
 * Calls the Supabase Edge Function to get AI advice based on the context packet.
 * Provides a graceful fallback if the Edge Function fails or is not deployed.
 * @param {Object} contextJson The financial packet
 * @param {string} userQuery Optional user question
 * @param {Array} conversationHistory Array of previous messages [{role, content}]
 * @returns {Promise<string>} The generated advice
 */
export const generateAdvice = async (contextJson, userQuery = '', conversationHistory = []) => {
  try {
    const { data, error } = await supabase.functions.invoke('chat_advisor', {
      body: { contextJson, userQuery, conversationHistory }
    });

    if (error) throw error;
    return data.advice;
  } catch (err) {
    console.error('Error invoking chat_advisor Edge Function:', err);
    console.log('Falling back to local mock response...');
    
    // Graceful fallback mock for local testing without deployed function
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("Alas, my Lord, the magical conduit to my scrying orb (Edge Function) seems to be disconnected. However, looking at your Context Packet, I see you are maintaining a watchful eye on your Kingdom's vaults. How else may I assist you?");
      }, 1500);
    });
  }
};
