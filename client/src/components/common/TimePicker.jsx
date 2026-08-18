// TimePicker.jsx
export const TimePicker = ({
  value,
  onChange,
  label,
  error,
  className = "",
  id,
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-weight-medium text-neutral-700"
        >
          {label}
        </label>
      )}
      <input
        type="time"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full rounded-lg border border-neutral-300 bg-neutral-100 px-4 py-2 text-neutral-800 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20
          ${error ? "border-error focus:border-error focus:ring-error/20" : ""}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};
