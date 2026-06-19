import { Injectable } from '@angular/core';
import { ApiResponse } from '../../../models/interfaces/ApiResponse.interface';
import { CompanyAuditLog, CompanyDetailResponse, CompanyLoginHistoryEntry, CompanyStats, LoginAccessUser } from '../../../models/admin/companies-details.interface';
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
 
    private params(companyId: number, orgId: string): HttpParams {
        return new HttpParams()
            .set('companyId', companyId.toString())
            .set('orgId', orgId);
    }
 
    /** Full page load — company, admin, subscription, stats, login users, history, audit logs */
    getCompanyDetail(companyId: number, orgId: string): Observable<ApiResponse<CompanyDetailResponse>> {
        return this.http.get<ApiResponse<CompanyDetailResponse>>(
            `${this.base}/get-company-detail`,
            { params: this.params(companyId, orgId) }
        );
    }
 
    /** Lightweight counts-only refresh */
    getCompanyStats(companyId: number, orgId: string): Observable<ApiResponse<CompanyStats>> {
        return this.http.get<ApiResponse<CompanyStats>>(
            `${this.base}/get-company-stats`,
            { params: this.params(companyId, orgId) }
        );
    }
 
    /** Login access users with aggregated session info */
    getCompanyLoginUsers(companyId: number, orgId: string): Observable<ApiResponse<LoginAccessUser[]>> {
        return this.http.get<ApiResponse<LoginAccessUser[]>>(
            `${this.base}/get-company-login-users`,
            { params: this.params(companyId, orgId) }
        );
    }
 
    /** Recent login history entries (session by session) */
    getCompanyLoginHistory(companyId: number, orgId: string, take = 50): Observable<ApiResponse<CompanyLoginHistoryEntry[]>> {
        const p = this.params(companyId, orgId).set('take', take.toString());
        return this.http.get<ApiResponse<CompanyLoginHistoryEntry[]>>(
            `${this.base}/get-company-login-history`, { params: p }
        );
    }
 
    /** Audit log entries for all users in the company */
    getCompanyAuditLogs(companyId: number, orgId: string, take = 100): Observable<ApiResponse<CompanyAuditLog[]>> {
        const p = this.params(companyId, orgId).set('take', take.toString());
        return this.http.get<ApiResponse<CompanyAuditLog[]>>(
            `${this.base}/get-company-audit-logs`, { params: p }
        );
    }
 
    /** Single company card refresh (for list page after subscription save) */
    getCompanyById(id: number): Observable<ApiResponse<CompanyWithUserInfo>> {
        return this.http.get<ApiResponse<CompanyWithUserInfo>>(
            `${this.base}/get-by-id?id=${id}`
        );
    }
 
    /** Toggle company active / suspended */
    toggleCompanyActive(companyId: number, orgId: string, activate: boolean): Observable<ApiResponse<null>> {
        return this.http.put<ApiResponse<null>>(
            `${this.base}/toggle-active`,
            { companyId, orgId, isActive: activate }
        );
    }
 
    /** Soft-delete company + subscription plan */
    deleteCompany(companyId: number, reason?: string): Observable<ApiResponse<null>> {
        return this.http.delete<ApiResponse<null>>(
            `${this.base}/delete`,
            { body: { companyId, reason } }
        );
    }
}
