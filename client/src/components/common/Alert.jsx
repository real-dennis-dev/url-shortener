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
