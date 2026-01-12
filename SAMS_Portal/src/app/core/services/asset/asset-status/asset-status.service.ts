import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssetStatusDto } from '../../../models/interfaces/asset-manage/asset-status.interface';
import { ApiResponse } from '../../../models/interfaces/ApiResponse.interface';

@Injectable({
  providedIn: 'root'
})
export class AssetStatusService {
  private baseUrl = `${environment.apiUrl}/asset-status`;

  constructor(private http: HttpClient) { }

  getByOrganization(): Observable<ApiResponse<AssetStatusDto[]>> {
    return this.http.get<ApiResponse<AssetStatusDto[]>>(
      `${this.baseUrl}/get-by-org`
    );
  }
}
