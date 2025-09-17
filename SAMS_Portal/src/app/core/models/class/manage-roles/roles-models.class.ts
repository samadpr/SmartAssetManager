// role-permissions.data.ts
export interface RolePermissionGroup {
  category: string;
  icon: string;
  permissions: RolePermission[];
}

export interface RolePermission {
  id: string;
  name: string;
  dbName: string;
  description: string;
  category: string;
}

export class RolePermissionsData {
  static readonly AVAILABLE_PERMISSIONS: RolePermission[] = [
    // Core System
    { id: 'Dashboard', name: 'Dashboard', dbName: 'Dashboard', description: 'Access to main dashboard and overview', category: 'Core System' },
    { id: 'UserProfile', name: 'User Profile', dbName: 'User Profile', description: 'View and edit user profile information', category: 'Core System' },
    { id: 'LoginHistory', name: 'Login History', dbName: 'Login History', description: 'View login history and session management', category: 'Core System' },

    // User Management
    { id: 'UserManagement', name: 'User Management', dbName: 'User Management', description: 'Create, edit, and manage user accounts', category: 'User Management' },
    { id: 'UserInfoFromBrowser', name: 'User Info From Browser', dbName: 'User Info From Browser', description: 'Access browser-based user information', category: 'User Management' },
    { id: 'ManagePageAccess', name: 'Manage Page Access', dbName: 'Manage Page Access', description: 'Control user access to different pages', category: 'User Management' },

    // System Administration
    { id: 'AuditLogs', name: 'Audit Logs', dbName: 'Audit Logs', description: 'View and manage system audit logs', category: 'System Administration' },
    { id: 'SubscriptionRequest', name: 'Subscription Request', dbName: 'Subscription Request', description: 'Handle subscription requests', category: 'System Administration' },
    { id: 'EmailSetting', name: 'Email Settings', dbName: 'Email Setting', description: 'Configure email settings and templates', category: 'System Administration' },
    { id: 'IdentitySetting', name: 'Identity Settings', dbName: 'Identity Setting', description: 'Manage identity and authentication settings', category: 'System Administration' },

    // Asset Management
    { id: 'Asset', name: 'Asset Management', dbName: 'Asset', description: 'Create, edit, and manage assets', category: 'Asset Management' },
    { id: 'AssetApproval', name: 'Asset Approval', dbName: 'Asset Approval', description: 'Approve or reject asset-related requests', category: 'Asset Management' },
    { id: 'AssetHistory', name: 'Asset History', dbName: 'Asset History', description: 'View asset history and tracking information', category: 'Asset Management' },
    { id: 'Comment', name: 'Asset Comments', dbName: 'Comment', description: 'Add and manage comments on assets', category: 'Asset Management' },
    { id: 'PrintBarcode', name: 'Print Barcode', dbName: 'Print Barcode', description: 'Generate and print asset barcodes', category: 'Asset Management' },
    { id: 'PrintQRcode', name: 'Print QR Code', dbName: 'Print QRcode', description: 'Generate and print asset QR codes', category: 'Asset Management' },

    // Human Resources
    { id: 'Employee', name: 'Employee Management', dbName: 'Employee', description: 'Manage employee information and records', category: 'Human Resources' },
    { id: 'Designation', name: 'Designation Management', dbName: 'Designation', description: 'Manage job designations and titles', category: 'Human Resources' },
    { id: 'Department', name: 'Department Management', dbName: 'Department', description: 'Manage organizational departments', category: 'Human Resources' },
    { id: 'SubDepartment', name: 'Sub Department Management', dbName: 'Sub Department', description: 'Manage sub-departments within departments', category: 'Human Resources' },

    // Asset Configuration
    { id: 'AssetCategorie', name: 'Asset Categories', dbName: 'Asset Categorie', description: 'Manage asset categories and classifications', category: 'Asset Configuration' },
    { id: 'AssetSubCategorie', name: 'Asset Sub Categories', dbName: 'Asset Sub Categorie', description: 'Manage asset sub-categories', category: 'Asset Configuration' },
    { id: 'AssetSite', name: 'Asset Sites', dbName: 'Asset Site', description: 'Manage asset site locations', category: 'Asset Configuration' },
    { id: 'AssetLocation', name: 'Asset Locations', dbName: 'Asset Location', description: 'Manage specific asset locations', category: 'Asset Configuration' },
    { id: 'AssetStatus', name: 'Asset Status', dbName: 'Asset Status', description: 'Manage asset status definitions', category: 'Asset Configuration' },
    { id: 'Supplier', name: 'Supplier Management', dbName: 'Supplier', description: 'Manage suppliers and vendor information', category: 'Asset Configuration' },

    // Company & Settings
    { id: 'CompanyInfo', name: 'Company Information', dbName: 'Company Info', description: 'Manage company profile and information', category: 'Company & Settings' },

    // Reporting
    { id: 'AssetInfoReport', name: 'Asset Info Report', dbName: 'Asset Info Report', description: 'Generate asset information reports', category: 'Reporting' },
    { id: 'AssetCreatedReport', name: 'Asset Created Report', dbName: 'Asset Created Report', description: 'Generate reports on newly created assets', category: 'Reporting' },
    { id: 'AssetTransferReport', name: 'Asset Transfer Report', dbName: 'Asset Transfer Report', description: 'Generate asset transfer reports', category: 'Reporting' },
    { id: 'AssetDisposalReport', name: 'Asset Disposal Report', dbName: 'Asset Disposal Report', description: 'Generate asset disposal reports', category: 'Reporting' },
    { id: 'AssetStatusReport', name: 'Asset Status Report', dbName: 'Asset Status Report', description: 'Generate asset status reports', category: 'Reporting' },
    { id: 'AssetAllocationReport', name: 'Asset Allocation Report', dbName: 'Asset Allocation Report', description: 'Generate asset allocation reports', category: 'Reporting' },

    // Requests & Issues
    { id: 'RequestModule', name: 'Request Module', dbName: 'Request Module', description: 'Access to request management system', category: 'Requests & Issues' },
    { id: 'AssetRequest', name: 'Asset Request', dbName: 'Asset Request', description: 'Handle asset requests from users', category: 'Requests & Issues' },
    { id: 'AssetIssue', name: 'Asset Issue', dbName: 'Asset Issue', description: 'Handle asset-related issues and tickets', category: 'Requests & Issues' },

    // Role Management
    { id: 'SystemRole', name: 'System Roles', dbName: 'System Role', description: 'Manage system roles and permissions', category: 'Role Management' },
    { id: 'ManageUserRoles', name: 'Manage User Roles', dbName: 'Manage User Roles', description: 'Assign and manage user roles', category: 'Role Management' },

    // Hidden Roles (not in categories)
    { id: 'Admin', name: 'Admin', dbName: 'Admin', description: 'Administrator role with elevated privileges', category: 'Hidden' },
    { id: 'SuperAdmin', name: 'Super Admin', dbName: 'Super Admin', description: 'Super Administrator role with full system privileges', category: 'Hidden' }
  ];

  static readonly PERMISSION_GROUPS: RolePermissionGroup[] = [
    {
      category: 'Core System',
      icon: 'dashboard',
      permissions: this.AVAILABLE_PERMISSIONS.filter(p => p.category === 'Core System')
    },
    {
      category: 'User Management',
      icon: 'people',
      permissions: this.AVAILABLE_PERMISSIONS.filter(p => p.category === 'User Management')
    },
    {
      category: 'System Administration',
      icon: 'settings',
      permissions: this.AVAILABLE_PERMISSIONS.filter(p => p.category === 'System Administration')
    },
    {
      category: 'Asset Management',
      icon: 'inventory',
      permissions: this.AVAILABLE_PERMISSIONS.filter(p => p.category === 'Asset Management')
    },
    {
      category: 'Human Resources',
      icon: 'badge',
      permissions: this.AVAILABLE_PERMISSIONS.filter(p => p.category === 'Human Resources')
    },
    {
      category: 'Asset Configuration',
      icon: 'tune',
      permissions: this.AVAILABLE_PERMISSIONS.filter(p => p.category === 'Asset Configuration')
    },
    {
      category: 'Company & Settings',
      icon: 'business',
      permissions: this.AVAILABLE_PERMISSIONS.filter(p => p.category === 'Company & Settings')
    },
    {
      category: 'Reporting',
      icon: 'assessment',
      permissions: this.AVAILABLE_PERMISSIONS.filter(p => p.category === 'Reporting')
    },
    {
      category: 'Requests & Issues',
      icon: 'support',
      permissions: this.AVAILABLE_PERMISSIONS.filter(p => p.category === 'Requests & Issues')
    },
    {
      category: 'Role Management',
      icon: 'admin_panel_settings',
      permissions: this.AVAILABLE_PERMISSIONS.filter(p => p.category === 'Role Management')
    }
    // Notice: "Hidden" category is NOT included → Admin & Super Admin won't show in groups
  ];

  static getPermissionById(id: string): RolePermission | undefined {
    return this.AVAILABLE_PERMISSIONS.find(p => p.id === id);
  }

  static getGroupByCategory(category: string): RolePermissionGroup | undefined {
    return this.PERMISSION_GROUPS.find(g => g.category === category);
  }

  static getAllPermissionIds(): string[] {
    return this.AVAILABLE_PERMISSIONS.map(p => p.id);
  }
}
