import { EntityBase } from "../EntityBase.interface";

export interface AssetCity extends EntityBase {
  id: number;
  name: string;
  description?: string;
  organizationId?: string;
}
export interface AssetCityRequest {
  id?: number;
  name: string;
  description?: string;
}
