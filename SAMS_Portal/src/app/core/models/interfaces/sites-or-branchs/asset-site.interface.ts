import { EntityBase } from "../EntityBase.interface";

export enum SiteOrBranch {
  Site = 1,
  Branch = 2
}

export interface AssetSite extends EntityBase{
  id: number;
  name: string;
  description?: string;
  city?: number;
  cityDisplay?: string;
  address?: string;
  type: SiteOrBranch;
  typeDisplay?: string;
  organizationId: string;
}

export interface AssetSiteRequest {
  id?: number;
  name: string;
  description?: string;
  city?: number;
  address?: string;
  type: SiteOrBranch;
}

/**
 * Helper function to get display text for SiteOrBranch enum
 */
export function getSiteOrBranchDisplay(type: SiteOrBranch): string {
  switch (type) {
    case SiteOrBranch.Site:
      return 'Site';
    case SiteOrBranch.Branch:
      return 'Branch';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function to get icon for SiteOrBranch enum
 */
export function getSiteOrBranchIcon(type: SiteOrBranch): string {
  switch (type) {
    case SiteOrBranch.Site:
      return 'domain';
    case SiteOrBranch.Branch:
      return 'account_tree';
    default:
      return 'business';
  }
}