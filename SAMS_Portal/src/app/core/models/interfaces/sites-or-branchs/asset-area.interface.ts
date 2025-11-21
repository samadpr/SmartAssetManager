import { EntityBase } from "../EntityBase.interface";

export interface AssetAreaRequest {
  id?: number;
  siteId?: number;
  name: string;
  description?: string;
}

export interface AssetArea extends EntityBase{
  id: number;
  siteId?: number;
  siteDisplay?: string;
  name: string;
  description?: string;

  organizationId: string;
}
