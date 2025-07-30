/* src/pages/StudentsPage.tsx */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useState,
  useMemo,
  useCallback,
  useDeferredValue,
  Fragment,
} from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../components/DataTable';
import { motion, AnimatePresence } from 'framer-motion';
import StudentModal from '../components/NewStudentModal';
import EditStudentModal from '../components/EditStudentModal';
import type { Student } from '../types/student';

/* -------------------------------------------------------------------------- */

export default function StudentsPage() {
  const qc = useQueryClient();

  /* hooks declared INSIDE component --------------------------------------- */
  const [editTarget, setEditTarget] = useState<Student | null>(null);

  /* server data ----------------------------------------------------------- */
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => fetch('/api/students/').then(r => r.json()),
  });

  /* UI state -------------------------------------------------------------- */
  const [q, setQ] = useState('');
  const [family, setFamily] = useState<'all' | 'yes' | 'no'>('all');
  const [selected, setSelected] = useState<Student | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const deferredQ = useDeferredValue(q);

  /* derived rows ---------------------------------------------------------- */
  const rows = useMemo(() => {
    const norm = deferredQ.toLowerCase();
    return students.filter(s => {
      const fullName = `${s.last_name} ${s.first_name}`.toLowerCase();
      const txtMatch = s.DNI.includes(deferredQ) || fullName.includes(norm);
      const famMatch =
        family === 'all'
          ? true
          : family === 'yes'
          ? s.has_family
          : !s.has_family;
      return txtMatch && famMatch;
    });
  }, [students, deferredQ, family]);

  /* actions --------------------------------------------------------------- */
  const modifyStudent = useCallback((st: Student) => setEditTarget(st), []);
  const addPayment = useCallback(
    (st: Student) => console.log('payment for', st.id),
    []
  );

  /* columns --------------------------------------------------------------- */
  const cols: ColumnDef<Student>[] = useMemo(
    () => [
      { header: 'DNI', accessorKey: 'DNI' },
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
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={e => {
                e.stopPropagation();
                modifyStudent(row.original);
              }}
              className="rounded bg-amber-500 px-2 py-0.5 text-xs text-white hover:bg-amber-400"
            >
              Modificar
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                addPayment(row.original);
              }}
              className="rounded bg-emerald-600 px-2 py-0.5 text-xs text-white hover:bg-emerald-500"
            >
              Pagar
            </button>
          </div>
        ),
      },
    ],
    [modifyStudent, addPayment]
  );

  /* after create ---------------------------------------------------------- */
  const handleCreated = useCallback(() => {
    setShowCreate(false);
    qc.invalidateQueries({ queryKey: ['students'] });
  }, [qc]);

  /* ---------------------------------------------------------------------- */
  return (
    <div className="p-6">
      {/* search / filter / add */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar por DNI o Nombre…"
          className="grow rounded border px-3 py-1.5"
        />
        <select
          value={family}
          onChange={e => setFamily(e.target.value as any)}
          className="rounded border px-3 py-1.5"
        >
          <option value="all">Familia (todos)</option>
          <option value="yes">Con Familia</option>
          <option value="no">Sin Familia</option>
        </select>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-500"
        >
          + Agregar estudiante
        </button>
      </div>

      {/* table */}
      {isLoading ? (
        <p>Cargando…</p>
      ) : (
        <DataTable
          data={rows}
          columns={cols}
          getRowId={row => String(row.id)}
          onRowClick={row => setSelected(row.original)}
          rowClassName="cursor-pointer"
          rowProps={{
            as: motion.tr,
            whileHover: { scale: 1.01 },
            transition: { type: 'spring', stiffness: 300, damping: 20 },
          }}
        />
      )}

      {/* detail dialog */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="max-w-sm rounded bg-white p-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="mb-4 text-lg font-semibold">
                {selected.last_name} {selected.first_name} – {selected.DNI}
              </h2>
              <ul className="space-y-1 text-sm">
                <li>
                  <strong>Clases:</strong>{' '}
                  {selected.enrolled_classes.join(', ')}
                </li>
                <li>
                  <strong>Monto mensual:</strong> ${selected.amount_due}
                </li>
                <li>
                  <strong>Deuda:</strong>{' '}
                  {selected.debt > 0 ? (
                    <span className="text-red-600">${selected.debt}</span>
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

              <div className="mt-6 grid grid-cols-2 gap-2">
                <button
                  className="rounded bg-amber-500 py-2 text-white hover:bg-amber-400"
                  onClick={() => modifyStudent(selected)}
                >
                  Modificar
                </button>
                <button
                  className="rounded bg-emerald-600 py-2 text-white hover:bg-emerald-500"
                  onClick={() => addPayment(selected)}
                >
                  Pagar
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="col-span-2 rounded bg-gray-800 py-2 text-white hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* modals */}
      <StudentModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
      <EditStudentModal
        student={editTarget}
        onClose={() => setEditTarget(null)}
      />
    </div>
  );
}
