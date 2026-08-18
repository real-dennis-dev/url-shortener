// Button.jsx
import React from "react";

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  fullWidth = false,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-weight-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary-500 text-neutral-100 hover:bg-primary-400 focus:ring-primary-500",
    secondary:
      "bg-secondary-500 text-neutral-100 hover:bg-secondary-400 focus:ring-secondary-500",
    outline:
      "border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-neutral-100 focus:ring-primary-500",
    ghost: "text-primary-500 hover:bg-primary-500/10 focus:ring-primary-500",
    danger: "bg-error text-neutral-100 hover:bg-error/90 focus:ring-error",
    success:
      "bg-success text-neutral-100 hover:bg-success/90 focus:ring-success",
    warning:
      "bg-warning text-neutral-100 hover:bg-warning/90 focus:ring-warning",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};

// Input.jsx
export const Input = ({
  label,
  error,
  helper,
  className = "",
  id,
  fullWidth = true,
  ...props
}) => {
  const baseStyles =
    "rounded-lg border border-neutral-300 bg-neutral-100 px-4 py-2 text-neutral-800 placeholder-neutral-400 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50";

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
      <input
        id={id}
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

// Radio.jsx
export const Radio = ({ label, error, className = "", id, name, ...props }) => {
  return (
    <div className={className}>
      <div className="flex items-center">
        <input
          type="radio"
          id={id}
          name={name}
          className="h-4 w-4 border-neutral-300 text-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0"
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

// Badge.jsx
export const Badge = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
}) => {
  const variants = {
    primary: "bg-primary-500 text-neutral-100",
    secondary: "bg-secondary-500 text-neutral-100",
    success: "bg-success text-neutral-100",
    warning: "bg-warning text-neutral-100",
    error: "bg-error text-neutral-100",
    info: "bg-info text-neutral-100",
    neutral: "bg-neutral-200 text-neutral-700",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={`
      inline-flex items-center rounded-full font-weight-medium
      ${variants[variant]}
      ${sizes[size]}
      ${className}
    `}
    >
      {children}
    </span>
  );
};

// Alert.jsx
export const Alert = ({
  children,
  variant = "info",
  title,
  className = "",
  onClose,
  icon,
}) => {
  const variants = {
    info: "bg-info/10 border-info text-info",
    success: "bg-success/10 border-success text-success",
    warning: "bg-warning/10 border-warning text-warning",
    error: "bg-error/10 border-error text-error",
    primary: "bg-primary-500/10 border-primary-500 text-primary-500",
  };

  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
    primary: "💡",
  };

  return (
    <div
      className={`
      relative rounded-lg border p-4
      ${variants[variant]}
      ${className}
    `}
      role="alert"
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-lg opacity-50 hover:opacity-100"
        >
          ×
        </button>
      )}
      <div className="flex items-start">
        {icon !== null && (
          <span className="mr-3 text-xl">{icon || icons[variant]}</span>
        )}
        <div>
          {title && <h4 className="font-weight-bold">{title}</h4>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
};

// Toast.jsx
export const Toast = ({
  children,
  variant = "info",
  title,
  className = "",
  onClose,
  duration = 5000,
  position = "top-right",
}) => {
  const variants = {
    info: "bg-info text-neutral-100",
    success: "bg-success text-neutral-100",
    warning: "bg-warning text-neutral-100",
    error: "bg-error text-neutral-100",
    primary: "bg-primary-500 text-neutral-100",
  };

  const positions = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  };

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div
      className={`
      fixed z-50 max-w-sm animate-slide-in rounded-lg shadow-lg
      ${variants[variant]}
      ${positions[position]}
      ${className}
    `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-1">
            {title && <h4 className="font-weight-bold">{title}</h4>}
            <div className="text-sm">{children}</div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-4 text-xl opacity-50 hover:opacity-100"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal.jsx
export const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  className = "",
}) => {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    full: "max-w-full mx-4",
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div
          className={`
          relative w-full rounded-lg bg-neutral-100 shadow-xl
          ${sizes[size]}
          ${className}
        `}
        >
          {(title || onClose) && (
            <div className="flex items-center justify-between border-b border-neutral-300 p-4">
              {title && <h3 className="text-lg font-weight-bold">{title}</h3>}
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-2xl text-neutral-400 hover:text-neutral-600"
                >
                  ×
                </button>
              )}
            </div>
          )}
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

// Breadcrumb.jsx
export const Breadcrumb = ({ items, separator = "/", className = "" }) => {
  return (
    <nav
      className={`flex flex-wrap items-center text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex flex-wrap items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-neutral-400">{separator}</span>
            )}
            {item.href ? (
              <a
                href={item.href}
                className="text-neutral-600 hover:text-primary-500 transition-colors"
                aria-current={index === items.length - 1 ? "page" : undefined}
              >
                {item.label}
              </a>
            ) : (
              <span className="text-primary-500 font-weight-medium">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Dropdown.jsx
export const Dropdown = ({
  trigger,
  children,
  className = "",
  align = "left",
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const alignClasses = {
    left: "left-0",
    right: "right-0",
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={`
          absolute z-50 mt-2 min-w-[200px] rounded-lg border border-neutral-300 bg-neutral-100 py-1 shadow-lg
          ${alignClasses[align]}
        `}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// DropdownItem.jsx
export const DropdownItem = ({
  children,
  onClick,
  className = "",
  icon,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-200
        ${disabled ? "cursor-not-allowed opacity-50" : ""}
        ${className}
      `}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

// Pagination.jsx
export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
  showFirstLast = true,
  showPrevNext = true,
  siblingCount = 1,
}) => {
  const range = (start, end) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  };

  const getPageNumbers = () => {
    const totalPageNumbers = siblingCount * 2 + 3;
    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (totalPages <= totalPageNumbers) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, "...", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [1, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [1, "...", ...middleRange, "...", totalPages];
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className={`flex items-center justify-center space-x-1 ${className}`}
      aria-label="Pagination"
    >
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="rounded px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-200 disabled:opacity-50"
        >
          First
        </button>
      )}
      {showPrevNext && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-200 disabled:opacity-50"
        >
          Previous
        </button>
      )}
      {pageNumbers.map((pageNumber, index) => (
        <button
          key={index}
          onClick={() =>
            typeof pageNumber === "number" && onPageChange(pageNumber)
          }
          className={`
            rounded px-3 py-1 text-sm transition-colors
            ${
              pageNumber === currentPage
                ? "bg-primary-500 text-neutral-100"
                : "text-neutral-600 hover:bg-neutral-200"
            }
            ${
              typeof pageNumber === "string"
                ? "cursor-default hover:bg-transparent"
                : ""
            }
          `}
          disabled={typeof pageNumber === "string"}
        >
          {pageNumber}
        </button>
      ))}
      {showPrevNext && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-200 disabled:opacity-50"
        >
          Next
        </button>
      )}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="rounded px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-200 disabled:opacity-50"
        >
          Last
        </button>
      )}
    </nav>
  );
};

// Table.jsx
export const Table = ({
  headers,
  data,
  className = "",
  variant = "default",
}) => {
  const variants = {
    default: "bg-neutral-100",
    striped: "bg-neutral-100 [&>tbody>tr:nth-child(even)]:bg-neutral-200",
    bordered:
      "bg-neutral-100 border border-neutral-300 [&>thead>tr>th]:border [&>tbody>tr>td]:border",
  };

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full ${variants[variant]} ${className}`}>
        <thead className="bg-neutral-300">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-sm font-weight-bold text-neutral-700"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-300">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {Object.values(row).map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-3 text-sm text-neutral-600"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

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

// LoadingSpinner.jsx
export const LoadingSpinner = ({
  size = "md",
  color = "primary",
  className = "",
}) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const colors = {
    primary: "border-primary-500",
    white: "border-neutral-100",
    neutral: "border-neutral-500",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`
        inline-block animate-spin rounded-full border-4 border-solid border-r-transparent
        ${sizes[size]}
        ${colors[color]}
      `}
      />
    </div>
  );
};

// SkeletonLoader.jsx
export const SkeletonLoader = ({
  variant = "text",
  width = "w-full",
  height = "h-4",
  count = 1,
  className = "",
}) => {
  const variants = {
    text: "rounded",
    circle: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`
            animate-pulse bg-neutral-300
            ${variants[variant]}
            ${width}
            ${height}
          `}
        />
      ))}
    </div>
  );
};

// ProgressBar.jsx
export const ProgressBar = ({
  value,
  max = 100,
  label,
  showLabel = false,
  variant = "primary",
  className = "",
  size = "md",
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variants = {
    primary: "bg-primary-500",
    secondary: "bg-secondary-500",
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-error",
  };

  const sizes = {
    sm: "h-1",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-1 flex items-center justify-between text-sm">
          {label && <span className="text-neutral-600">{label}</span>}
          <span className="font-weight-medium text-neutral-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-neutral-200 ${sizes[size]}`}
      >
        <div
          className={`${variants[variant]} h-full transition-all duration-500 ease-in-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// EmptyState.jsx
export const EmptyState = ({
  title = "No items found",
  description = "There are no items to display at the moment.",
  icon,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
    >
      {icon && <div className="mb-4 text-6xl text-neutral-400">{icon}</div>}
      <h3 className="mb-2 text-lg font-weight-bold text-neutral-700">
        {title}
      </h3>
      <p className="mb-4 text-sm text-neutral-500">{description}</p>
      {action && action}
    </div>
  );
};

// ErrorState.jsx
export const ErrorState = ({
  title = "Something went wrong",
  description = "An error occurred while loading this content.",
  error,
  onRetry,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
    >
      <div className="mb-4 text-6xl text-error">⚠️</div>
      <h3 className="mb-2 text-lg font-weight-bold text-neutral-700">
        {title}
      </h3>
      <p className="mb-2 text-sm text-neutral-500">{description}</p>
      {error && <p className="mb-4 text-sm text-error">{error.message}</p>}
      {onRetry && (
        <Button onClick={onRetry} variant="primary" size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
};

// Stepper.jsx
export const Stepper = ({
  steps,
  currentStep,
  onStepChange,
  className = "",
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <button
                  onClick={() => onStepChange && onStepChange(index)}
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-full font-weight-bold transition-colors
                    ${isCompleted ? "bg-primary-500 text-neutral-100" : ""}
                    ${
                      isCurrent
                        ? "border-2 border-primary-500 bg-neutral-100 text-primary-500"
                        : ""
                    }
                    ${
                      !isCompleted && !isCurrent
                        ? "border-2 border-neutral-300 bg-neutral-100 text-neutral-500"
                        : ""
                    }
                  `}
                  disabled={!onStepChange}
                >
                  {isCompleted ? "✓" : index + 1}
                </button>
                <span
                  className={`
                  mt-2 text-xs font-weight-medium
                  ${
                    isCompleted || isCurrent
                      ? "text-primary-500"
                      : "text-neutral-500"
                  }
                `}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                  h-0.5 flex-1 transition-colors
                  ${index < currentStep ? "bg-primary-500" : "bg-neutral-300"}
                `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// FileUpload.jsx
export const FileUpload = ({
  onFileSelect,
  accept,
  multiple = false,
  maxSize = 5, // MB
  label = "Upload files",
  className = "",
}) => {
  const [dragActive, setDragActive] = React.useState(false);
  const [files, setFiles] = React.useState([]);
  const inputRef = React.useRef(null);

  const handleFiles = (fileList) => {
    const selectedFiles = Array.from(fileList);
    const validFiles = selectedFiles.filter((file) => {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max size is ${maxSize}MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFiles((prev) => (multiple ? [...prev, ...validFiles] : validFiles));
      onFileSelect && onFileSelect(multiple ? validFiles : validFiles[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors
          ${
            dragActive
              ? "border-primary-500 bg-primary-500/10"
              : "border-neutral-300 hover:border-primary-500"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-2 text-sm text-neutral-600">
            <span className="font-weight-medium text-primary-500">
              Click to upload
            </span>{" "}
            or drag and drop
          </p>
          <p className="text-xs text-neutral-500">
            {accept
              ? `Accepted: ${accept.split(",").join(", ")}`
              : "All file types accepted"}
            {maxSize && ` • Max ${maxSize}MB`}
          </p>
        </div>
      </div>
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg bg-neutral-200 p-2"
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm text-neutral-600">{file.name}</span>
                <span className="text-xs text-neutral-500">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-neutral-400 hover:text-error transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ImageGallery.jsx
export const ImageGallery = ({
  images,
  className = "",
  columns = 3,
  aspectRatio = "1/1",
}) => {
  const [selectedImage, setSelectedImage] = React.useState(0);

  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <div className={className}>
      {/* Main image */}
      {images.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-lg bg-neutral-200">
          <img
            src={images[selectedImage]}
            alt={`Gallery image ${selectedImage + 1}`}
            className="h-full w-full object-cover"
            style={{ aspectRatio }}
          />
        </div>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className={`grid gap-2 ${gridCols[columns]}`}>
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`
                overflow-hidden rounded-lg transition-all
                ${
                  index === selectedImage
                    ? "ring-2 ring-primary-500"
                    : "opacity-70 hover:opacity-100"
                }
              `}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
                style={{ aspectRatio }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Rating.jsx
export const Rating = ({
  value = 0,
  max = 5,
  onChange,
  readOnly = false,
  size = "md",
  className = "",
}) => {
  const [hover, setHover] = React.useState(0);

  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-10 w-10",
  };

  const handleClick = (index) => {
    if (!readOnly && onChange) {
      onChange(index);
    }
  };

  const handleMouseEnter = (index) => {
    if (!readOnly) {
      setHover(index);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHover(0);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      {Array.from({ length: max }).map((_, index) => {
        const starValue = index + 1;
        const filled = (hover || value) >= starValue;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            className={`
              ${sizes[size]} 
              ${readOnly ? "cursor-default" : "cursor-pointer"}
              transition-colors duration-150
              ${filled ? "text-warning" : "text-neutral-300"}
            `}
            disabled={readOnly}
          >
            {filled ? "★" : "☆"}
          </button>
        );
      })}
      {value > 0 && (
        <span className="ml-2 text-sm text-neutral-500">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
};

// Comment.jsx
export const Comment = ({
  author,
  content,
  date,
  avatar,
  rating,
  actions,
  className = "",
  children,
}) => {
  return (
    <div
      className={`border-b border-neutral-300 py-4 last:border-0 ${className}`}
    >
      <div className="flex space-x-3">
        {avatar ? (
          <img
            src={avatar}
            alt={author}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-neutral-100">
            {author.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-weight-medium text-neutral-800">{author}</h4>
              {date && <span className="text-xs text-neutral-500">{date}</span>}
            </div>
            {rating && <Rating value={rating} readOnly size="sm" />}
          </div>
          <p className="mt-1 text-sm text-neutral-600">{content}</p>
          {actions && <div className="mt-2 flex space-x-2">{actions}</div>}
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </div>
  );
};

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

// IconWrapper.jsx
export const IconWrapper = ({
  icon: Icon,
  size = "md",
  color = "currentColor",
  className = "",
  onClick,
  ...props
}) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
    "2xl": "h-10 w-10",
  };

  return (
    <div
      className={`
        inline-flex items-center justify-center
        ${onClick ? "cursor-pointer hover:opacity-70 transition-opacity" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      <Icon className={`${sizes[size]} ${color}`} {...props} />
    </div>
  );
};

// DatePicker.jsx
export const DatePicker = ({
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
        type="date"
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

// DateTimePicker.jsx
export const DateTimePicker = ({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  label,
  error,
  className = "",
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-weight-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className="grid grid-cols-2 gap-2">
        <DatePicker value={dateValue} onChange={onDateChange} error={error} />
        <TimePicker value={timeValue} onChange={onTimeChange} error={error} />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
};
