import { useState } from "react";
import {
  Button,
  Input,
  Textarea,
  Modal,
  Alert,
  Badge,
  Table,
  Pagination,
  LoadingSpinner,
} from "../common";

const BlacklistManager = ({
  blacklist = [],
  total = 0,
  page = 1,
  totalPages = 1,
  limit = 20,
  onPageChange,
  isLoading = false,
  onAdd,
  onRemove,
  adding = false,
  removing = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [removeConfirm, setRemoveConfirm] = useState(null);

  const headers = [
    { key: "id", label: "ID" },
    { key: "domain", label: "Domain" },
    { key: "reason", label: "Reason" },
    { key: "addedBy", label: "Added By" },
    { key: "addedAt", label: "Added At" },
    { key: "expiresAt", label: "Expires" },
    { key: "actions", label: "Actions" },
  ];

  const validate = () => {
    const errors = {};
    if (!domain.trim()) errors.domain = "Domain is required";
    if (!reason.trim()) errors.reason = "Reason is required";
    if (reason.length > 500)
      errors.reason = "Reason must be 500 characters or less";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    onAdd({
      domain: domain.trim(),
      reason: reason.trim(),
      expiresAt: expiresAt || undefined,
    });
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDomain("");
    setReason("");
    setExpiresAt("");
    setValidationErrors({});
  };

  const handleRemove = (id) => {
    setRemoveConfirm(id);
  };

  const confirmRemove = () => {
    if (removeConfirm) {
      onRemove(removeConfirm);
      setRemoveConfirm(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  const isExpired = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Domain Blacklist
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {total} domains currently blacklisted
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + Add Domain
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : blacklist.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-neutral-500 dark:text-neutral-400">
          <p className="text-lg font-medium">No domains blacklisted</p>
          <p className="text-sm">Add your first domain to start blocking</p>
        </div>
      ) : (
        <>
          <Table
            headers={headers}
            variant="striped"
            className="min-w-full"
            renderRow={(entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                  {entry.id}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {entry.domain}
                  {isExpired(entry.expires_at) && (
                    <Badge variant="warning" size="sm" className="ml-2">
                      Expired
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                  {entry.reason}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                  {entry.added_by_email || entry.added_by || "System"}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                  {formatDate(entry.added_at)}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                  {formatDate(entry.expires_at)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRemove(entry.id)}
                    disabled={removing}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            )}
            data={blacklist}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Showing {blacklist.length} of {total} domains
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Add Domain to Blacklist"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Domain <span className="text-error">*</span>
            </label>
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              error={validationErrors.domain}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Reason <span className="text-error">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this domain being blacklisted?"
              rows={2}
              maxLength={500}
              error={validationErrors.reason}
            />
            <div className="mt-1 text-right text-xs text-neutral-400">
              {reason.length}/500
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Expiration <span className="text-neutral-400">(Optional)</span>
            </label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={adding}
              disabled={adding}
              className="flex-1"
            >
              Add to Blacklist
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Confirmation Modal */}
      <Modal
        isOpen={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        title="Remove Domain"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-neutral-700 dark:text-neutral-300">
            Are you sure you want to remove this domain from the blacklist?
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setRemoveConfirm(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmRemove}
              loading={removing}
              disabled={removing}
              className="flex-1"
            >
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BlacklistManager;
