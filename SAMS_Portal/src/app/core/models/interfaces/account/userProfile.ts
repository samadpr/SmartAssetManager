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
  designationDisplay?: string;
  departmentDisplay?: string;
  subDepartmentDisplay?: string;
  siteDisplay?: string;
  locationDisplay?: string;
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
  location?: number;
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
  password: string;
  confirmPassword: string;
  roleId: number;
}

export interface UpdateLoginAccessRequest {
  userProfileId: number;
  email: string;
  oldPassword?: string;
  password?: string;
  confirmPassword?: string;
  roleId: number;
}