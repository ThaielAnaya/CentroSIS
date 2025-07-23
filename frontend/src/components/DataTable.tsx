import { flexRender, useReactTable, getCoreRowModel } from '@tanstack/react-table';
import type { HTMLMotionProps } from 'framer-motion';

/* type RowProps = React.HTMLAttributes<HTMLTableRowElement> & { as?: any }; */

type RowProps = HTMLMotionProps<'tr'> & { as?: any };

export function DataTable<T>({
    data,
    columns,
    onRowClick,
    rowClassName,
    rowProps,
}: {
    data: T[];
    columns: any[];
    onRowClick?: (row: any) => void;
    rowClassName?: string;
    rowProps?: RowProps;
}) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const RowTag = rowProps?.as ?? 'tr';

    return (
        <table className='min-w-full text-sm'>
            <thead>
                {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                        {hg.headers.map(h => (
                            <th key={h.id} className='p-2 border-b font-semibold text-left'>
                                {flexRender(h.column.columnDef.header, h.getContext())}
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody>
                {table.getRowModel().rows.map(row => (
                    <RowTag
                        key={row.id}
                        {...rowProps}
                        className={`${rowClassName ?? ''} ${rowProps?.className ?? ''} `}
                        onClick={() => onRowClick?.(row)}
                    >
                        {row.getVisibleCells().map(cell => (
                            <td key={cell.id} className='p-2 border-b'>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                        ))}
                    </RowTag>
                ))}
            </tbody>
        </table>
    );
}