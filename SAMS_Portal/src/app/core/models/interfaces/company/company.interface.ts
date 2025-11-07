import { EntityBase } from "../EntityBase.interface";

export interface Company extends EntityBase{
    id: number;
    industriesId?: number | null;
    name?: string | null;
    logo?: string | null;
    currency?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
    fax?: string | null;
    website?: string | null;
    organizationId: string | null;
}

export interface CompanyRequest {
    id?: number;
    industriesId?: number | null;
    name?: string | null;
    logo?: string | null;
    currency?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
    fax?: string | null;
    website?: string | null;
}
