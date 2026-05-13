const OPTIONS = [
  { id: 'system', label: 'Default' },
  { id: 'light', label: 'Day' },
  { id: 'dark', label: 'Night' },
];

export default function ThemeSwitcher({ value, onChange, className = '', isDarkTheme = false }) {
  const wrapperClass = isDarkTheme
    ? 'border-[#35405f] bg-[#1b2336]/95 shadow-[0_8px_24px_rgba(3,7,18,0.46)]'
    : 'border-fuchsia-100 bg-white shadow-sm';

  return (
    <div
      className={`inline-flex items-center rounded-2xl border p-1.5 ${wrapperClass} ${className}`}
      role="tablist"
      aria-label="Theme switcher"
    >
      {OPTIONS.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide transition-colors ${
              isActive
                ? isDarkTheme
                  ? 'bg-[#ba82ee] text-white shadow-[0_6px_14px_rgba(92,54,146,0.4)]'
                  : 'bg-[#d946ef] text-white shadow-[0_4px_12px_rgba(217,70,239,0.25)]'
                : isDarkTheme
                  ? 'text-[#a8b4d3] hover:bg-[#27314a] hover:text-[#d7b3fa]'
                  : 'text-gray-500 hover:bg-fuchsia-50 hover:text-[#d946ef]'
            }`}
            role="tab"
            aria-selected={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
