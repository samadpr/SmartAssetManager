import { EntityBase } from "../EntityBase.interface";

export interface Industry extends EntityBase{
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}