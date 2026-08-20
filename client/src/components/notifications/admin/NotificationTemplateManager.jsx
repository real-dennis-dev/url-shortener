import { useState, useEffect } from "react";
import { useNotificationAdmin } from "../../../hooks/useNotificationAdmin";
import {
  Button,
  Input,
  Textarea,
  Table,
  Badge,
  Modal,
  Alert,
  LoadingSpinner,
  EmptyState,
  Dropdown,
  DropdownItem,
  Switch,
  Toast,
} from "../../common";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CopyIcon,
  CheckCircleIcon,
  XCircleIcon,
  FilterIcon,
  SearchIcon,
} from "lucide-react";

const NOTIFICATION_TYPES = ["info", "success", "warning", "error"];
const TYPE_COLORS = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
};

export default function NotificationTemplateManager() {
  const {
    notificationTemplates,
    loading,
    error,
    pagination,
    fetchNotificationTemplates,
    createNotificationTemplate,
    updateNotificationTemplate,
    deleteNotificationTemplate,
    previewTemplate,
    clearError,
  } = useNotificationAdmin();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterActive, setFilterActive] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    messageTemplate: "",
    type: "info",
    variables: [],
    description: "",
    category: "general",
    isActive: true,
  });
  const [variableInput, setVariableInput] = useState("");

  useEffect(() => {
    fetchNotificationTemplates();
  }, []);

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        title: template.title,
        messageTemplate: template.message_template,
        type: template.type || "info",
        variables: template.variables || [],
        description: template.description || "",
        category: template.category || "general",
        isActive: template.is_active,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: "",
        title: "",
        messageTemplate: "",
        type: "info",
        variables: [],
        description: "",
        category: "general",
        isActive: true,
      });
    }
    setVariableInput("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      setToast({ message: "Template name is required", variant: "error" });
      return;
    }
    if (!formData.title.trim()) {
      setToast({ message: "Title is required", variant: "error" });
      return;
    }
    if (!formData.messageTemplate.trim()) {
      setToast({ message: "Message template is required", variant: "error" });
      return;
    }

    let result;
    if (editingTemplate) {
      result = await updateNotificationTemplate(editingTemplate.name, formData);
    } else {
      result = await createNotificationTemplate(formData);
    }

    if (result) {
      setIsModalOpen(false);
      fetchNotificationTemplates();
      setToast({
        message: editingTemplate
          ? "Template updated successfully!"
          : "Template created successfully!",
        variant: "success",
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDelete = async (name) => {
    if (
      window.confirm(
        `Are you sure you want to delete template "${name}"? This action cannot be undone.`
      )
    ) {
      const success = await deleteNotificationTemplate(name);
      if (success) {
        fetchNotificationTemplates();
        setToast({
          message: "Template deleted successfully!",
          variant: "success",
        });
        setTimeout(() => setToast(null), 3000);
      }
    }
  };

  const handlePreview = async (template) => {
    try {
      const sampleData = {
        userName: "John Doe",
        userEmail: "john@example.com",
        linkUrl: "https://shortify.io/abc123",
        linkClicks: 42,
        date: new Date().toISOString(),
      };

      const preview = await previewTemplate({
        template: {
          title: template.title,
          messageTemplate: template.message_template,
          type: template.type,
        },
        type: "notification",
        sampleData,
      });

      if (preview) {
        setPreviewData({
          template,
          preview,
          sampleData,
        });
        setIsPreviewModalOpen(true);
      }
    } catch (err) {
      setToast({
        message: "Failed to preview template",
        variant: "error",
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleAddVariable = () => {
    if (
      variableInput.trim() &&
      !formData.variables.includes(variableInput.trim())
    ) {
      setFormData({
        ...formData,
        variables: [...formData.variables, variableInput.trim()],
      });
      setVariableInput("");
    }
  };

  const handleRemoveVariable = (variable) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter((v) => v !== variable),
    });
  };

  const handleDuplicate = async (template) => {
    const newTemplate = {
      ...template,
      name: `${template.name}_copy`,
      isActive: false,
    };
    delete newTemplate.id;
    delete newTemplate.created_at;
    delete newTemplate.updated_at;
    delete newTemplate.created_by;

    const result = await createNotificationTemplate(newTemplate);
    if (result) {
      fetchNotificationTemplates();
      setToast({
        message: "Template duplicated successfully!",
        variant: "success",
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleFilter = () => {
    const params = {
      page: 1,
      limit: pagination.limit,
    };
    if (searchTerm) params.name = searchTerm;
    if (filterCategory) params.category = filterCategory;
    if (filterActive !== null) params.isActive = filterActive;
    fetchNotificationTemplates(params);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterCategory("");
    setFilterActive(null);
    fetchNotificationTemplates({ page: 1, limit: pagination.limit });
  };

  const renderPreviewMessage = () => {
    if (!previewData) return null;

    const { template, preview, sampleData } = previewData;
    let message = preview.html || preview.text || template.messageTemplate;

    // Replace variables with sample data
    if (sampleData) {
      Object.entries(sampleData).forEach(([key, value]) => {
        message = message.replace(new RegExp(`{{${key}}}`, "g"), value);
      });
    }

    return message;
  };

  if (loading && notificationTemplates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast
            variant={toast.variant}
            onClose={() => setToast(null)}
            duration={3000}
          >
            {toast.message}
          </Toast>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Notification Templates
          </h2>
          <p className="text-sm text-neutral-500">
            Manage notification templates for your application
          </p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="error" title="Error" onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleFilter()}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="welcome">Welcome</option>
              <option value="security">Security</option>
              <option value="analytics">Analytics</option>
              <option value="system">System</option>
            </select>
            <select
              value={filterActive !== null ? String(filterActive) : ""}
              onChange={(e) => {
                const val = e.target.value;
                setFilterActive(val === "" ? null : val === "true");
              }}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <Button variant="primary" size="sm" onClick={handleFilter}>
              Apply Filters
            </Button>
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Templates Table */}
      {notificationTemplates.length === 0 ? (
        <EmptyState
          title="No notification templates"
          description="Create your first notification template to get started"
          action={
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table
            headers={[
              "Name",
              "Title",
              "Type",
              "Category",
              "Variables",
              "Status",
              "Actions",
            ]}
            data={notificationTemplates}
            renderRow={(template) => (
              <tr
                key={template.id}
                className="hover:bg-neutral-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-neutral-900">
                      {template.name}
                    </p>
                    {template.description && (
                      <p className="text-xs text-neutral-500 truncate max-w-xs">
                        {template.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">
                  {template.title}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={TYPE_COLORS[template.type] || "info"}
                    size="sm"
                  >
                    {template.type}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="neutral" size="sm">
                    {template.category || "general"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {template.variables && template.variables.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 3).map((variable, idx) => (
                        <Badge
                          key={idx}
                          variant="neutral"
                          size="sm"
                          className="text-xs"
                        >
                          {variable}
                        </Badge>
                      ))}
                      {template.variables.length > 3 && (
                        <Badge variant="neutral" size="sm" className="text-xs">
                          +{template.variables.length - 3}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-400">
                      No variables
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={template.is_active ? "success" : "neutral"}>
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(template)}
                      title="Preview"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                      title="Duplicate"
                    >
                      <CopyIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenModal(template)}
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.name)}
                      title="Delete"
                      className="text-error hover:text-error hover:bg-error/10"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-neutral-500">
            Showing {notificationTemplates.length} of {pagination.total}{" "}
            templates
          </p>
          <div className="flex gap-2">
            {Array.from(
              { length: Math.min(pagination.totalPages, 5) },
              (_, i) => i + 1
            ).map((page) => (
              <Button
                key={page}
                variant={pagination.page === page ? "primary" : "outline"}
                size="sm"
                onClick={() =>
                  fetchNotificationTemplates({ page, limit: pagination.limit })
                }
              >
                {page}
              </Button>
            ))}
            {pagination.totalPages > 5 && (
              <span className="px-2 py-1 text-sm text-neutral-500">...</span>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingTemplate
            ? "Edit Notification Template"
            : "Create Notification Template"
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Template Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={!!editingTemplate}
            helper="Unique identifier for the template (cannot be changed after creation)"
          />

          <Input
            label="Title *"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
            helper="The title that will appear in the notification"
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              {NOTIFICATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <Textarea
            label="Message Template *"
            value={formData.messageTemplate}
            onChange={(e) =>
              setFormData({ ...formData, messageTemplate: e.target.value })
            }
            rows={6}
            required
            helper="Use {{variable_name}} syntax for dynamic content"
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Variables
            </label>
            <div className="flex gap-2">
              <Input
                value={variableInput}
                onChange={(e) => setVariableInput(e.target.value)}
                placeholder="Enter variable name (e.g., userName)"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddVariable())
                }
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddVariable}
              >
                Add
              </Button>
            </div>
            {formData.variables.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.variables.map((variable) => (
                  <Badge
                    key={variable}
                    variant="info"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    {variable}
                    <button
                      type="button"
                      onClick={() => handleRemoveVariable(variable)}
                      className="hover:text-error"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-neutral-400 mt-1">
              Variables will be replaced with actual values when sending
              notifications
            </p>
          </div>

          <Input
            label="Category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            helper="Used for organizing templates"
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            helper="Brief description of the template's purpose"
          />

          <div className="flex items-center gap-3 pt-2">
            <Switch
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
            />
            <div>
              <p className="text-sm font-medium text-neutral-700">Active</p>
              <p className="text-xs text-neutral-500">
                Inactive templates cannot be used for sending notifications
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" variant="primary" fullWidth>
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Preview: ${previewData?.template?.title || "Template"}`}
        size="lg"
      >
        {previewData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={TYPE_COLORS[previewData.template.type] || "info"}>
                {previewData.template.type}
              </Badge>
              <Badge
                variant={previewData.template.is_active ? "success" : "neutral"}
              >
                {previewData.template.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {previewData.preview.title || previewData.template.title}
              </h3>
              <div className="prose max-w-none">
                <p className="text-neutral-700 whitespace-pre-wrap">
                  {renderPreviewMessage()}
                </p>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                Variables Used
              </h4>
              <div className="flex flex-wrap gap-2">
                {previewData.template.variables?.map((variable, idx) => (
                  <Badge key={idx} variant="info" size="sm">
                    {variable}
                  </Badge>
                ))}
                {(!previewData.template.variables ||
                  previewData.template.variables.length === 0) && (
                  <span className="text-xs text-neutral-400">
                    No variables used
                  </span>
                )}
              </div>
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                Sample Data
              </h4>
              <pre className="text-xs bg-neutral-900 text-neutral-100 p-3 rounded overflow-x-auto">
                {JSON.stringify(previewData.sampleData, null, 2)}
              </pre>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setIsPreviewModalOpen(false)}
              >
                Close Preview
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  setIsPreviewModalOpen(false);
                  handleOpenModal(previewData.template);
                }}
              >
                Edit Template
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
