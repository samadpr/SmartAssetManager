import { EntityBase } from "../EntityBase.interface";

export interface Company extends EntityBase {
    id: number;
    industriesId?: number | null;
    name?: string | null;
    logo?: string | null;
    currency?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
    fax?: string | null;
    website?: string | null;

    subscriptionId?: number | null;
    subscriptionDate?: Date | null;
    subscriptionExpiryDate?: Date | null;
    isActive?: boolean | null;

    organizationId: string | null;
}

export interface CompanyRequest {
    id?: number;
    industriesId?: number | null;
    name?: string | null;
    logo?: string | null;
    currency?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
    fax?: string | null;
    website?: string | null;

    subscription?: SubscriptionInfo;
}

export interface SubscriptionInfo {
    assetCount: number;
    systemUserCount: number;
    totalUserCount: number;
}


export interface CompanyWithUserInfo extends EntityBase {
    id: number;
    organizationId: string;
    industriesId?: number;

    name?: string;
    logo?: string;
    currency?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    fax?: string;
    website?: string;

    subscriptionId?: number;
    subscriptionDate?: string;
    subscriptionExpiryDate?: string;
    isActive: boolean;

    subscriptionPlan?: any;

    userInfo?: UserProfileInfo;
}

export interface UserProfileInfo {
    userProfileId: number;
    employeeId?: string;
    applicationUserId?: string;

    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;

    designation?: number;
    department?: number;
    subDepartment?: number;
    site?: number;
    area?: number;
    roleId?: number;

    designationName?: string;
    departmentName?: string;
    subDepartmentName?: string;
    siteName?: string;
    areaName?: string;
    roleName?: string;

    phoneNumber?: string;
    email?: string;
    isEmailConfirmed?: boolean;

    address?: string;
    country?: string;
    profilePicture?: string;
    isApprover?: number;
}