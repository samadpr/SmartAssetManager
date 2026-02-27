import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';
import { ApprovalPipeline, AssetGrowth, AssetStatusDistribution, AssetValueByCategory, DepreciationSummary, IssueSummary, KpiStats, OpenIssueAlert, PendingApprovalAlert, RecentAsset, RecentUser, SiteAssetSummary, UserDistribution, WarrantyExpiring } from '../../models/interfaces/dashboard/dashboard.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) { }

  // 1️⃣ KPI
  getKpiStats() {
    return this.http.get<ApiResponse<KpiStats>>(
      `${this.baseUrl}/kpi-stats`
    );
  }

  // 2️⃣ Asset Status Distribution
  getAssetStatusDistribution(filter: string = 'all') {
    return this.http.get<ApiResponse<AssetStatusDistribution[]>>(
      `${this.baseUrl}/asset-status-distribution?filter=${filter}`
    );
  }

  // 3️⃣ Asset Growth
  getAssetGrowth(period: string = '1y') {
    return this.http.get<ApiResponse<AssetGrowth[]>>(
      `${this.baseUrl}/asset-growth?period=${period}`
    );
  }

  // 4️⃣ Asset Value By Category
  getAssetValueByCategory(sort: string = 'value') {
    return this.http.get<ApiResponse<AssetValueByCategory[]>>(
      `${this.baseUrl}/asset-value-by-category?sort=${sort}`
    );
  }

  // 5️⃣ Depreciation Summary
  getDepreciationSummary(groupBy: string = 'method') {
    return this.http.get<ApiResponse<DepreciationSummary[]>>(
      `${this.baseUrl}/depreciation-summary?groupBy=${groupBy}`
    );
  }

  // 6️⃣ Issue Summary
  getIssueSummary(groupBy: string = 'status') {
    return this.http.get<ApiResponse<IssueSummary[]>>(
      `${this.baseUrl}/issue-summary?groupBy=${groupBy}`
    );
  }

  // 7️⃣ User Distribution
  getUserDistribution(groupBy: string = 'department') {
    return this.http.get<ApiResponse<UserDistribution[]>>(
      `${this.baseUrl}/user-distribution?groupBy=${groupBy}`
    );
  }

  // 8️⃣ Approval Pipeline
  getApprovalPipeline() {
    return this.http.get<ApiResponse<ApprovalPipeline>>(
      `${this.baseUrl}/approval-pipeline`
    );
  }

  // 9️⃣ Sites Asset Summary
  getSitesAssetSummary(filter: string = 'all') {
    return this.http.get<ApiResponse<SiteAssetSummary[]>>(
      `${this.baseUrl}/sites-asset-summary?filter=${filter}`
    );
  }

  // 🔟 Recent Assets
  getRecentAssets(count: number = 6) {
    return this.http.get<ApiResponse<RecentAsset[]>>(
      `${this.baseUrl}/get-recent?count=${count}`
    );
  }

  // 1️⃣1️⃣ Recent Users
  getRecentUsers(count: number = 5) {
    return this.http.get<ApiResponse<RecentUser[]>>(
      `${this.baseUrl}/get-recent-users?count=${count}`
    );
  }

  // 1️⃣2️⃣ Pending Approval Alerts
  getPendingApprovalAlerts() {
    return this.http.get<ApiResponse<PendingApprovalAlert[]>>(
      `${this.baseUrl}/pending-approvals-alert`
    );
  }

  // 1️⃣3️⃣ Open Issue Alerts
  getOpenIssueAlerts() {
    return this.http.get<ApiResponse<OpenIssueAlert[]>>(
      `${this.baseUrl}/open-issues-alert`
    );
  }

  // 1️⃣4️⃣ Warranty Expiring
  getWarrantyExpiring(days: number = 90) {
    return this.http.get<ApiResponse<WarrantyExpiring[]>>(
      `${this.baseUrl}/get-warranty-expiring?days=${days}`
    );
  }
}
