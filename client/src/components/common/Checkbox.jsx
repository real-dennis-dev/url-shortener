// Checkbox.jsx
export const Checkbox = ({ label, error, className = "", id, ...props }) => {
  return (
    <div className={className}>
      <div className="flex items-center">
        <input
          type="checkbox"
          id={id}
          className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0"
          {...props}
        />
        {label && (
          <label htmlFor={id} className="ml-2 text-sm text-neutral-700">
            {label}
          </label>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};
