// Rating.jsx
export const Rating = ({
  value = 0,
  max = 5,
  onChange,
  readOnly = false,
  size = "md",
  className = "",
}) => {
  const [hover, setHover] = React.useState(0);

  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-10 w-10",
  };

  const handleClick = (index) => {
    if (!readOnly && onChange) {
      onChange(index);
    }
  };

  const handleMouseEnter = (index) => {
    if (!readOnly) {
      setHover(index);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHover(0);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      {Array.from({ length: max }).map((_, index) => {
        const starValue = index + 1;
        const filled = (hover || value) >= starValue;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            className={`
              ${sizes[size]} 
              ${readOnly ? "cursor-default" : "cursor-pointer"}
              transition-colors duration-150
              ${filled ? "text-warning" : "text-neutral-300"}
            `}
            disabled={readOnly}
          >
            {filled ? "★" : "☆"}
          </button>
        );
      })}
      {value > 0 && (
        <span className="ml-2 text-sm text-neutral-500">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
};
