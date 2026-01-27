import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('../editor/RichTextEditor.client'), {
  ssr: false,
});
interface GuideStepsEditorProps {
  readonly value?: string[];
  readonly onChange?: (steps: string[]) => void;
  readonly label?: string;
  readonly placeholderPrefix?: string;
}

export function GuideStepsEditor({
  value,
  onChange,
  label = 'Βήματα',
  placeholderPrefix = 'Βήμα',
}: GuideStepsEditorProps) {
  const [steps, setSteps] = useState<string[]>(value ?? ['']);

  useEffect(() => {
    if (value) {
      setSteps(value);
    }
  }, [value]);

  const updateStep = (index: number, val: string) => {
    const updated = [...steps];
    updated[index] = val;
    setSteps(updated);
    onChange?.(updated);
  };

  const addStep = () => {
    const next = [...steps, ''];
    setSteps(next);
    onChange?.(next);
  };

  const removeStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index);
    const safe = updated.length ? updated : [''];
    setSteps(safe);
    onChange?.(safe);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-white">{label}</label>

      {steps.map((step, index) => (
        <div key={index} className="rounded-xl border border-slate-800/70 bg-slate-950/60 p-3">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
            <span className="font-semibold">{`${placeholderPrefix} ${index + 1}`}</span>
            <button
              type="button"
              onClick={() => removeStep(index)}
              className="text-red-400 transition hover:text-red-200"
              aria-label="Διαγραφή βήματος"
            >
              ✕
            </button>
          </div>
          <RichTextEditor
            value={step}
            onChange={val => updateStep(index, val)}
            placeholder="Πρόσθεσε περιεχόμενο, λίστες, πίνακες ή εικόνες…"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addStep}
        className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-500/70 hover:text-white"
      >
        + Προσθήκη Βήματος
      </button>
    </div>
  );
}
