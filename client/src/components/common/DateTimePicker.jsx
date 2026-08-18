// DateTimePicker.jsx
export const DateTimePicker = ({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  label,
  error,
  className = "",
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-weight-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className="grid grid-cols-2 gap-2">
        <DatePicker value={dateValue} onChange={onDateChange} error={error} />
        <TimePicker value={timeValue} onChange={onTimeChange} error={error} />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
};
