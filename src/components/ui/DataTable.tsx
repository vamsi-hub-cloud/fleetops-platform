import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './index';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  hide?: 'sm' | 'md' | 'lg';
  align?: 'right';
}
const HIDE = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' };

export function DataTable<T extends { id: string }>({ rows, columns, onRowClick, pageSize = 8, empty }: {
  rows: T[]; columns: Column<T>[]; onRowClick?: (row: T) => void; pageSize?: number; empty: ReactNode;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  useEffect(() => { if (page >= pages) setPage(0); }, [pages, page]);

  if (!rows.length) return <div className="rounded-lg border border-slate-200 bg-white">{empty}</div>;
  const slice = rows.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn('px-4 py-2.5', c.hide && HIDE[c.hide], c.align === 'right' && 'text-right')}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slice.map((r) => (
              <tr key={r.id} onClick={() => onRowClick?.(r)}
                onKeyDown={(e) => e.key === 'Enter' && onRowClick?.(r)} tabIndex={onRowClick ? 0 : undefined}
                className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-brand-50/50 focus-visible:bg-brand-50/50')}>
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-4 py-3 align-middle', c.hide && HIDE[c.hide], c.align === 'right' && 'text-right')}>{c.render(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
          <span>Page {page + 1} of {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button size="sm" variant="secondary" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
