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
