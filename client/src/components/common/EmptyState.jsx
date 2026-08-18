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
