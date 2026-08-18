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
