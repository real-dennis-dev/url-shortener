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
