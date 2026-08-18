// src/components/url/UrlList.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Input,
  Table,
  Badge,
  Pagination,
  SearchBar,
  EmptyState,
  LoadingSpinner,
  Alert,
  Dropdown,
  DropdownItem,
} from "../common";
import useUrl from "../../hooks/useUrl";
import {
  formatDate,
  getStatusBadgeVariant,
  truncateText,
} from "../../utils/helpers";

const UrlList = () => {
  const navigate = useNavigate();
  const { tag } = useParams();
  const {
    urls,
    loading,
    error,
    pagination,
    filters,
    loadUrls,
    deleteUrl,
    getUrlsByTag,
    changePage,
    resetFilters,
  } = useUrl();

  const [selectedUrls, setSelectedUrls] = useState([]);
  const [searchQuery, setSearchQuery] = useState(filters.search || "");
  const [statusFilter, setStatusFilter] = useState(filters.status || "");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [urlToDelete, setUrlToDelete] = useState(null);

  // Load URLs on mount and when tag changes
  useEffect(() => {
    if (tag) {
      getUrlsByTag(tag);
    } else {
      loadUrls(1, { ...filters, search: searchQuery, status: statusFilter });
    }
  }, [tag]);

  // Handle search
  const handleSearch = (value) => {
    setSearchQuery(value);
    loadUrls(1, { ...filters, search: value, status: statusFilter });
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    loadUrls(1, { ...filters, search: searchQuery, status });
  };

  // Handle delete
  const handleDelete = async () => {
    if (!urlToDelete) return;
    try {
      await deleteUrl(urlToDelete.id);
      setShowDeleteModal(false);
      setUrlToDelete(null);
    } catch (err) {
      // Error handled by hook
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    // Implementation for bulk delete
    // Note: Backend doesn't have bulk delete endpoint yet
    // You might want to implement one or handle individually
  };

  // Table headers
  const headers = [
    { key: "title", label: "Title" },
    { key: "short_code", label: "Short Code" },
    { key: "original_url", label: "Original URL" },
    { key: "click_count", label: "Clicks" },
    { key: "status", label: "Status" },
    { key: "created_at", label: "Created" },
    { key: "actions", label: "Actions" },
  ];

  // Table data
  const tableData = urls.map((url) => ({
    ...url,
    title: (
      <div>
        <div className="font-medium">
          {truncateText(url.title || url.original_url, 30)}
        </div>
        {url.tags && (
          <div className="flex flex-wrap gap-1 mt-1">
            {url.tags.split(",").map((tag, index) => (
              <Badge key={index} variant="neutral" size="sm">
                {tag.trim()}
              </Badge>
            ))}
          </div>
        )}
      </div>
    ),
    short_code: (
      <div className="flex items-center gap-2">
        <span className="text-primary-600 font-medium">{url.short_code}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigator.clipboard.writeText(url.short_url)}
        >
          📋
        </Button>
      </div>
    ),
    original_url: (
      <a
        href={url.original_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-neutral-600 hover:text-primary-600 truncate block max-w-[200px]"
      >
        {url.original_url}
      </a>
    ),
    click_count: (
      <div className="text-center">
        <span className="font-semibold">{url.click_count}</span>
      </div>
    ),
    status: (
      <Badge variant={getStatusBadgeVariant(url.status)}>{url.status}</Badge>
    ),
    created_at: formatDate(url.created_at),
    actions: (
      <div className="flex items-center gap-2">
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              ⚙️
            </Button>
          }
        >
          <DropdownItem onClick={() => navigate(`/urls/${url.id}`)}>
            🔍 View Details
          </DropdownItem>
          <DropdownItem onClick={() => navigate(`/urls/${url.id}/edit`)}>
            ✏️ Edit
          </DropdownItem>
          <DropdownItem onClick={() => navigate(`/urls/${url.id}/analytics`)}>
            📊 Analytics
          </DropdownItem>
          <DropdownItem onClick={() => navigate(`/urls/${url.id}/stats`)}>
            📈 Statistics
          </DropdownItem>
          <DropdownItem
            onClick={() => {
              setUrlToDelete(url);
              setShowDeleteModal(true);
            }}
            className="text-error"
            disabled={url.status === "blocked"}
          >
            🗑️ Delete
          </DropdownItem>
        </Dropdown>
      </div>
    ),
  }));

  // Empty state
  if (!loading && urls.length === 0 && !error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My URLs</h1>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => navigate("/urls/create")}>
              + Create URL
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/urls/bulk-create")}
            >
              Bulk Create
            </Button>
          </div>
        </div>
        <EmptyState
          title={tag ? "No URLs found with this tag" : "No URLs created yet"}
          description={
            tag
              ? "Try a different tag or create a new URL."
              : "Create your first short URL now!"
          }
          action={
            <Button variant="primary" onClick={() => navigate("/urls/create")}>
              Create URL
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">
          {tag ? `URLs with tag: ${tag}` : "My URLs"}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => navigate("/urls/create")}>
            + Create URL
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/urls/bulk-create")}
          >
            Bulk Create
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={() => handleSearch(searchQuery)}
            placeholder="Search by URL, title, or description..."
            fullWidth
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
            <option value="flagged">Flagged</option>
            <option value="expired">Expired</option>
          </select>
          <Button variant="ghost" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" className="mb-4" onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Table */}
      {!loading && urls.length > 0 && (
        <>
          <Table headers={headers} data={tableData} variant="striped" />

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-neutral-600">
                Showing {urls.length} of {pagination.total} URLs
              </div>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={changePage}
                siblingCount={1}
              />
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && urlToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Delete URL</h2>
            <p className="text-neutral-600 mb-6">
              Are you sure you want to delete "
              {truncateText(urlToDelete.title || urlToDelete.original_url, 50)}
              "? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrlList;
