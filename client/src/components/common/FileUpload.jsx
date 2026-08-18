// FileUpload.jsx
export const FileUpload = ({
  onFileSelect,
  accept,
  multiple = false,
  maxSize = 5, // MB
  label = "Upload files",
  className = "",
}) => {
  const [dragActive, setDragActive] = React.useState(false);
  const [files, setFiles] = React.useState([]);
  const inputRef = React.useRef(null);

  const handleFiles = (fileList) => {
    const selectedFiles = Array.from(fileList);
    const validFiles = selectedFiles.filter((file) => {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max size is ${maxSize}MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFiles((prev) => (multiple ? [...prev, ...validFiles] : validFiles));
      onFileSelect && onFileSelect(multiple ? validFiles : validFiles[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors
          ${
            dragActive
              ? "border-primary-500 bg-primary-500/10"
              : "border-neutral-300 hover:border-primary-500"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-2 text-sm text-neutral-600">
            <span className="font-weight-medium text-primary-500">
              Click to upload
            </span>{" "}
            or drag and drop
          </p>
          <p className="text-xs text-neutral-500">
            {accept
              ? `Accepted: ${accept.split(",").join(", ")}`
              : "All file types accepted"}
            {maxSize && ` • Max ${maxSize}MB`}
          </p>
        </div>
      </div>
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg bg-neutral-200 p-2"
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm text-neutral-600">{file.name}</span>
                <span className="text-xs text-neutral-500">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-neutral-400 hover:text-error transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
