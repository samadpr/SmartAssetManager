import { EntityBase } from "../EntityBase.interface";

export interface Industry extends EntityBase{
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}