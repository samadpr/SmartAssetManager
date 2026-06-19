import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../models/interfaces/ApiResponse.interface';
import { AssetTransferHistoryDto, OrganisationTransferReportDto, OrganisationTransferSummaryDto } from '../../../models/interfaces/asset-report/asset-transfer-report.interface';

@Injectable({
  providedIn: 'root'
})
export class AssetTransferReportService {

  private baseUrl = `${environment.apiUrl}/asset-transfer-report`;

  constructor(private http: HttpClient) { }

  /** Full transfer history for one asset by its numeric row id */
  getByAssetRowId(assetRowId: number): Observable<ApiResponse<AssetTransferHistoryDto>> {
    const params = new HttpParams().set('assetRowId', assetRowId);
    return this.http.get<ApiResponse<AssetTransferHistoryDto>>(
      `${this.baseUrl}/by-id`, { params }
    );
  }
 
  /** Full transfer history for one asset by its business AssetId string (e.g. AST-000001) */
  getByAssetId(assetId: string): Observable<ApiResponse<AssetTransferHistoryDto>> {
    const params = new HttpParams().set('assetId', assetId);
    return this.http.get<ApiResponse<AssetTransferHistoryDto>>(
      `${this.baseUrl}/by-asset-id`, { params }
    );
  }
 
  /** Full organisation report — every asset with complete chain */
  getOrganisationReport(): Observable<ApiResponse<OrganisationTransferReportDto>> {
    return this.http.get<ApiResponse<OrganisationTransferReportDto>>(
      `${this.baseUrl}/organisation`
    );
  }
 
  /** Summary counts only — fast endpoint for dashboard widgets */
  getOrganisationSummary(): Observable<ApiResponse<OrganisationTransferSummaryDto>> {
    return this.http.get<ApiResponse<OrganisationTransferSummaryDto>>(
      `${this.baseUrl}/organisation-summary`
    );
  }
}
