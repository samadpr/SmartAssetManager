import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { AssetSubCategory, AssetSubCategoryRequest } from '../../../models/interfaces/asset-category/asset-sub-category.interface';
import { ApiResponse } from '../../../models/interfaces/ApiResponse.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AssetSubCategoriesService {
  private baseUrl = `${environment.apiUrl}/asset-subcategory`;

  constructor(private http: HttpClient) { }

   // ➕ CREATE
  createSubCategory(
    request: AssetSubCategoryRequest
  ): Observable<ApiResponse<AssetSubCategory>> {
    return this.http.post<ApiResponse<AssetSubCategory>>(
      `${this.baseUrl}/create`,
      request
    );
  }

  // ✏️ UPDATE
  updateSubCategory(
    request: AssetSubCategoryRequest
  ): Observable<ApiResponse<AssetSubCategory>> {
    return this.http.put<ApiResponse<AssetSubCategory>>(
      `${this.baseUrl}/update`,
      request
    );
  }

  // 📌 GET ALL (SuperAdmin)
  getAllSubCategories(): Observable<ApiResponse<AssetSubCategory[]>> {
    return this.http.get<ApiResponse<AssetSubCategory[]>>(
      `${this.baseUrl}/get-all`
    );
  }

  // 📌 GET BY ORG
  getSubCategoriesByOrg(): Observable<ApiResponse<AssetSubCategory[]>> {
    return this.http.get<ApiResponse<AssetSubCategory[]>>(
      `${this.baseUrl}/get-by-org`
    );
  }

    // 📌 GET BY CATEGORY ID (NEW API)
  getSubCategoriesByCategoryId(categoryId: number): Observable<ApiResponse<AssetSubCategory[]>> {
    return this.http.get<ApiResponse<AssetSubCategory[]>>(
      `${this.baseUrl}/get-by-category-id?id=${categoryId}`
    );
  }

  // ❌ DELETE
  deleteSubCategory(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.baseUrl}/delete?id=${id}`
    );
  }
}
