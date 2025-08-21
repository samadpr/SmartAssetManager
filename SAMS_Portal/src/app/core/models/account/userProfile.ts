export interface UserProfile {
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

export interface localStorageUserProfile {
  email: string;
  fullName: string;
  createdBy: string;
}
