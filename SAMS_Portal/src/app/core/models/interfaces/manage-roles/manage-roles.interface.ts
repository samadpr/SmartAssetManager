// Import EntityBase if defined elsewhere
import { EntityBase } from '../EntityBase.interface';

export interface ManageRoleDetailsRequest {
  manageRoleId?: number;
  roleId?: string;
  roleName?: string;
  isAllowed: boolean;
}

export interface ManageUserRoleRequest {
  id?: number;
  name?: string;
  description?: string;
  rolePermissions?: ManageRoleDetailsRequest[];
}

export interface AspNetRoleDto {
  id: string;              // GUID (AspNetRoles.Id)
  name: string;            // friendly name (may be uppercase in DB)
}

export interface UserRoleRequest {
  name?: string;
  description?: string;
}


export interface ManageUserRolesDetailsDto extends EntityBase {
  id: number;
  manageRoleId: number;
  roleId?: string;
  roleName?: string;
  isAllowed: boolean;
}

export interface ManageUserRolesDto extends EntityBase {
  id: number;
  name?: string;
  description?: string;
  applicationUserId: string;
  rolePermissions?: ManageUserRolesDetailsDto[];
}
