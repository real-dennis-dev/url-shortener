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
