import React from 'react';

export default function TableSortHeader({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
  className = ""
}) {
  const isActive = sortField === field;
  return (
    <th
      className={`py-1.5 px-2 cursor-pointer hover:bg-[#8b4513]/10 select-none transition-colors ${isActive ? 'bg-[#8b4513]/5' : ''} ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive && (
          <span className="text-[#8b4513] text-[8px]">
            {sortDirection === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </div>
    </th>
  );
}
