import { useState, type ChangeEvent, type FormEvent } from 'react';

type Values = Record<string, string>;

export function useForm(initial: Values, validate: (v: Values) => Values) {
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Values>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const set = (k: string, v: string) => {
    setValues((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => { const n = { ...p }; delete n[k]; return n; });
  };

  const bind = (k: string) => ({
    value: values[k] ?? '',
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(k, e.target.value),
    'aria-invalid': errors[k] ? true : undefined,
    className: errors[k] ? 'input input-error' : 'input',
  });

  const handleSubmit = (fn: (v: Values) => Promise<void>) => async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    setSubmitError('');
    try { await fn(values); }
    catch (err) { setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Try again.'); }
    finally { setSubmitting(false); }
  };

  return { values, errors, set, bind, handleSubmit, submitting, submitError };
}

export const PHONE_RE = /^[6-9]\d{9}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
