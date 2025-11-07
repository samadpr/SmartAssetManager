import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IndustriesService {
  private baseUrl = `${environment.apiUrl}/industries`;

  constructor(private http: HttpClient) { }

  // 🔹 Get All Industries
  getAllIndustries(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/get-industries`);
  }
}
