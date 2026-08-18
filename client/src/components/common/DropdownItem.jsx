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
