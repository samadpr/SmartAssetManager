import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { AssetCity, AssetCityRequest } from '../../../models/interfaces/sites-or-branchs/cities.interface';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../models/interfaces/ApiResponse.interface';

@Injectable({
  providedIn: 'root'
})
export class CitiesService {
  private baseUrl = `${environment.apiUrl}/asset-cities`;

  constructor(private http: HttpClient) { }

  // ➕ Create City
  createCity(request: AssetCityRequest): Observable<ApiResponse<AssetCity>> {
    return this.http.post<ApiResponse<AssetCity>>(
      `${this.baseUrl}/create`,
      request
    );
  }

  // ✏️ Update City
  updateCity(request: AssetCityRequest): Observable<ApiResponse<AssetCity>> {
    return this.http.put<ApiResponse<AssetCity>>(
      `${this.baseUrl}/update`,
      request
    );
  }

  // 📌 Get All (SuperAdmin only)
  getAllCities(): Observable<ApiResponse<AssetCity[]>> {
    return this.http.get<ApiResponse<AssetCity[]>>(
      `${this.baseUrl}/get-all`
    );
  }

  // 📌 Get Cities by Organization ID (normal user)
  getMyCities(): Observable<ApiResponse<AssetCity[]>> {
    return this.http.get<ApiResponse<AssetCity[]>>(
      `${this.baseUrl}/get-all-by-OrganizationId`
    );
  }

  // ❌ Soft Delete City
  deleteCity(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.baseUrl}/delete?id=${id}`
    );
  }
}

