// Comment.jsx
export const Comment = ({
  author,
  content,
  date,
  avatar,
  rating,
  actions,
  className = "",
  children,
}) => {
  return (
    <div
      className={`border-b border-neutral-300 py-4 last:border-0 ${className}`}
    >
      <div className="flex space-x-3">
        {avatar ? (
          <img
            src={avatar}
            alt={author}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-neutral-100">
            {author.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-weight-medium text-neutral-800">{author}</h4>
              {date && <span className="text-xs text-neutral-500">{date}</span>}
            </div>
            {rating && <Rating value={rating} readOnly size="sm" />}
          </div>
          <p className="mt-1 text-sm text-neutral-600">{content}</p>
          {actions && <div className="mt-2 flex space-x-2">{actions}</div>}
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </div>
  );
};
