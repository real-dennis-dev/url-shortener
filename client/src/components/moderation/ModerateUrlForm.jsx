import { useState } from "react";
import {
  Button,
  Input,
  Textarea,
  Select,
  Alert,
  LoadingSpinner,
} from "../common";

const MODERATION_ACTIONS = [
  { value: "block", label: "Block - Completely block access" },
  { value: "flag", label: "Flag - Mark for review" },
  { value: "warn", label: "Warn - Show warning to users" },
  { value: "delete", label: "Delete - Remove the URL" },
  { value: "review", label: "Review - Request additional review" },
];

const ModerateUrlForm = ({
  urlId,
  onSubmit,
  isLoading = false,
  error = null,
  onCancel,
}) => {
  const [action, setAction] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!action) errors.action = "Please select an action";
    if (!reason.trim()) errors.reason = "Please provide a reason";
    if (reason.length > 500)
      errors.reason = "Reason must be 500 characters or less";
    if (notes.length > 1000)
      errors.notes = "Notes must be 1000 characters or less";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      action,
      reason: reason.trim(),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* URL ID Display */}
      <div className="rounded-lg bg-neutral-200/50 p-4 dark:bg-neutral-800/50">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Moderating URL:
        </p>
        <p className="font-mono text-sm text-neutral-900 dark:text-neutral-100">
          {urlId}
        </p>
      </div>

      {/* Action Selection */}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Action <span className="text-error">*</span>
        </label>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
            validationErrors.action
              ? "border-error focus:ring-error/50"
              : "border-neutral-300 focus:border-primary-400 focus:ring-primary-400/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          }`}
        >
          <option value="">Select an action...</option>
          {MODERATION_ACTIONS.map((act) => (
            <option key={act.value} value={act.value}>
              {act.label}
            </option>
          ))}
        </select>
        {validationErrors.action && (
          <p className="mt-1 text-sm text-error">{validationErrors.action}</p>
        )}
      </div>

      {/* Reason */}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Reason <span className="text-error">*</span>
        </label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this moderation action is being taken..."
          rows={3}
          maxLength={500}
          error={validationErrors.reason}
          className={validationErrors.reason ? "border-error" : ""}
        />
        <div className="mt-1 text-right text-xs text-neutral-400">
          {reason.length}/500
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Additional Notes <span className="text-neutral-400">(Optional)</span>
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional context or notes..."
          rows={2}
          maxLength={1000}
          error={validationErrors.notes}
          className={validationErrors.notes ? "border-error" : ""}
        />
        <div className="mt-1 text-right text-xs text-neutral-400">
          {notes.length}/1000
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="danger"
          disabled={isLoading}
          loading={isLoading}
          className="flex-1"
        >
          {isLoading ? "Applying..." : "Apply Moderation"}
        </Button>
      </div>
    </form>
  );
};

export default ModerateUrlForm;
