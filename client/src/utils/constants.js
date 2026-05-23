export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const TRANSACTION_TYPES = [
  'Earning', 
  'Income', 
  'Expense', 
  'Payment'
];

export const PAYMENT_METHODS = [
  'Debit', 
  'Credit'
];

export const RECORD_STATUSES = [
  'Paid', 
  'Unpaid',
  'Overdue'
];

export const QUEST_TYPES = [
  'Monsters & Bounties',
  'Tributes',
  'Production'
];

export const toDbQuestType = (uiType) => {
  if (uiType === 'Monsters & Bounties') return 'Expedition';
  if (uiType === 'Tributes') return 'Bounty';
  return uiType;
};

export const toUiQuestType = (dbType) => {
  if (dbType === 'Expedition') return 'Monsters & Bounties';
  if (dbType === 'Bounty') return 'Tributes';
  return dbType;
};
