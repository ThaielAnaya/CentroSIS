/* components/EditStudentModal.tsx */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import type { Student } from '../types/student.ts';
import { api } from '../lib/api'

interface Props {
  student: Student | null;          // null = closed
  onClose: () => void;
}

type Enrollment = {
  id?: number;          // missing → brand-new
  option: string;       // FK id
  start: string;        // YYYY-MM-DD
};

type FormState = {
  DNI: string;
  cuil: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  contact: string;
  active: boolean;
  is_family_member: boolean;
  enrollments: Enrollment[];
};

export default function EditStudentModal({ student, onClose }: Props) {
  const qc = useQueryClient();
  const open = !!student;
  /* load class options once ------------------------------------------------ */
  const { data: classOptions = [] } = useQuery({
    queryKey: ['class-options'],
    queryFn: () => api.get('/class-options/').then(r => r.data),
    enabled: open,
  });

  /* initialise form when modal opens -------------------------------------- */
  const [form, setForm] = useState<FormState | null>(null);
  useEffect(() => {
    if (student) {
      setForm({
        DNI: student.DNI,
        cuil: student.cuil,
        first_name: student.first_name,
        last_name:  student.last_name,
        birth_date: student.birth_date,
        contact:    student.contact ?? '',
        is_family_member: student.has_family,
        active: student.active,
        enrollments: [],
      });
    }
  }, [student]);

  const { data: enrolments = [], isSuccess } = useQuery({
  queryKey: ['enrolments', student?.id],
  enabled: open && !!student?.DNI,
  queryFn: () =>
    api
      .get(`/api/enrollments/?student__DNI=${student!.DNI}`)
      .then(r =>
        r.data as { id: number; option: number; start: string }[],
      ),
    });

    /* copy them into the form when they arrive ----------------------------- */
    useEffect(() => {
    if (!isSuccess || !form) return;

    setForm(f => ({
        ...f!,
        enrolments: enrolments.map(e => ({
        id: e.id,
        option: String(e.option),
        start: e.start,
        })),
    }));
    }, [isSuccess, enrolments, form]);

  /* -------- helpers ------------------------------------------------------ */
  const handle = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => (f ? { ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value } : f));
  };

  const handleEnr = (idx: number, field: keyof Enrollment) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => {
      if (!f) return f;
      const next = [...f.enrollments];
      next[idx] = { ...next[idx], [field]: e.target.value };
      return { ...f, enrollments: next };
    });

  const addEnrollment = () =>
    setForm(f => (f ? { ...f, enrollments: [...f.enrollments, { option: '', start: '' }] } : f));

  const removeEnrollment = (idx: number) =>
    setForm(f => (f ? { ...f, enrollments: f.enrollments.filter((_, i) => i !== idx) } : f));

  /* -------- mutations ---------------------------------------------------- */
  const patchStudent = useMutation({
    mutationFn: (payload: Partial<FormState>) => api.patch(`/students/${student!.id}/`, payload),
  });
  const postEnrollment = useMutation({
    mutationFn: (e: Enrollment) =>
        api.post('/enrollments/', { ...e, student: student!.id }),
    });

  const deleteEnrollment = useMutation({
    mutationFn: (id: number) =>
        api.delete(`/enrollments/${id}/`),
    });
  /* -------- submit ------------------------------------------------------- */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    /* client-side DNI numeric check */
    if (!/^\d+$/.test(form.DNI)) return alert('DNI debe contener solo números');
    if (!/^\d+$/.test(form.DNI))   return alert('DNI numérico');
    if (!/^\d{11}$/.test(form.cuil)) return alert('CUIL debe tener 11 dígitos');

    const { enrollments: _discard, ...toPatch } = form;   // drop 'enrollments'
    await patchStudent.mutateAsync(toPatch);

    /* confirmation */
    if (!confirm('Guardar cambios?')) return;

    try {
      await patchStudent.mutateAsync(toPatch);
      /* enrolments diff ---------------------------------------------------- */
      const originalIds = new Set(form.enrollments.filter(e => e.id).map(e => e.id as number));
      /* deletions first */
      const { data: current } = await api.get(`/enrollments/?student__DNI=${student!.DNI}`);
      for (const enr of current) if (!originalIds.has(enr.id)) await deleteEnrollment.mutateAsync(enr.id);
      /* additions */
      for (const e of form.enrollments) if (!e.id) await postEnrollment.mutateAsync(e);

      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['enrollments', student!.id] });
      onClose();
    } catch (err) {
      const msg = (err as AxiosError).response?.data;
      alert('Error: ' + JSON.stringify(msg));
    }
  };

  if (!open || !form) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.form
          onClick={e => e.stopPropagation()}
          onSubmit={submit}
          className="w-full max-w-lg rounded bg-white p-6 shadow-lg"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <h2 className="mb-4 text-xl font-semibold">Editar alumno</h2>

          {/* basic --------------------------------------------------------- */}
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="DNI" value={form.DNI} onChange={handle('DNI')} required />
            <input className="input" placeholder="CUIL (11)" value={form.cuil} onChange={handle('cuil')} required pattern="\d{11}" />
            <input className="input" placeholder="Nombre" value={form.first_name} onChange={handle('first_name')} required />
            <input className="input" placeholder="Apellido" value={form.last_name} onChange={handle('last_name')} required />
            <input className="input" type="date" value={form.birth_date} onChange={handle('birth_date')} required />
            <input className="input" placeholder="Contacto" value={form.contact} onChange={handle('contact')} />
          </div>

          <label className="mt-2 flex items-center gap-2">
            <input type="checkbox" checked={form.active}
                   onChange={handle('active')} />
            Activo
          </label>

          <label className="mt-2 flex items-center gap-2">
            <input type="checkbox" checked={form.is_family_member} onChange={handle('is_family_member')} />
            Miembro de familia
          </label>

          {/* enrolments ---------------------------------------------------- */}
          <p className="mt-4 font-medium">Clases</p>
          <div className="space-y-2">
            {form.enrollments.map((enr, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_auto] gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <select className="input" value={enr.option} onChange={handleEnr(idx, 'option')} required>
                    <option value="">– clase –</option>
                    {classOptions.map((o: any) => (
                      <option key={o.id} value={o.id}>
                        {o.class_name} · {o.weekly_sessions}×sem
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    type="date"
                    value={enr.start}
                    onChange={handleEnr(idx, 'start')}
                    required
                    disabled={!!enr.id /* existing rows: date locked */}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeEnrollment(idx)}
                  className="rounded bg-red-600 px-2 text-xs text-white hover:bg-red-500"
                >
                  ✕
                </button>
              </div>
            ))}

            <button type="button" onClick={addEnrollment} className="rounded bg-gray-200 px-2 py-1 text-sm hover:bg-gray-300">
              + Añadir clase
            </button>
          </div>

          {/* actions ------------------------------------------------------- */}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded px-3 py-1 hover:bg-gray-100">
              Cancelar
            </button>
            <button
              disabled={patchStudent.isPending}
              className="rounded bg-blue-600 px-3 py-1 text-white disabled:bg-blue-300"
            >
              {patchStudent.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}