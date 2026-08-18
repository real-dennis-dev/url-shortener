// SearchBar.jsx
export const SearchBar = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  className = "",
  fullWidth = true,
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`${fullWidth ? "w-full" : ""} ${className}`}
    >
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-neutral-300 bg-neutral-100 px-4 py-2 pl-10 text-neutral-800 placeholder-neutral-400 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          {...props}
        />
        <svg
          className="absolute left-3 h-5 w-5 text-neutral-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <button
          type="submit"
          className="absolute right-1 rounded-lg bg-primary-500 px-4 py-1.5 text-sm text-neutral-100 hover:bg-primary-400 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
};
