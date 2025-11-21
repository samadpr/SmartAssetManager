import { EntityBase } from "../EntityBase.interface";

export interface AssetSubCategory extends EntityBase {
  id: number;
  assetCategorieId: number;
  assetCategorieDisplay?: string;
  name: string;
  description?: string;
  organizationId: string;
}

export interface AssetSubCategoryRequest {
  id?: number;
  assetCategorieId: number;
  name: string;
  description?: string;
}