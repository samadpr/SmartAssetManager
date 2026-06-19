/**
 * SAMS Permission Constants
 * These match exactly with the AspNetRoles names in the backend (RoleModels.cs)
 * Used throughout the application for role-based access control
 */
export const Permissions = {
  // Core System
  DASHBOARD: 'Dashboard',
  USER_PROFILE: 'User Profile',
  LOGIN_HISTORY: 'Login History',

  // User Management
  USER_MANAGEMENT: 'User Management',
  USER_INFO_FROM_BROWSER: 'User Info From Browser',
  MANAGE_PAGE_ACCESS: 'Manage Page Access',

  // System Administration
  AUDIT_LOGS: 'Audit Logs',
  SUBSCRIPTION_REQUEST: 'Subscription Request',
  EMAIL_SETTING: 'Email Setting',
  IDENTITY_SETTING: 'Identity Setting',

  // Asset Management
  ASSET: 'Asset',
  ASSET_APPROVAL: 'Asset Approval',
  ASSET_HISTORY: 'Asset History',
  COMMENT: 'Comment',
  PRINT_BARCODE: 'Print Barcode',
  PRINT_QRCODE: 'Print QRcode',

  // Human Resources
  EMPLOYEE: 'Employee',
  DESIGNATION: 'Designation',
  DEPARTMENT: 'Department',
  SUB_DEPARTMENT: 'Sub Department',

  // Asset Configuration
  ASSET_CATEGORIE: 'Asset Categorie',
  ASSET_SUB_CATEGORIE: 'Asset Sub Categorie',
  ASSET_SITE: 'Asset Site',
  ASSET_LOCATION: 'Asset Location',
  ASSET_STATUS: 'Asset Status',
  SUPPLIER: 'Supplier',

  // Company & Settings
  COMPANY_INFO: 'Company Info',

  // Reporting
  ASSET_INFO_REPORT: 'Asset Info Report',
  ASSET_CREATED_REPORT: 'Asset Created Report',
  ASSET_TRANSFER_REPORT: 'Asset Transfer Report',
  ASSET_DISPOSAL_REPORT: 'Asset Disposal Report',
  ASSET_STATUS_REPORT: 'Asset Status Report',
  ASSET_ALLOCATION_REPORT: 'Asset Allocation Report',

  // Requests & Issues
  REQUEST_MODULE: 'Request Module',
  ASSET_REQUEST: 'Asset Request',
  ASSET_ISSUE: 'Asset Issue',

  // Role Management
  SYSTEM_ROLE: 'System Role',
  MANAGE_USER_ROLES: 'Manage User Roles',

  // Special Roles (Admin bypass)
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

/**
 * Route → Required Permission mapping
 * Maps each Angular route path to the permission needed to access it
 */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  'dashboard': Permissions.DASHBOARD,
  'assets': Permissions.ASSET,
  'assets/suppliers': Permissions.SUPPLIER,
  'assets/asset-approve': Permissions.ASSET_APPROVAL,
  'assets/asset-issue': Permissions.ASSET_ISSUE,
  'assets/asset-qr-barcode': Permissions.PRINT_QRCODE,
  'assets/bulk-transfer': Permissions.ASSET,
  'assets/bulk-upload': Permissions.ASSET,
  'assets/site-branch-assets-overview': Permissions.ASSET_SITE,
  'asset-category': Permissions.ASSET_CATEGORIE,
  'asset-category/asset-sub-category': Permissions.ASSET_SUB_CATEGORIE,
  'sites-branchs': Permissions.ASSET_SITE,
  'sites-branchs/cities': Permissions.ASSET_SITE,
  'sites-branchs/areas': Permissions.ASSET_LOCATION,
  'manage-users': Permissions.USER_MANAGEMENT,
  'manage-users/login-access': Permissions.USER_MANAGEMENT,
  'manage-users/user-profile': Permissions.USER_MANAGEMENT,
  'manage-users/designations': Permissions.DESIGNATION,
  'department': Permissions.DEPARTMENT,
  'department/sub-department': Permissions.SUB_DEPARTMENT,
  'manage-roles': Permissions.MANAGE_USER_ROLES,
  'profile': Permissions.USER_PROFILE,
  'settings': Permissions.EMAIL_SETTING,
  'company': Permissions.COMPANY_INFO,
  'reports': Permissions.ASSET_INFO_REPORT,
  'reports/asset-reports': Permissions.ASSET_INFO_REPORT,
  'reports/asset-transfer-reports': Permissions.ASSET_TRANSFER_REPORT,
};