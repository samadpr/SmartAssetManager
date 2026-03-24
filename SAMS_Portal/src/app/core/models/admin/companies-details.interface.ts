// ──────────────────────────────────────────────────────────────────────────────
//  Company Detail Interfaces
//  File: src/app/core/models/interfaces/company/company-detail.interface.ts
// ──────────────────────────────────────────────────────────────────────────────

export interface CompanyDetailResponse {
    company: CompanyFullInfo;
    adminUser: AdminUserDetail | null;
    subscription: SubscriptionDetail | null;
    stats: CompanyStats;
    loginAccessUsers: LoginAccessUser[];
}

// ── Company ───────────────────────────────────────────────────────────────────
export interface CompanyFullInfo {
    id: number;
    organizationId: string;
    name: string;
    logo?: string;
    email?: string;
    phone?: string;
    fax?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    currency?: string;
    industriesId?: number;
    industryName?: string;
    subscriptionId?: number;
    subscriptionDate?: string;
    subscriptionExpiryDate?: string;
    createdDate: string;
    isActive: boolean;  
}

// ── Admin User ────────────────────────────────────────────────────────────────
export interface AdminUserDetail {
    userProfileId: number;
    applicationUserId?: string;
    employeeId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    address?: string;
    country?: string;
    profilePicture?: string;
    isEmailConfirmed: boolean;
    roleName?: string;
    designationName?: string;
    departmentName?: string;
    subDepartmentName?: string;
    siteName?: string;
    areaName?: string;
    joiningDate?: string;
    isApprover?: boolean;
}

// ── Subscription ──────────────────────────────────────────────────────────────
export interface SubscriptionDetail {
    subscriptionId: number;
    planName: string;
    planAmount: number;
    durationDays: number;
    startDate: string;
    endDate: string;
    isActive: boolean;   // true = subscription is currently valid/active
    daysRemaining: number;
    assetLimit: number;
    totalUserLimit: number;
    systemUserLimit: number;
    cardColor?: string;
    cardColorSecondary?: string;
    description?: string;
    badgeLabel?: string;
    isPlanActive: boolean;
}

// ── Stats ─────────────────────────────────────────────────────────────────────
// Overview-level counts only. Detailed asset breakdowns (inUse, damaged, etc.)
// and activity tracking (pendingApprovals, openIssues) are NOT included here —
// they are not needed for the admin company overview page.
export interface CompanyStats {
    // Asset overview
    totalAssets: number;

    // People overview
    totalUsers: number;
    systemUsers: number;   // users with login access granted

    // Module / master data counts (counts only — no list items returned)
    departments: number;
    subDepartments: number;
    designations: number;
    roles: number;
    sites: number;
    branches: number;
    areas: number;
    cities: number;
    suppliers: number;
    assetCategories: number;
    assetSubCategories: number;
}

// ── Login Access User ─────────────────────────────────────────────────────────
// Users who have been granted login access (ApplicationUserId IS NOT NULL).
// Includes login session tracking info for the admin overview.
export interface LoginAccessUser {
    userProfileId: number;
    applicationUserId?: string;
    employeeId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    profilePicture?: string;
    roleName?: string;
    designationName?: string;
    departmentName?: string;
    isEmailConfirmed: boolean;
    isActive: boolean;

    // Login session tracking
    lastLoginDate?: string;   // most recent successful login timestamp
    lastLogoutDate?: string;   // most recent logout timestamp (null if still logged in / not tracked)
    totalLoginCount: number;   // total number of logins ever recorded for this user

    createdDate: string;   // date login access was granted
}