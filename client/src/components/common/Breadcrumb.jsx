// Breadcrumb.jsx
export const Breadcrumb = ({ items, separator = "/", className = "" }) => {
  return (
    <nav
      className={`flex flex-wrap items-center text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex flex-wrap items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-neutral-400">{separator}</span>
            )}
            {item.href ? (
              <a
                href={item.href}
                className="text-neutral-600 hover:text-primary-500 transition-colors"
                aria-current={index === items.length - 1 ? "page" : undefined}
              >
                {item.label}
              </a>
            ) : (
              <span className="text-primary-500 font-weight-medium">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
