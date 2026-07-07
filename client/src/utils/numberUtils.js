export const formatVal = (val) => {
  const formatted = Math.abs(val).toLocaleString();
  return (val < 0 ? '-' : '') + formatted;
};