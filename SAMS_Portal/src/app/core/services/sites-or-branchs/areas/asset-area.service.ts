import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../../models/interfaces/ApiResponse.interface';
import { Observable } from 'rxjs';
import { AssetArea, AssetAreaRequest } from '../../../models/interfaces/sites-or-branchs/asset-area.interface';

@Injectable({
  providedIn: 'root'
})
export class AssetAreaService {
  private baseUrl = `${environment.apiUrl}/asset-area`;

  constructor(private http: HttpClient) { }

  // ➕ CREATE Asset Area
  createArea(request: AssetAreaRequest): Observable<ApiResponse<AssetArea>> {
    return this.http.post<ApiResponse<AssetArea>>(
      `${this.baseUrl}/create`,
      request
    );
  }

  // ✏️ UPDATE Asset Area
  updateArea(request: AssetAreaRequest): Observable<ApiResponse<AssetArea>> {
    return this.http.put<ApiResponse<AssetArea>>(
      `${this.baseUrl}/update`,
      request
    );
  }

  // 📌 SUPER ADMIN: Get all areas (all organizations)
  getAllAreas(): Observable<ApiResponse<AssetArea[]>> {
    return this.http.get<ApiResponse<AssetArea[]>>(
      `${this.baseUrl}/get-all`
    );
  }

  // 📌 NORMAL USER: Get areas for logged-in user's organization
  getMyAreas(): Observable<ApiResponse<AssetArea[]>> {
    return this.http.get<ApiResponse<AssetArea[]>>(
      `${this.baseUrl}/get-by-org`
    );
  }

  // 📌 Get Areas by SiteId
  getAreasBySiteId(siteId: number): Observable<ApiResponse<AssetArea[]>> {
    return this.http.get<ApiResponse<AssetArea[]>>(
      `${this.baseUrl}/get-by-site-id?id=${siteId}`
    );
  }


  // ❌ SOFT DELETE AREA
  deleteArea(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.baseUrl}/delete?id=${id}`
    );
  }
}
