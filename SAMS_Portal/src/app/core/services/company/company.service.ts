import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';
import { Company, CompanyRequest } from '../../models/interfaces/company/company.interface';

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
    return this.http.put<ApiResponse<null>>(
      `${this.baseUrl}/update-company`,
      request
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
}
