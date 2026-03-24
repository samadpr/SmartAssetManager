import { Injectable } from '@angular/core';
import { Company } from '../../../models/interfaces/company/company.interface';

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
