// Pagination.jsx
export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
  showFirstLast = true,
  showPrevNext = true,
  siblingCount = 1,
}) => {
  const range = (start, end) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  };

  const getPageNumbers = () => {
    const totalPageNumbers = siblingCount * 2 + 3;
    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (totalPages <= totalPageNumbers) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, "...", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [1, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [1, "...", ...middleRange, "...", totalPages];
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className={`flex items-center justify-center space-x-1 ${className}`}
      aria-label="Pagination"
    >
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="rounded px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-200 disabled:opacity-50"
        >
          First
        </button>
      )}
      {showPrevNext && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-200 disabled:opacity-50"
        >
          Previous
        </button>
      )}
      {pageNumbers.map((pageNumber, index) => (
        <button
          key={index}
          onClick={() =>
            typeof pageNumber === "number" && onPageChange(pageNumber)
          }
          className={`
            rounded px-3 py-1 text-sm transition-colors
            ${
              pageNumber === currentPage
                ? "bg-primary-500 text-neutral-100"
                : "text-neutral-600 hover:bg-neutral-200"
            }
            ${
              typeof pageNumber === "string"
                ? "cursor-default hover:bg-transparent"
                : ""
            }
          `}
          disabled={typeof pageNumber === "string"}
        >
          {pageNumber}
        </button>
      ))}
      {showPrevNext && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-200 disabled:opacity-50"
        >
          Next
        </button>
      )}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="rounded px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-200 disabled:opacity-50"
        >
          Last
        </button>
      )}
    </nav>
  );
};
