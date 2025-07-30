/* components/NewStudentModal.tsx */
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import axios from 'axios';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

/* helpers ---------------------------------------------------------------- */
interface EnrollmentForm { option: string; start: string }
interface FormState {
  DNI: string;
  cuil: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  contact: string;
  is_family_member: boolean;
  enrollments: EnrollmentForm[];
}

/* component -------------------------------------------------------------- */
export default function NewStudentModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>({
    DNI: '',
    cuil: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    contact: '',
    is_family_member: false,
    enrollments: [{ option: '', start: '' }],
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /* class options */
  const { data: classOptions = [] } = useQuery({
    queryKey: ['class-options'],
    enabled : open,
    queryFn : () =>
      axios.get('/api/class-options/').then(r => r.data as any[]),
  });

  /* mutation */
  const createStudent = useMutation<
    unknown,
    AxiosError<{ [k: string]: string[] }>,
    FormState
  >({
    mutationFn : payload => axios.post('/api/students/', payload),
    onSuccess  : () => {
      onCreated?.();
      setMsg({ ok: true, text: 'Alumno creado correctamente!' });
    },
    onError    : err => {
      const detail = err.response?.data ?? { error: ['Error inesperado.'] };
      const flat   = Object.entries(detail)
        .map(([k, v]) => `${k}: ${(v as string[]).join(' ')}`)
        .join('\n');
      setMsg({ ok: false, text: flat });
    },
  });

  /* helpers */
  const h =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value });

  const hEnr = (i: number, k: keyof EnrollmentForm) => (e: any) => {
    const next = [...form.enrollments];
    next[i]    = { ...next[i], [k]: e.target.value };
    setForm({ ...form, enrollments: next });
  };

  /* submit */
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!/^\d+$/.test(form.DNI))  return setMsg({ ok: false, text: 'DNI numérico' });
    if (!/^\d{11}$/.test(form.cuil)) return setMsg({ ok: false, text: 'CUIL debe tener 11 dígitos' });
    createStudent.mutate(form);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Nuevo alumno</h2>

        <form onSubmit={submit} className="space-y-4">
          {/* basic ------------------------------------------------------- */}
          <div className="grid grid-cols-2 gap-4">
            <input className="input" placeholder="DNI" value={form.DNI} onChange={h('DNI')} required />
            <input className="input" placeholder="CUIL (11 dígitos)" value={form.cuil} onChange={h('cuil')} required pattern="\d{11}" />
            <input className="input" placeholder="Nombre" value={form.first_name} onChange={h('first_name')} required />
            <input className="input" placeholder="Apellido" value={form.last_name} onChange={h('last_name')} required />
            <input className="input" type="date" value={form.birth_date} onChange={h('birth_date')} required />
            <input className="input" placeholder="Contacto (tel/email)" value={form.contact} onChange={h('contact')} />
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_family_member} onChange={h('is_family_member')} />
            Miembro de familia
          </label>

          {/* enrolments -------------------------------------------------- */}
          <div className="space-y-2">
            <p className="font-medium">Clases</p>
            {form.enrollments.map((enr, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-4">
                <select className="input" value={enr.option} onChange={hEnr(idx, 'option')} required>
                  <option value="">– clase –</option>
                  {classOptions.map((o: any) => (
                    <option key={o.id} value={o.id}>
                      {o.class_name} · {o.weekly_sessions}×sem
                    </option>
                  ))}
                </select>
                <input className="input" type="date" value={enr.start} onChange={hEnr(idx, 'start')} required />
              </div>
            ))}
            <button type="button" onClick={() => setForm({ ...form, enrollments:[...form.enrollments,{option:'',start:''}]})}
              className="rounded bg-gray-200 px-2 py-1 text-sm hover:bg-gray-300">
              + Añadir clase
            </button>
          </div>

          {/* message */}
          {msg && <p className={`whitespace-pre-wrap text-sm ${msg.ok ? 'text-green-600':'text-red-600'}`}>{msg.text}</p>}

          {/* actions */}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded px-3 py-1 hover:bg-gray-100">Cancelar</button>
            <button disabled={createStudent.isPending}
              className="rounded bg-blue-600 px-3 py-1 text-white disabled:bg-blue-300">
              {createStudent.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
