import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import type { ColumnDef, StringOrTemplateHeader } from '@tanstack/react-table';
import { DataTable } from '../components/DataTable';
import { motion, AnimatePresence } from 'framer-motion';

type Student = {
    id: number;
    dni: string;
    first_name: string;
    last_name: string;
    enrolled_classes: string[];
    has_family: boolean;
    is_paid: boolean;
    is_late: boolean;
    amount_due: number;
    debt: number;
};

export default function StudentsPage() {
    /* data */
    const { data = [] } = useQuery<Student[]>({
        queryKey: ['students'],
        queryFn: () => fetch('api/students').then(r => r.json()),
    });

    /* UI state */
    const [q, setQ] = useState('');
    const [family, setFamily] = useState<'all' | 'yes' | 'no'>('all');
    const [selected, setSelected] = useState<Student | null>(null);
    
    /* filters */
    const rows = useMemo(() => {
        return data.filter(s => {
            const textMatch =
            s.dni.includes(q) ||
                `${s.last_name} ${s.first_name}`.toLowerCase().includes(q.toLocaleLowerCase());
            const famMatch = 
                family === 'all'
                ? true
                : family === 'yes'
                ? s.has_family
                : !s.has_family;
        return textMatch &&  famMatch;
        });
    }, [data, q, family]);

    /* columns */
    const cols: ColumnDef<Student>[] = [
        { header: 'DNI', accessorKey: 'dni' },
        { header: 'Apellido', accessorKey: 'last_name' },
        { header: 'Nombre', accessorKey: 'first_name' },
        {
            header: 'Clases',
            cell: ({ row }) => row.original.enrolled_classes.join(', '),
        },
        {
            header: 'Familia',
            cell: ({ row }) => (row.original.has_family ? 'Sí' : 'No'),
        },
    ];

    /* Render */
    return (
        <div className='p-6'>
            {/* search and filter*/}
            <div className='mb-4 flex flex-wrap gap-2'>
                <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder='Buscar por DNI o Nombre...'
                    className='grow px-3 py-1.5 rounded border'
                />
                <select
                    value={family}
                    onChange={e => setFamily(e.target.value as any)}
                    className='px-3 py-1.5 rounded border'
                >
                    <option value='all'>Familia (todos)</option>
                    <option value='yes'>Con Familia</option>
                    <option value='no'>Sin Familia</option>
                </select>
            </div>

            {/* Table with hover animation */}
            <DataTable 
                data={rows}
                columns={cols}
                onRowClick={row => setSelected(row.original)}
                rowClassName='cursor-pointer'
                rowProps={{
                    as: motion.tr,
                    whileHover: { scale: 1.01 },
                    transition: { type: 'spring', stiffness: 300, damping: 20 },
                }}
            />

            {/* Payment detail Dialog */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        className='fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelected(null)}
                    >
                    <motion.div
                        className='fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm'
                        initial={{ scale:0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        >
                            <h2 className='text-lg font-semibold mb-4'>
                                {selected.last_name} {selected.first_name} - {selected.dni}
                            </h2>
                            <ul className='space-y-1 text-sm'>
                                <li>
                                    <strong>Clases:</strong> {selected.enrolled_classes.join(', ')}
                                </li>
                                <li>
                                    <strong>Monto mensual:</strong> ${selected.amount_due}
                                </li>
                                <li>
                                    <strong>Deuda:</strong>{' '}
                                    {selected.debt > 0 ? (
                                        <span className='text-red-600'>${selected.debt}</span>
                                    ) : (
                                        '-'
                                    )}
                                </li>
                                <li>
                                    <strong>Pagado:</strong> {selected.is_paid ? 'Sí' : 'No'}
                                </li>
                                <li>
                                    <strong>Atrasado:</strong> {selected.is_late ? 'Sí' : 'No'}
                                </li>
                                <li>
                                    <strong>Familia:</strong> {selected.has_family ? 'Sí' : 'No'}
                                </li>
                            </ul>

                            <button
                                onClick={() => setSelected(null)}
                                className='mt-6 w-full rounded bg-gray-800 text-white py-2 hover:bg-gray-700'
                            >
                                Cerrar
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}