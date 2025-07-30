/* src/components/DataTable.tsx */
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import type { HTMLMotionProps } from 'framer-motion';

/* -------------------------------------------------------------------------- */
/* Types */

export type RowProps = HTMLMotionProps<'tr'> & { as?: any };

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  onRowClick?: (row: any) => void;
  rowClassName?: string;
  rowProps?: RowProps;
  /** optional extractor so React-Table uses a stable id (defaults to index) */
  getRowId?: (row: T, index: number) => string;
}

/* -------------------------------------------------------------------------- */
/* Component */

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  rowClassName,
  rowProps,
  getRowId,
}: DataTableProps<T>) {
  const table = useReactTable<T>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
  });

  const RowTag: any = rowProps?.as ?? 'tr';

  return (
    <table className="min-w-full text-sm">
      <thead>
        {table.getHeaderGroups().map(hg => (
          <tr key={hg.id}>
            {hg.headers.map(h => (
              <th key={h.id} className="border-b p-2 text-left font-semibold">
                {flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>

      <tbody>
        {table.getRowModel().rows.map(row => {
          const mergedClass = [
            rowClassName,
            rowProps?.className,
          ]
            .filter(Boolean)
            .join(' ');

          const handleClick = (e: React.MouseEvent) => {
            rowProps?.onClick?.(e as never); // keep existing
            onRowClick?.(row);
          };

          return (
            <RowTag
              key={row.id}
              {...rowProps}
              className={mergedClass}
              onClick={handleClick}
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="border-b p-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </RowTag>
          );
        })}
      </tbody>
    </table>
  );
}
