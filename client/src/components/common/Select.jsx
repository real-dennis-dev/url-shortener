import React from "react";

const Select = ({
  label,
  name,
  value = "",
  onChange,
  options = [],
  placeholder,
  helper,
  error,
  required = false,
  disabled = false,
  className = "",
  id,
  ...props
}) => {
  const selectId = id || name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block mb-1.5 text-sm font-medium text-foreground"
        >
          {label}

          {required && (
            <span className="ml-1 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${selectId}-error`
            : helper
            ? `${selectId}-helper`
            : undefined
        }
        className={`
          w-full
          rounded-lg
          border
          bg-background
          px-3
          py-2.5
          text-sm
          text-foreground
          outline-none
          transition-colors
          appearance-none
          cursor-pointer

          ${
            error
              ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
              : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
          }

          ${disabled ? "cursor-not-allowed opacity-60" : ""}

          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p
          id={`${selectId}-error`}
          className="mt-1.5 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      {!error && helper && (
        <p
          id={`${selectId}-helper`}
          className="mt-1.5 text-sm text-muted-foreground"
        >
          {helper}
        </p>
      )}
    </div>
  );
};

export default Select;
