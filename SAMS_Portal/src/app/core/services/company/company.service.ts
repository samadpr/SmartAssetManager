import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';
import { Company, CompanyRequest, CompanyWithUserInfo } from '../../models/interfaces/company/company.interface';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private baseUrl = `${environment.apiUrl}/company`;

  constructor(private http: HttpClient) { }

  createCompany(request: CompanyRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${this.baseUrl}/add-company`,
      request
    );
  }

  // 🔹 Update Company
  updateCompany(request: CompanyRequest): Observable<ApiResponse<null>> {
    const formData = this.toFormData(request);

    return this.http.put<ApiResponse<null>>(
      `${this.baseUrl}/update-company`,
      formData
    );
  }

  // 🔹 Update Company With Subscription
  updateCompanyWithSubscription(request: CompanyRequest): Observable<ApiResponse<null>> {
    const formData = this.toFormData(request);

    return this.http.put<ApiResponse<null>>(
      `${this.baseUrl}/update-company-with-subscription`,
      formData
    );
  }

  // 🔹 Get My Companies
  getCurrentUserCompany(): Observable<ApiResponse<Company>> {
    return this.http.get<ApiResponse<Company>>(
      `${this.baseUrl}/get-company`
    );
  }

  // 🔹 Get Company by Id
  getCompanyById(id: number): Observable<ApiResponse<Company>> {
    return this.http.get<ApiResponse<Company>>(
      `${this.baseUrl}/get-company-by-id?id=${id}`
    );
  }

  // 🔹 Delete Company
  deleteCompany(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.baseUrl}/delete-company?id=${id}`
    );
  }

  getAllCompaniesWithUser(): Observable<ApiResponse<CompanyWithUserInfo[]>> {
    return this.http.get<ApiResponse<CompanyWithUserInfo[]>>(
      `${this.baseUrl}/get-all-companies-with-user`
    );
  }

  private toFormData(obj: any): FormData {
    const formData = new FormData();

    Object.entries(obj).forEach(([key, value]) => {
      if (value === null || value === undefined) return;

      // ✅ File
      if (value instanceof File) {
        formData.append(key, value, value.name);
        return;
      }

      // ✅ Date
      if (value instanceof Date) {
        formData.append(key, value.toISOString());
        return;
      }

      // ✅ Boolean
      if (typeof value === 'boolean') {
        formData.append(key, String(value));
        return;
      }

      // ✅ Number
      if (typeof value === 'number') {
        formData.append(key, String(value));
        return;
      }

      // ✅ String
      if (typeof value === 'string') {
        if (value.trim() !== '') {
          formData.append(key, value);
        }
        return;
      }

      // fallback
      formData.append(key, String(value));
    });

    return formData;
  }
}
