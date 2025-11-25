import { useState } from 'react';

export function GuideStepsEditor() {
  const [steps, setSteps] = useState<string[]>(['']);

  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const addStep = () => setSteps([...steps, '']);

  const removeStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index);
    setSteps(updated);
  };

  return (
    <div className="space-y-2">
      <label htmlFor="steps" className="text-sm font-medium text-white">
        Βήματα
      </label>
      {steps.map((step, index) => (
        <div key={index} className="flex gap-2">
          <textarea
            id="steps"
            value={step}
            onChange={e => updateStep(index, e.target.value)}
            className="w-full rounded border border-gray-700 bg-gray-900 p-2 text-white"
            placeholder={`Βήμα ${index + 1}`}
          />
          <button
            type="button"
            onClick={() => removeStep(index)}
            className="text-red-500 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addStep}
        className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
      >
        + Προσθήκη Βήματος
      </button>
    </div>
  );
}
