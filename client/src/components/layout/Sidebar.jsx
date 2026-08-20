// Navigation items for sidebar
const navigationItems = [
  // ... existing items
  {
    label: "Webhooks",
    icon: WebhookIcon,
    path: "/webhooks/list",
    children: [
      {
        label: "Webhooks",
        path: "/webhooks/list",
      },
      {
        label: "Create Webhook",
        path: "/webhooks/create",
      },
    ],
  },
];

// In your navigation configuration
const navigationItems = [
  // ... existing items
  {
    label: "Notifications",
    icon: BellIcon,
    path: "/notifications",
    badge: unreadCount, // Display unread count
  },
];

// For admin menu
const adminNavigationItems = [
  // ... existing items
  {
    label: "Notification Admin",
    icon: SettingsIcon,
    path: "/admin/notifications",
    children: [
      {
        label: "Send Notification",
        path: "/admin/notifications/send",
      },
      {
        label: "Email Templates",
        path: "/admin/notifications/email-templates",
      },
      {
        label: "Notification Templates",
        path: "/admin/notifications/notification-templates",
      },
    ],
  },
];

// In your navigation configuration
const navigationItems = [
  // ... existing items
  {
    label: "API Logs",
    icon: LogsIcon,
    path: "/logs/list",
    children: [
      {
        label: "All Logs",
        path: "/logs/list",
      },
      {
        label: "Statistics",
        path: "/logs/statistics",
      },
      {
        label: "Export",
        path: "/logs/export",
      },
    ],
  },
];
// In your navigation configuration
const navigationItems = [
  {
    label: "Dashboard",
    icon: DashboardIcon,
    path: "/dashboard",
  },
  // ... existing items
  {
    label: "Bulk Upload",
    icon: UploadIcon,
    path: "/bulk-upload/uploads",
    children: [
      {
        label: "Uploads",
        path: "/bulk-upload/uploads",
      },
      {
        label: "Statistics",
        path: "/bulk-upload/stats",
      },
    ],
  },
  {
    label: "Profile",
    icon: UserIcon,
    path: "/settings/profile",
    children: [
      {
        label: "Profile",
        path: "/settings/profile",
      },
      {
        label: "Security",
        path: "/settings/security",
      },
      {
        label: "Preferences",
        path: "/settings/preferences",
      },
    ],
  },
  {
    label: "Statistics",
    icon: StatsIcon,
    path: "/statistics",
  },
  {
    label: "Activity",
    icon: ActivityIcon,
    path: "/activity",
  },
  // Admin only
  {
    label: "Admin",
    icon: AdminIcon,
    path: "/admin/users",
    roles: ["admin"],
    children: [
      {
        label: "User Management",
        path: "/admin/users",
      },
    ],
  },
];
// In your navigation configuration
const navigationItems = [
  // ... existing items
  {
    label: "Bulk Upload",
    icon: UploadIcon,
    path: "/bulk-upload/uploads",
    children: [
      {
        label: "Uploads",
        path: "/bulk-upload/uploads",
      },
      {
        label: "Statistics",
        path: "/bulk-upload/stats",
      },
    ],
  },
  {
    label: "System",
    icon: SettingsIcon,
    path: "/system/overview",
    children: [
      {
        label: "Overview",
        path: "/system/overview",
      },
      {
        label: "Health",
        path: "/system/health",
      },
      {
        label: "Settings",
        path: "/system/settings",
      },
      {
        label: "Metrics",
        path: "/system/metrics",
      },
      {
        label: "Logs",
        path: "/system/logs",
      },
    ],
    adminOnly: true, // Only show to admins
  },
];
// In your navigation configuration
const navigationItems = [
  // ... existing items
  {
    label: "Bulk Upload",
    icon: UploadIcon,
    path: "/bulk-upload/uploads",
    children: [
      {
        label: "Uploads",
        path: "/bulk-upload/uploads",
      },
      {
        label: "Statistics",
        path: "/bulk-upload/stats",
      },
    ],
  },
];
