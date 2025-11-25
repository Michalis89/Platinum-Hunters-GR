import { useState } from 'react';

export function TagsInput() {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const addTag = () => {
    if (input.trim() && !tags.includes(input.trim())) {
      setTags([...tags, input.trim()]);
      setInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div className="space-y-1 text-white">
      <label htmlFor="tags-input" className="text-sm font-medium">
        Tags
      </label>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <button
            key={tag}
            className="rounded bg-blue-600 px-2 py-1 text-sm"
            onClick={() => removeTag(tag)}
          >
            {tag} ✕
          </button>
        ))}
      </div>
      <input
        id="tags-input"
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
          }
        }}
        className="mt-2 w-full rounded border border-gray-700 bg-gray-900 p-2 text-white"
        placeholder="Πληκτρολόγησε και πάτα Enter"
      />
    </div>
  );
}
