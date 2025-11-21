import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { AssetSite, AssetSiteRequest } from '../../models/interfaces/sites-or-branchs/asset-site.interface';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SitesOrBranchesService {
  private baseUrl = `${environment.apiUrl}/asset-sites-or-branch`;

  constructor(private http: HttpClient) { }

  // ➕ CREATE Branch/Site
  createSite(request: AssetSiteRequest): Observable<ApiResponse<AssetSite>> {
    return this.http.post<ApiResponse<AssetSite>>(
      `${this.baseUrl}/create`,
      request
    );
  }

  // ✏️ UPDATE Branch/Site
  updateSite(request: AssetSiteRequest): Observable<ApiResponse<AssetSite>> {
    return this.http.put<ApiResponse<AssetSite>>(
      `${this.baseUrl}/update`,
      request
    );
  }

  // 📌 SUPER ADMIN: Get all branches/sites (not filtered)
  getAllSites(): Observable<ApiResponse<AssetSite[]>> {
    return this.http.get<ApiResponse<AssetSite[]>>(
      `${this.baseUrl}/get-all`
    );
  }

  // 📌 NORMAL USER: Get branches/sites of logged-in Organization
  getMySites(): Observable<ApiResponse<AssetSite[]>> {
    return this.http.get<ApiResponse<AssetSite[]>>(
      `${this.baseUrl}/get-by-org`
    );
  }

  // 📌 Get Sites/Branches by CityId
  getSitesByCityId(cityId: number): Observable<ApiResponse<AssetSite[]>> {
    return this.http.get<ApiResponse<AssetSite[]>>(
      `${this.baseUrl}/get-by-city-id?id=${cityId}`
    );
  }

  // ❌ DELETE Branch/Site (soft delete)
  deleteSite(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.baseUrl}/delete?id=${id}`
    );
  }
}
