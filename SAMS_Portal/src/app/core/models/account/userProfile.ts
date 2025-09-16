export interface UserProfileData {
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

  // From EntityBase
  createdDate: string;
  modifiedDate: string;
  createdBy: string;
  modifiedBy: string;
  cancelled: boolean;
}

export interface UserProfileDetails {
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
  joiningDate?: string; // ISO Date string from API
  leavingDate?: string; // ISO Date string from API
  phoneNumber?: string;
  email?: string;
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
  location?: number;
  joiningDate?: Date;
  leavingDate?: Date;
  phoneNumber?: string;
  email?: string;
  address?: string;
  country?: string;
  profilePicture?: string;
}