// ErrorState.jsx
export const ErrorState = ({
  title = "Something went wrong",
  description = "An error occurred while loading this content.",
  error,
  onRetry,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
    >
      <div className="mb-4 text-6xl text-error">⚠️</div>
      <h3 className="mb-2 text-lg font-weight-bold text-neutral-700">
        {title}
      </h3>
      <p className="mb-2 text-sm text-neutral-500">{description}</p>
      {error && <p className="mb-4 text-sm text-error">{error.message}</p>}
      {onRetry && (
        <Button onClick={onRetry} variant="primary" size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
};
