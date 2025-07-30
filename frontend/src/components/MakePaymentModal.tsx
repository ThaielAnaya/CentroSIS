/* components/MakePaymentModal.tsx */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import type { Student } from '../types/student';
import type { AxiosError } from 'axios';

interface Props {
  student: Student | null;        // null → closed
  onClose: () => void;
}

export default function MakePaymentModal({ student, onClose }: Props) {
  const open = !!student;
  const qc   = useQueryClient();
  const todayISO = new Date().toISOString().slice(0, 10);

  /* fetch this month's payment row --------------------------------------- */
  const { data: payment } = useQuery({
    queryKey: ['payment', student?.id],
    enabled: open,
    queryFn: () =>
      axios
        .get(
          `/api/payments/?enrollment__student__DNI=${student!.DNI}` +
            `&cycle=M&due_date__month=${new Date().getMonth() + 1}`,
        )
        .then(r => r.data[0]), // guarantee: exactly one row
  });

  /* local editable state -------------------------------------------------- */
  const [method, setMethod] = useState<'cash' | 'transfer'>('cash');
  const [pay, setPay]       = useState('');

  /* sync when payment arrives */
  useEffect(() => {
    if (payment) {
      setMethod(payment.method);
      setPay(String(payment.amount_due));
    }
  }, [payment]);

  /* live-preview: switch method -> PATCH only method, get updated amount */
  const previewMutation = useMutation({
    mutationFn: (m: 'cash' | 'transfer') =>
      axios.patch(`/api/payments/${payment.id}/`, { method: m }),
    onSuccess: ({ data }) => setPay(String(data.amount_due)),
  });

  const saveMutation = useMutation<
    unknown,
    AxiosError<{ [k: string]: any }>,
    void
    >({
    mutationFn: () =>
      axios.patch(`/api/payments/${payment.id}/`, {
        method,
        amount_paid: Number(pay),
        paid_on: todayISO,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['payments-simple'] });
      onClose();
    },
    onError: err => alert('Error: ' + JSON.stringify(err.response?.data)),
  });

  if (!open || !payment) return null;

  /* --------------------------- UI -------------------------------------- */
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md rounded bg-white p-6 shadow-lg"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <h2 className="mb-4 text-xl font-semibold">
            Pago – {student!.last_name} {student!.first_name}
          </h2>

          {/* method toggle */}
          <div className="mb-4 flex gap-4">
            {(['cash', 'transfer'] as const).map(m => (
              <label key={m} className="flex items-center gap-1">
                <input
                  type="radio"
                  value={m}
                  checked={method === m}
                  onChange={() => {
                    setMethod(m);
                    previewMutation.mutate(m);
                  }}
                />
                {m === 'cash' ? 'Efectivo' : 'Transferencia'}
              </label>
            ))}
          </div>

          {/* amount */}
          <label className="block text-sm mb-2">
            Monto a pagar
            <input
              className="input mt-1 w-full"
              type="number"
              min="0"
              step="1"
              value={pay}
              onChange={e => setPay(e.target.value)}
            />
          </label>

          {/* summary */}
          <p className="mb-4 text-sm">
            <strong>Adeudado este mes:</strong> ${payment.amount_due}
            <br />
            <strong>Saldo a favor antes de pagar:</strong> $
            {student!.credit_balance}
          </p>

          {/* actions */}
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded px-3 py-1 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="rounded bg-emerald-600 px-4 py-1 text-white disabled:bg-emerald-300"
            >
              {saveMutation.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
