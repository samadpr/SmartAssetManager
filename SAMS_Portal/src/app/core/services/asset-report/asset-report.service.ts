import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';
import { AssetDisposalReportDto, AssetReportDepreciationDto, AssetReportDto } from '../../models/interfaces/asset-report/assetReportDto.interface';
import { AssetCategory } from '../../models/interfaces/asset-category/asset-category.interface';
import { AssetSubCategory } from '../../models/interfaces/asset-category/asset-sub-category.interface';
import { Department, SubDepartmentDto } from '../../models/interfaces/department.interface';
import { AssetSite } from '../../models/interfaces/sites-or-branchs/asset-site.interface';
import { AssetArea } from '../../models/interfaces/sites-or-branchs/asset-area.interface';
import { Supplier } from '../../models/interfaces/asset-manage/supplier.interface';
import { AssetStatusDto } from '../../models/interfaces/asset-manage/asset-status.interface';

@Injectable({
  providedIn: 'root'
})
export class AssetReportService {
  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  // ---------------- REPORTS ----------------

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
