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
} from "../../common";

export default function EmailTemplateManager() {
  const {
    emailTemplates,
    loading,
    error,
    pagination,
    fetchEmailTemplates,
    createEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
    clearError,
  } = useNotificationAdmin();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    htmlContent: "",
    textContent: "",
    variables: [],
    description: "",
    category: "general",
    isActive: true,
  });

  useEffect(() => {
    fetchEmailTemplates();
  }, []);

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        subject: template.subject,
        htmlContent: template.html_content,
        textContent: template.text_content || "",
        variables: template.variables || [],
        description: template.description || "",
        category: template.category || "general",
        isActive: template.is_active,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: "",
        subject: "",
        htmlContent: "",
        textContent: "",
        variables: [],
        description: "",
        category: "general",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let result;
    if (editingTemplate) {
      result = await updateEmailTemplate(editingTemplate.name, formData);
    } else {
      result = await createEmailTemplate(formData);
    }
    if (result) {
      setIsModalOpen(false);
      fetchEmailTemplates();
    }
  };

  const handleDelete = async (name) => {
    if (window.confirm(`Are you sure you want to delete template "${name}"?`)) {
      await deleteEmailTemplate(name);
      fetchEmailTemplates();
    }
  };

  if (loading && emailTemplates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Email Templates</h2>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          + Create Template
        </Button>
      </div>

      {error && (
        <Alert variant="error" title="Error" onClose={clearError}>
          {error}
        </Alert>
      )}

      {emailTemplates.length === 0 ? (
        <EmptyState
          title="No email templates"
          description="Create your first email template to get started"
          action={
            <Button variant="primary" onClick={() => handleOpenModal()}>
              Create Template
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table
            headers={["Name", "Subject", "Category", "Status", "Actions"]}
            data={emailTemplates}
            renderRow={(template) => (
              <tr key={template.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium">{template.name}</td>
                <td className="px-4 py-3">{template.subject}</td>
                <td className="px-4 py-3">
                  <Badge variant="info" size="sm">
                    {template.category}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={template.is_active ? "success" : "neutral"}>
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(template)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(template.name)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingTemplate ? "Edit Email Template" : "Create Email Template"
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Template Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={!!editingTemplate}
          />
          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            required
          />
          <Input
            label="Category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          />
          <Textarea
            label="HTML Content"
            value={formData.htmlContent}
            onChange={(e) =>
              setFormData({ ...formData, htmlContent: e.target.value })
            }
            rows={8}
            required
          />
          <Textarea
            label="Text Content (optional)"
            value={formData.textContent}
            onChange={(e) =>
              setFormData({ ...formData, textContent: e.target.value })
            }
            rows={4}
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
            />
            <label htmlFor="isActive" className="text-sm">
              Active
            </label>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" variant="primary" fullWidth>
              {editingTemplate ? "Update" : "Create"}
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
    </div>
  );
}
