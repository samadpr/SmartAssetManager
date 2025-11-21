import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { AssetCategory, AssetCategoryRequest } from '../../models/interfaces/asset-category/asset-category.interface';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';

@Injectable({
  providedIn: 'root'
})
export class AssetCategoriesService {
  private baseUrl = `${environment.apiUrl}/asset-category`;

  constructor(private http: HttpClient) { }

  // ➕ CREATE
  createCategory(request: AssetCategoryRequest): Observable<ApiResponse<AssetCategory>> {
    return this.http.post<ApiResponse<AssetCategory>>(
      `${this.baseUrl}/create`,
      request
    );
  }

  // ✏️ UPDATE
  updateCategory(request: AssetCategoryRequest): Observable<ApiResponse<AssetCategory>> {
    return this.http.put<ApiResponse<AssetCategory>>(
      `${this.baseUrl}/update`,
      request
    );
  }

  // 📌 GET ALL (SuperAdmin use)
  getAllCategories(): Observable<ApiResponse<AssetCategory[]>> {
    return this.http.get<ApiResponse<AssetCategory[]>>(
      `${this.baseUrl}/get-all`
    );
  }

  // 📌 GET BY ORG
  getCategoriesByOrg(): Observable<ApiResponse<AssetCategory[]>> {
    return this.http.get<ApiResponse<AssetCategory[]>>(
      `${this.baseUrl}/get-by-org`
    );
  }

  // ❌ DELETE
  deleteCategory(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.baseUrl}/delete?id=${id}`
    );
  }
}
