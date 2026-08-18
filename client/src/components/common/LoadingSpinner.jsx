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
