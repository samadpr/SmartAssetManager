import { EntityBase } from "../EntityBase.interface";

export interface UserProfileData extends EntityBase{
  userProfileId: number;
  applicationUserId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  designation: number;
  department: number;
  subDepartment: number;
  site: number;
  location: number;
  joiningDate: string;
  leavingDate: string;
  phoneNumber: string;
  email: string;
  address: string;
  country: string;
  profilePicture: string;
  roleId: number;
  isApprover: number;
  level1Approval: boolean;
  level2Approval: boolean;
  level3Approval: boolean;
}

export interface UserProfileDetails extends EntityBase {
  userProfileId: number;
  applicationUserId?: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // ISO Date string from API
  designation: number;
  department: number;
  subDepartment: number;
  site: number;
  area: number;
  designationDisplay?: string;
  departmentDisplay?: string;
  subDepartmentDisplay?: string;
  siteDisplay?: string;
  areaDisplay?: string;
  roleIdDisplay?: string;
  roleId?: number;
  joiningDate?: string; // ISO Date string from API
  leavingDate?: string; // ISO Date string from API
  phoneNumber?: string;
  email?: string;
  isEmailVerified?: boolean;
  address?: string;
  country?: string;
  profilePicture?: string;
}


export interface localStorageUserProfile {
  email: string;
  fullName: string;
  createdBy: string;
}


export interface UserProfileRequest {
  userProfileId: number;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  designation?: number;
  department?: number;
  subDepartment?: number;
  site?: number;
  roleId?: number;
  area?: number;
  joiningDate?: Date;
  leavingDate?: Date;
  phoneNumber?: string;
  email?: string;
  isEmailConfirmed?: boolean;
  address?: string;
  country?: string;
  profilePicture?: string;
}

export interface LoginAccessRequest {
  userProfileId: number;
  email: string;
  isAllowLoginAccess: boolean;
  isPasswordCreated: boolean;
  password: string;
  confirmPassword: string;
  roleId: number;
  isPasswordSendInMail: boolean;
  sendMessage: string;
}

export interface UpdateLoginAccessRequest {
  userProfileId: number;
  email: string;
  oldPassword?: string;
  password?: string;
  confirmPassword?: string;
  roleId: number;
}


// -------------------------------------------------------------------------------

export interface UsersList {
  // ===== Base (TenantEntityBase – include if you use these on frontend)
  id?: number;
  organizationId?: string;
  createdDate?: string;
  createdBy?: string;
  modifiedDate?: string;
  modifiedBy?: string;

  // ===== User Identity
  userProfileId: number;
  employeeId?: string;
  applicationUserId?: string;

  // ===== Personal Info
  firstName?: string;
  lastName?: string;

  // ===== Designation
  designation?: number;
  designationDisplay?: string;

  // ===== Department
  department?: number;
  departmentDisplay?: string;

  // ===== Sub Department
  subDepartment?: number;
  subDepartmentDisplay?: string;

  // ===== Site
  site?: number;
  siteDisplay?: string;

  // ===== Area
  area?: number;
  areaDisplay?: string;

  // ===== Role
  roleId?: number;
  roleIdDisplay?: string;

  // ===== Contact
  phoneNumber?: string;
  email?: string;
  isEmailConfirmed?: boolean;

  // ===== Profile
  profilePicture?: string;

  // ===== Approver
  isApprover?: number; // 0 / 1 from backend
}