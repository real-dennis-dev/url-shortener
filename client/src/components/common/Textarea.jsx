// Textarea.jsx
export const Textarea = ({
  label,
  error,
  helper,
  className = "",
  id,
  fullWidth = true,
  rows = 4,
  ...props
}) => {
  const baseStyles =
    "rounded-lg border border-neutral-300 bg-neutral-100 px-4 py-2 text-neutral-800 placeholder-neutral-400 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 resize-y";

  return (
    <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-weight-medium text-neutral-700"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`
          ${baseStyles}
          ${fullWidth ? "w-full" : ""}
          ${error ? "border-error focus:border-error focus:ring-error/20" : ""}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
      {helper && !error && (
        <p className="mt-1 text-sm text-neutral-500">{helper}</p>
      )}
    </div>
  );
};
