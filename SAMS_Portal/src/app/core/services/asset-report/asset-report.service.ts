import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';
import { AssetDisposalReportDto, AssetReportDepreciationDto, AssetReportDto } from '../../models/interfaces/asset-report/assetReportDto.interface';
import { BatchDetailApiResponse, BatchPagedApiResponse } from '../../models/interfaces/asset-report/asset-batch-report.interface';

@Injectable({
  providedIn: 'root'
})
export class AssetReportService {
  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  // ── NEW batch-aware endpoints ────────────────────────────────────────────
 
  /**
   * Main report grid — paged batch summaries.
   * @param page 1-based page number
   * @param pageSize records per page (default 20)
   */
  getBatchSummaryReport(page = 1, pageSize = 20): Observable<BatchPagedApiResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<BatchPagedApiResponse>(
      `${this.baseUrl}/asset-report/batch-summary`,
      { params }
    );
  }
 
  /**
   * Load units for a single expanded batch.
   */
  getBatchDetailReport(batchId: number): Observable<BatchDetailApiResponse> {
    const params = new HttpParams().set('batchId', batchId);
    return this.http.get<BatchDetailApiResponse>(
      `${this.baseUrl}/asset-report/batch-detail`,
      { params }
    );
  }
 
  /**
   * Paged depreciation report — only batches with depreciable units.
   */
  getDepreciationBatchReport(page = 1, pageSize = 20): Observable<BatchPagedApiResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<BatchPagedApiResponse>(
      `${this.baseUrl}/asset-report/depreciation-batches`,
      { params }
    );
  }
 
  /**
   * Paged disposal report — only batches with disposed units.
   */
  getDisposalBatchReport(page = 1, pageSize = 20): Observable<BatchPagedApiResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<BatchPagedApiResponse>(
      `${this.baseUrl}/asset-report/disposal-batches`,
      { params }
    );
  }
 
  /**
   * Full dataset for export/print — no pagination.
   * Call only when user triggers export action.
   */
  getFullExportData(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}/asset-report/export-full`
    );
  }
 
  // ── Legacy endpoints (kept for backward compat) ──────────────────────────
 
  getAssetFullInfoReport(): Observable<ApiResponse<AssetReportDto[]>> {
    return this.http.get<ApiResponse<AssetReportDto[]>>(
      `${this.baseUrl}/asset-report/asset-full-info-report`
    );
  }
 
  getAssetDepreciationReport(): Observable<ApiResponse<AssetReportDepreciationDto[]>> {
    return this.http.get<ApiResponse<AssetReportDepreciationDto[]>>(
      `${this.baseUrl}/asset-report/asset-depreciation-report`
    );
  }
 
  getAssetDisposalReport(): Observable<ApiResponse<AssetDisposalReportDto[]>> {
    return this.http.get<ApiResponse<AssetDisposalReportDto[]>>(
      `${this.baseUrl}/asset-report/asset-disposal-report`
    );
  }
}
