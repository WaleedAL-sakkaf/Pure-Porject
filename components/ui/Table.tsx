
import React from 'react';
import { TableColumn } from '../../types'; 
import LoadingSpinner from './LoadingSpinner'; // Import LoadingSpinner for consistency

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  tableClassName?: string;
  headerRowClassName?: string;
  bodyRowClassName?: string;
}

const Table = <T extends { id: string | number },>(
  { 
    columns, 
    data, 
    isLoading, 
    emptyMessage = "لا توجد بيانات لعرضها.", 
    onRowClick,
    tableClassName = '',
    headerRowClassName = '',
    bodyRowClassName = ''
  }: TableProps<T>
) => {
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center p-10 min-h-[200px]">
        <LoadingSpinner text="جاري تحميل البيانات..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-10">{emptyMessage}</p>;
  }

  return (
    <div className={`overflow-x-auto bg-card shadow-sm dark:shadow-md-dark rounded-lg border border-border ${tableClassName}`}>
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-slate-50 dark:bg-slate-700/50">
          <tr className={headerRowClassName}>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                scope="col"
                className={`px-4 sm:px-6 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider ${col.headerClassName || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {data.map((item, rowIndex) => (
            <tr 
              key={item.id} 
              className={`transition-colors duration-150 ease-in-out 
                          ${onRowClick ? 'cursor-pointer hover:bg-secondary-light dark:hover:bg-secondary-dark/50' : ''}
                          ${rowIndex % 2 === 0 ? 'bg-card' : 'bg-slate-50/50 dark:bg-slate-800/30'}
                          ${bodyRowClassName}`}
              onClick={() => onRowClick && onRowClick(item)}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onRowClick(item) : undefined}
            >
              {columns.map((col) => (
                <td
                  key={`${String(item.id)}-${String(col.key)}`}
                  className={`px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-foreground ${col.className || ''}`}
                >
                  {col.render ? col.render(item) : (item[col.key as keyof T] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;