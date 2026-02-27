import { EntityBase } from "../EntityBase.interface";

export interface AssetIssue {
  id?: number;

  assetId: number;
  raisedByUserId?: number;   // backend sets from logged user (optional frontend)

  issueTitle?: string;
  issueDescription?: string;

  status?: number; // AssetIssueStatus enum value

  expectedFixDate?: Date | string;
  resolvedDate?: Date | string;

  repairCost?: number;

  invoiceFile?: File;        // 🔥 MUST MATCH BACKEND
  invoicePath?: string;      // 🔥 MUST MATCH BACKEND

  comment?: string;
}


export interface AssetIssueDetails extends EntityBase {
  id: number;

  assetId: number;
  assetName?: string;
  assetImageUrl?: string;

  raisedByUserId: number;
  raisedByUserName?: string;
  userImageUrl?: string;

  issueTitle?: string;
  issueDescription?: string;
  status?: number;

  expectedFixDate?: string;
  resolvedDate?: string;

  repairCost?: number;

  invoice?: string;   // 🔥 this is file path from backend
  comment?: string;
}

