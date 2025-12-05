import { EntityBase } from "../EntityBase.interface";

export interface Supplier extends EntityBase{
  id?: number;
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  tradeLicense?: string | File | null;
  address?: string;
}

export interface SupplierCreateRequest {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  tradeLicense?: File | null;
}

export interface SupplierUpdateRequest {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  tradeLicense?: File | null; // optional file
}
