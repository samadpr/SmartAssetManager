import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { Observable } from 'rxjs';

export interface DesignationRequest {
  id?: number;
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DesignationService {
  private baseUrl = `${environment.apiUrl}/designation`; // Example: 'https://localhost:5001/api/'

  constructor(private http: HttpClient) {}

  // ➕ Create Designation
  createDesignation(request: DesignationRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/create-designation`, request);
  }

  // ✏️ Update Designation
  updateDesignation(request: DesignationRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/update-designation`, request);
  }

  // 📌 Get All Designations
  getDesignations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get-designations`);
  }

  // ❌ Delete Designation
  deleteDesignation(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/delete-designation?id=${id}`, { responseType: 'text' });
}

}
