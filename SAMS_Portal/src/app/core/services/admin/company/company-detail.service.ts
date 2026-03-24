import { Injectable } from '@angular/core';
import { ApiResponse } from '../../../models/interfaces/ApiResponse.interface';
import { CompanyDetailResponse, CompanyStats, LoginAccessUser } from '../../../models/admin/companies-details.interface';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment.development';
import { CompanyWithUserInfo } from '../../../models/interfaces/company/company.interface';

@Injectable({
  providedIn: 'root'
})
export class CompanyDetailService {

  private base = `${environment.apiUrl}/admin/company`;

  constructor(private http: HttpClient) { }

  /**
   * Builds HttpParams with both companyId and orgId so the backend
   * can look up the company and scope all queries by organizationId
   * in a single step without an extra JOIN.
   */
  private params(companyId: number, orgId: string): HttpParams {
    return new HttpParams()
      .set('companyId', companyId.toString())
      .set('orgId', orgId);
  }

  /**
   * GET /company/get-company-detail?companyId=&orgId=
   * Returns: company info + admin user + subscription + overview stats + login users.
   * Stats contains counts only (no detailed asset breakdowns or activity tracking).
   */
  getCompanyDetail(companyId: number, orgId: string): Observable<ApiResponse<CompanyDetailResponse>> {
    return this.http.get<ApiResponse<CompanyDetailResponse>>(
      `${this.base}/get-company-detail`,
      { params: this.params(companyId, orgId) }
    );
  }

  /**
   * GET /company/get-company-stats?companyId=&orgId=
   * Lightweight endpoint — returns only overview counts (totalAssets, totalUsers,
   * systemUsers, and all module/master data counts).
   */
  getCompanyStats(companyId: number, orgId: string): Observable<ApiResponse<CompanyStats>> {
    return this.http.get<ApiResponse<CompanyStats>>(
      `${this.base}/get-company-stats`,
      { params: this.params(companyId, orgId) }
    );
  }

  /**
   * GET /company/get-company-login-users?companyId=&orgId=
   * Returns all users with login access, including session tracking:
   * lastLoginDate, lastLogoutDate, totalLoginCount.
   */
  getCompanyLoginUsers(companyId: number, orgId: string): Observable<ApiResponse<LoginAccessUser[]>> {
    return this.http.get<ApiResponse<LoginAccessUser[]>>(
      `${this.base}/get-company-login-users`,
      { params: this.params(companyId, orgId) }
    );
  }

  getCompanyById(id: number): Observable<ApiResponse<CompanyWithUserInfo>> {
    return this.http.get<ApiResponse<CompanyWithUserInfo>>(
      `${this.base}/get-by-id?id=${id}`
    );
  }

  /**
   * PUT /company/toggle-active
   * Flips Company.IsSubscriptionActive in the database.
   * Backend does NOT touch AspNetUsers lockout — only the IsSubscriptionActive column changes.
   */
  toggleCompanyActive(companyId: number, orgId: string, activate: boolean): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(
      `${this.base}/toggle-active`,
      { companyId, orgId, isActive: activate }
    );
  }
}
