// ThemeToggle.jsx
export const ThemeToggle = ({ className = "", size = "md" }) => {
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const sizes = {
    sm: "h-5 w-10",
    md: "h-6 w-11",
    lg: "h-7 w-12",
  };

  const toggleSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className={`
        relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${isDark ? "bg-primary-500" : "bg-neutral-300"}
        ${sizes[size]}
        ${className}
      `}
      role="switch"
      aria-checked={isDark}
    >
      <span
        className={`
          pointer-events-none inline-block transform rounded-full bg-neutral-100 shadow-lg ring-0 transition duration-200 ease-in-out
          ${
            isDark
              ? `translate-x-5 ${toggleSizes[size]}`
              : `translate-x-0 ${toggleSizes[size]}`
          }
        `}
      >
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
};
