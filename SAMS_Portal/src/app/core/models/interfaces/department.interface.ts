import { EntityBase } from "./EntityBase.interface";

export interface Department extends EntityBase{
    id: number;
    name: string;
    description?: string;
}

export interface DepartmentRequest {
  id: number;
  name?: string;
  description?: string;
}

export interface SubDepartmentDto {
  id: number;
  departmentId: number;
  departmentDisplay?: string;
  name?: string;
  description?: string;
}

export interface DepartmentWithSubDepartmentsDto {
  id: number;
  name?: string;
  description?: string;
  subDepartments: SubDepartmentDto[];
}


export interface SubDepartmentRequest {
  id: number;
  departmentId: number;
  name?: string;
  description?: string;
}
