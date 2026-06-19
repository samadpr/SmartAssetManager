import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AdminDashboardSummary, AdminKpiStats, AdminRecentCompany, AdminRecentUser, CompanyAssetSummary, CompanyGrowth, CompanyRevenue, MonthlyRevenue, RevenueOverview, SubscriptionPlanDistribution, SystemHealth } from '../../../models/admin/admin-dashboard.interface';
import { ApiResponse } from '../../../models/interfaces/ApiResponse.interface';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private baseUrl = `${environment.apiUrl}/admin/dashboard`;

  constructor(private http: HttpClient) { }

  /** Single consolidated call for initial load */
  getDashboardSummary() {
    return this.http.get<ApiResponse<AdminDashboardSummary>>(`${this.baseUrl}/summary`);
  }

  getKpiStats() {
    return this.http.get<ApiResponse<AdminKpiStats>>(`${this.baseUrl}/kpi-stats`);
  }

  getRevenueOverview() {
    return this.http.get<ApiResponse<RevenueOverview>>(`${this.baseUrl}/revenue-overview`);
  }

  getTopRevenueCompanies(count = 10) {
    return this.http.get<ApiResponse<CompanyRevenue[]>>(`${this.baseUrl}/top-revenue-companies?count=${count}`);
  }

  getRecentCompanies(count = 5) {
    return this.http.get<ApiResponse<AdminRecentCompany[]>>(`${this.baseUrl}/recent-companies?count=${count}`);
  }

  getMonthlyRevenue(months = 12) {
    return this.http.get<ApiResponse<MonthlyRevenue[]>>(`${this.baseUrl}/monthly-revenue?months=${months}`);
  }

  getCompanyGrowth(months = 12) {
    return this.http.get<ApiResponse<CompanyGrowth[]>>(`${this.baseUrl}/company-growth?months=${months}`);
  }

  getPlanDistribution() {
    return this.http.get<ApiResponse<SubscriptionPlanDistribution[]>>(`${this.baseUrl}/plan-distribution`);
  }

  getCompanyAssetSummary() {
    return this.http.get<ApiResponse<CompanyAssetSummary[]>>(`${this.baseUrl}/company-asset-summary`);
  }

  getRecentSystemUsers(count = 10) {
    return this.http.get<ApiResponse<AdminRecentUser[]>>(`${this.baseUrl}/recent-system-users?count=${count}`);
  }

  getSystemHealth() {
    return this.http.get<ApiResponse<SystemHealth>>(`${this.baseUrl}/system-health`);
  }
}
