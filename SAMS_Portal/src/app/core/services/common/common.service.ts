import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';
import { AssetCategory } from '../../models/interfaces/asset-category/asset-category.interface';
import { AssetSubCategory } from '../../models/interfaces/asset-category/asset-sub-category.interface';
import { Department, SubDepartmentDto } from '../../models/interfaces/department.interface';
import { AssetArea } from '../../models/interfaces/sites-or-branchs/asset-area.interface';
import { AssetSite } from '../../models/interfaces/sites-or-branchs/asset-site.interface';
import { Supplier } from '../../models/interfaces/asset-manage/supplier.interface';
import { AssetStatusDto } from '../../models/interfaces/asset-manage/asset-status.interface';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  // ---------------- FILTER MASTER DATA ----------------

  getCategoriesByOrg(): Observable<ApiResponse<AssetCategory[]>> {
    return this.http.get<ApiResponse<AssetCategory[]>>(
      `${this.baseUrl}/asset-category/get-by-org`
    );
  }

  getSubCategoriesByOrg(): Observable<ApiResponse<AssetSubCategory[]>> {
    return this.http.get<ApiResponse<AssetSubCategory[]>>(
      `${this.baseUrl}/asset-subcategory/get-by-org`
    );
  }

  getDepartmentsByOrg(): Observable<ApiResponse<Department[]>> {
    return this.http.get<ApiResponse<Department[]>>(
      `${this.baseUrl}/department/get-my-departments`
    );
  }

  getSubDepartmentsByOrg(): Observable<ApiResponse<SubDepartmentDto[]>> {
    return this.http.get<ApiResponse<SubDepartmentDto[]>>(
      `${this.baseUrl}/sub-department/get-sub-department`
    );
  }

  getSitesByOrg(): Observable<ApiResponse<AssetSite[]>> {
    return this.http.get<ApiResponse<AssetSite[]>>(
      `${this.baseUrl}/asset-sites-or-branch/get-by-org`
    );
  }

  getAreasByOrg(): Observable<ApiResponse<AssetArea[]>> {
    return this.http.get<ApiResponse<AssetArea[]>>(
      `${this.baseUrl}/asset-area/get-by-org`
    );
  }

  getSuppliersByOrg(): Observable<ApiResponse<Supplier[]>> {
    return this.http.get<ApiResponse<Supplier[]>>(
      `${this.baseUrl}/supplier/get-by-org`
    );
  }

  getStatusByOrg(): Observable<ApiResponse<AssetStatusDto[]>> {
    return this.http.get<ApiResponse<AssetStatusDto[]>>(
      `${this.baseUrl}/asset-status/get-by-org`
    );
  }
}
