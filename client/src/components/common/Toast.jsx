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
