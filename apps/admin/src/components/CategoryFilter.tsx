'use client';

type Tab = { id: string; label: string; count: number };

export function CategoryFilter({
  tabs,
  active,
  onChange,
  search,
  onSearchChange,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  search?: string;
  onSearchChange?: (q: string) => void;
}) {
  return (
    <div className="mb-4 space-y-3 rounded-xl bg-white p-4 shadow-sm">
      {onSearchChange && (
        <input
          type="search"
          placeholder="Buscar..."
          value={search ?? ''}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      )}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              active === tab.id ? 'bg-fresh-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
    </div>
  );
}
