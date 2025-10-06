import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SubDepartmentDto, SubDepartmentRequest } from '../../../models/interfaces/department.interface';
import { ApiResponse } from '../../../models/interfaces/ApiResponse.interface';

@Injectable({
  providedIn: 'root'
})
export class SubDepartmentService {
  private baseUrl = `${environment.apiUrl}/sub-department`;

  constructor(private http: HttpClient) { }

  // 🔹 Create Sub-Department
  createSubDepartment(request: SubDepartmentRequest): Observable<ApiResponse<SubDepartmentDto>> {
    return this.http.post<ApiResponse<SubDepartmentDto>>(
      `${this.baseUrl}/create`,
      request
    );
  }

  // 🔹 Update Sub-Department
  updateSubDepartment(request: SubDepartmentRequest): Observable<ApiResponse<SubDepartmentDto>> {
    return this.http.put<ApiResponse<SubDepartmentDto>>(
      `${this.baseUrl}/update`,
      request
    );
  }

  // 🔹 Get All Sub-Departments
  getSubDepartments(): Observable<ApiResponse<SubDepartmentDto[]>> {
    return this.http.get<ApiResponse<SubDepartmentDto[]>>(
      `${this.baseUrl}/get-sub-department`
    );
  }

  // 🔹 Get Sub-Departments by DepartmentId
  getSubDepartmentsByDepartmentId(departmentId: number): Observable<ApiResponse<SubDepartmentDto[]>> {
    return this.http.get<ApiResponse<SubDepartmentDto[]>>(
      `${this.baseUrl}/get-by-department-id?id=${departmentId}`
    );
  }

  // 🔹 Delete Sub-Department
  deleteSubDepartment(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/delete?id=${id}`
    );
  }
}
