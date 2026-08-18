// Switch.jsx
export const Switch = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = "",
  id,
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${checked ? "bg-primary-500" : "bg-neutral-300"}
          ${disabled ? "cursor-not-allowed opacity-50" : ""}
        `}
        id={id}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-100 shadow-lg ring-0 transition duration-200 ease-in-out
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
      {label && (
        <label htmlFor={id} className="ml-3 text-sm text-neutral-700">
          {label}
        </label>
      )}
    </div>
  );
};
