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
        onChange={(e) => setSearch(e.target.value)}
        className="p-3 w-full border border-gray-600 bg-gray-800 text-white rounded-lg text-lg placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
      />
    </div>
  );
}
