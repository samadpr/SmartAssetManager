import { EntityBase } from "../EntityBase.interface";

export interface AssetCategory extends EntityBase {
  id: number;
  name: string;
  description?: string;
  organizationId: string;
}

export interface AssetCategoryRequest {
  id?: number;
  name: string;
  description?: string;
}