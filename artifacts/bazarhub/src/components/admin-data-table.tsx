import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  exportValue?: (item: T) => string;
}

export interface FilterOption {
  label: string;
  key: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
}

export interface AdminDataTableProps<T> {
  title: string;
  subtitle?: string;
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  filters?: FilterOption[];
  onAddClick?: () => void;
  addLabel?: string;
  isDark?: boolean;
  exportFileName?: string;
  rowKey?: (item: T) => string | number;
}

export function AdminDataTable<T extends Record<string, any>>({
  title,
  subtitle,
  data,
  columns,
  searchPlaceholder = 'Search records...',
  filters = [],
  onAddClick,
  addLabel = 'Add New',
  isDark = true,
  exportFileName = 'report',
  rowKey,
}: AdminDataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 1. Filter & Search
  const filteredData = useMemo(() => {
    let result = [...data];

    if (search.trim()) {
      const query = search.toLowerCase().trim();
      result = result.filter((item) =>
        Object.values(item).some((val) => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        })
      );
    }

    return result;
  }, [data, search]);

  // 2. Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let cmp = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        cmp = valA - valB;
      } else {
        cmp = String(valA).localeCompare(String(valB));
      }

      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortOrder]);

  // 3. Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // 4. Export to Printable PDF HTML helper
  const handleExportPDF = () => {
    const printableRows = sortedData.map((item) => {
      return columns
        .map((col) => {
          let text = '';
          if (col.exportValue) {
            text = col.exportValue(item);
          } else if (col.accessorKey) {
            text = String(item[col.accessorKey] ?? '');
          }
          return `<td style="padding:8px 12px; border-bottom:1px solid #e2e8f0;">${text}</td>`;
        })
        .join('');
    });

    const headers = columns
      .map(
        (col) =>
          `<th style="padding:10px 12px; text-align:left; background:#f8fafc; border-bottom:2px solid #cbd5e1; font-size:12px; font-weight:bold;">${col.header}</th>`
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} Export</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; margin: 30px; color: #0f172a; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            p { color: #64748b; font-size: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .footer { margin-top: 30px; text-align: right; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <h1>BOLOBAN SHOP — ${title}</h1>
          <p>Generated Report • ${new Date().toLocaleString()} • Total Records: ${sortedData.length}</p>
          <table>
            <thead><tr>${headers}</tr></thead>
            <tbody>${printableRows.map((r) => `<tr>${r}</tr>`).join('')}</tbody>
          </table>
          <div class="footer">BOLOBAN SHOP Management System</div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const cardBg = isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900 shadow-sm';
  const inputBg = isDark ? 'border-slate-800 bg-slate-950 text-white focus:border-amber-400' : 'border-slate-300 bg-white text-slate-900 focus:border-amber-500';
  const tableHeaderBg = isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-700';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`rounded-2xl border p-6 ${cardBg}`}>
      {/* Header controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          {subtitle && <p className={`mt-0.5 text-xs ${textSub}`}>{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors ${
              isDark ? 'border-slate-800 bg-slate-950 text-amber-400 hover:bg-slate-800' : 'border-slate-300 bg-slate-50 text-amber-600 hover:bg-slate-100'
            }`}
          >
            <Download size={14} /> Export PDF
          </button>

          {onAddClick && (
            <button
              onClick={onAddClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400"
            >
              <Plus size={16} /> {addLabel}
            </button>
          )}
        </div>
      </div>

      {/* Toolbar Search & Filters */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSub}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className={`h-9 w-full rounded-xl border pl-9 pr-3 text-xs outline-none ${inputBg}`}
          />
        </div>

        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal size={14} className={textSub} />
            {filters.map((f) => (
              <select
                key={f.key}
                value={f.value}
                onChange={(e) => {
                  f.onChange(e.target.value);
                  setCurrentPage(1);
                }}
                className={`h-9 rounded-xl border px-3 text-xs font-bold outline-none ${inputBg}`}
              >
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/20">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className={`border-b ${tableHeaderBg}`}>
              {columns.map((col, idx) => {
                const isSortable = col.sortable && col.accessorKey;
                return (
                  <th
                    key={idx}
                    onClick={() => isSortable && handleSort(String(col.accessorKey))}
                    className={`p-3.5 font-bold ${isSortable ? 'cursor-pointer select-none hover:text-amber-400' : ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {isSortable && <ArrowUpDown size={12} className={sortKey === col.accessorKey ? 'text-amber-400' : 'opacity-40'} />}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, rIdx) => {
                const key = rowKey ? rowKey(item) : item.id ?? rIdx;
                return (
                  <tr key={key} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className="p-3.5">
                        {col.cell ? col.cell(item) : col.accessorKey ? String(item[col.accessorKey] ?? '') : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className={`p-8 text-center text-xs font-bold ${textSub}`}>
                  No records matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs font-bold">
        <div className={`flex items-center gap-2 ${textSub}`}>
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className={`h-8 rounded-lg border px-2 text-xs font-bold outline-none ${inputBg}`}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>per page • Total {sortedData.length} records</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={textSub}>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className={`rounded-lg border p-1.5 transition-colors disabled:opacity-30 ${
                isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className={`rounded-lg border p-1.5 transition-colors disabled:opacity-30 ${
                isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

