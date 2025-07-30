import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import axios from "axios";

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated?: () => void;
}

/* Helpers */

interface EnrollmentForm {
    option: string;
    start: string;
}

interface FormState {
    DNI: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    is_family_member: boolean;
    enrollments: EnrollmentForm[];
}

/* Component */

export default function StudentModal({ open, onClose, onCreated }: Props) {
    const [form, setForm] = useState<FormState>({
        DNI: "",
        first_name: "",
        last_name: "",
        birth_date: "",
        is_family_member: false,
        enrollments: [{ option: '', start: '' }],
    });

    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
        null
    );

    const { data: classOptions = [] } = useQuery({
        queryKey: ["class-options"],
        queryFn: () =>
            axios
                .get("/api/class-options/")
                .then((r) => r.data as { id: number; klass: number; weekly_sessions: number; class_name: string 
                }[]),
        enabled: open,
    });

    const createStudent = useMutation<
        unknown,
        AxiosError<{ [k: string]: string[] }>,
        FormState
    >({
        mutationFn: (payload) => axios.post("api/students/", payload),
        onSuccess: () => {
            onCreated?.();
            setMessage({ ok: true, text: "Alumno creado correctamente!" });
        },
        onError: (err) => {
            const detail = 
                err.response?.data ?? { error: ["Error, por favor intenta de vuelta. "]};
            const flat = Object.entries(detail)
                .map(([k, v]) => `${k}: ${(v as string[]).join(" ")}`)
                .join("\n");
            setMessage({ ok: false, text: flat });
        },
    });

    const handleChange = 
        (field: keyof FormState) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
            setForm({ ...form, [field]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

    const handleEnrollmentChange = 
    (idx: number, field: keyof EnrollmentForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const next = [...form.enrollments];
        next[idx] = { ...next[idx], [field]: e.target.value };
        setForm({ ...form, enrollments: next });
    };

    const addEnrollment = () =>
        setForm({
            ...form,
            enrollments: [...form.enrollments, { option: "", start: "" }],
        });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        createStudent.mutate(form);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg rounded bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-semibold">Create new student</h2>

                <form onSubmit={submit} className="space-y-4">
                {/* basic info */}
                <div className="grid grid-cols-2 gap-4">
                    <input
                    required
                    className="input"
                    placeholder="DNI"
                    value={form.DNI}
                    onChange={handleChange("DNI")}
                    />
                    <input
                    required
                    className="input"
                    placeholder="Birth date (YYYY-MM-DD)"
                    type="date"
                    value={form.birth_date}
                    onChange={handleChange("birth_date")}
                    />
                    <input
                    required
                    className="input"
                    placeholder="First name"
                    value={form.first_name}
                    onChange={handleChange("first_name")}
                    />
                    <input
                    required
                    className="input"
                    placeholder="Last name"
                    value={form.last_name}
                    onChange={handleChange("last_name")}
                    />
                </div>

                <label className="flex items-center gap-2">
                    <input
                    type="checkbox"
                    checked={form.is_family_member}
                    onChange={handleChange("is_family_member")}
                    />
                    Family member
                </label>

                {/* enrollments */}
                <div className="space-y-2">
                    <p className="font-medium">Enrollments</p>
                    {form.enrollments.map((enr, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-4">
                        <select
                        required
                        className="input"
                        value={enr.option}
                        onChange={handleEnrollmentChange(idx, "option")}
                        >
                        <option value="">– select class –</option>
                        {classOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                            {o.class_name} · {o.weekly_sessions}×week
                            </option>
                        ))}
                        </select>
                        <input
                        required
                        className="input"
                        type="date"
                        value={enr.start}
                        onChange={handleEnrollmentChange(idx, "start")}
                        />
                    </div>
                    ))}

                    <button
                    type="button"
                    onClick={addEnrollment}
                    className="rounded bg-gray-200 px-2 py-1 text-sm hover:bg-gray-300"
                    >
                    + Add enrollment
                    </button>
                </div>

                {/* messages */}
                {message && (
                    <p
                    className={`whitespace-pre-wrap text-sm ${
                        message.ok ? "text-green-600" : "text-red-600"
                    }`}
                    >
                    {message.text}
                    </p>
                )}

                {/* actions */}
                <div className="flex justify-end gap-2">
                    <button
                    type="button"
                    onClick={onClose}
                    className="rounded px-3 py-1 text-sm hover:bg-gray-100"
                    >
                    Cancel
                    </button>
                    <button
                    disabled={createStudent.isPending}
                    className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:bg-blue-300"
                    >
                    {createStudent.isPending ? "Saving…" : "Save"}
                    </button>
                </div>
                </form>
            </div>
        </div>
    );
}

const inputClasses = 
    "w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none";