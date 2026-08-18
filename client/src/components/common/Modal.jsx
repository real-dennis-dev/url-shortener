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
