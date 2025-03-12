interface SearchBarProps {
  search: string;
  setSearch: (value: string) => void;
}

export default function SearchBar({ search, setSearch }: Readonly<SearchBarProps>) {
  return (
    <div className="relative w-full max-w-lg">
      <input
        type="text"
        placeholder="🔎 Αναζήτηση παιχνιδιού..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-lg text-white placeholder-gray-500 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
