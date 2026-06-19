import { Injectable } from '@angular/core';
import { Company } from '../../../models/interfaces/company/company.interface';
import { Subscriptions } from '../../../models/admin/subscriptions.interface';

@Injectable({
  providedIn: 'root'
})
export class CompanyStorageService {
  private readonly KEY = 'company_info';

  save(company: Partial<Company>): void {
    if (company) {
      localStorage.setItem(this.KEY, JSON.stringify(company));
    }
  }

  get(): Company | null {
    const data = localStorage.getItem(this.KEY);
    return data ? JSON.parse(data) as Company : null;
  }

  getOrganizationId(): string | null {
    const company = this.get();
    return company?.organizationId ?? null;
  }

  getCurrency(): string | null {
    const company = this.get();
    return company?.currency ?? null;
  }

  getCompanyName(): string | null {
    const company = this.get();
    return company?.name ?? null;
  }

  clear(): void {
    localStorage.removeItem(this.KEY);
  }
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionStorageService {

  constructor(private companyStorage: CompanyStorageService) { }

  private getSubscription(): Subscriptions | null {
    const company = this.companyStorage.get();
    return company?.subscriptionPlan ?? null;
  }

  getPlanName(): string | null {
    return this.getSubscription()?.name ?? null;
  }

  getAssetLimit(): number {
    return this.getSubscription()?.assetLimit ?? 0;
  }

  getSystemUserLimit(): number {
    return this.getSubscription()?.systemUserLimit ?? 0;
  }

  getTotalUserLimit(): number {
    return this.getSubscription()?.totalUserLimit ?? 0;
  }

  getPlanAmount(): number {
    return this.getSubscription()?.planAmount ?? 0;
  }

  getDurationDays(): number {
    return this.getSubscription()?.durationDays ?? 0;
  }

  isPlanActive(): boolean {
    return this.getSubscription()?.isPlanActive ?? false;
  }

  hasSubscription(): boolean {
    return !!this.getSubscription();
  }
}