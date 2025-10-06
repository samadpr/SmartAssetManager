import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';
import { Observable } from 'rxjs';
import { Department, DepartmentRequest, DepartmentWithSubDepartmentsDto } from '../../models/interfaces/department.interface';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private baseUrl = `${environment.apiUrl}/department`; // Example: 'https://localhost:5001/api/'

  constructor(private http: HttpClient) { }

  // 🔹 Create Department
  createDepartment(request: DepartmentRequest): Observable<ApiResponse<Department>> {
    return this.http.post<ApiResponse<Department>>(
      `${this.baseUrl}/create-department`,
      request
    );
  }

  // 🔹 Update Department
  updateDepartment(request: DepartmentRequest): Observable<ApiResponse<Department>> {
    return this.http.put<ApiResponse<Department>>(
      `${this.baseUrl}/update-department`,
      request
    );
  }

  // 🔹 Get Departments (for current user)
  getDepartments(): Observable<ApiResponse<Department[]>> {
    return this.http.get<ApiResponse<Department[]>>(
      `${this.baseUrl}/get-departments`
    );
  }

  // 🔹 Get My Departments
  getMyDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(
      `${this.baseUrl}/get-my-departments`
    );
  }

  // 🔹 Get All Departments (SuperAdmin only)
  getAllDepartments(): Observable<ApiResponse<Department[]>> {
    return this.http.get<ApiResponse<Department[]>>(
      `${this.baseUrl}/get-all-departments`
    );
  }

  // 🔹 Get Department by Id
  getDepartmentById(id: number): Observable<ApiResponse<Department>> {
    return this.http.get<ApiResponse<Department>>(
      `${this.baseUrl}/get-department-by-id?id=${id}`
    );
  }

  // 🔹 Get Department with SubDepartments
  getDepartmentWithSubDepartmentsByDepartmentId(id: number): Observable<ApiResponse<DepartmentWithSubDepartmentsDto>> {
    return this.http.get<ApiResponse<DepartmentWithSubDepartmentsDto>>(
      `${this.baseUrl}/get-department-with-sub-departments-by-id?id=${id}`
    );
  }

  getDepartmentWithSubDepartments(): Observable<ApiResponse<DepartmentWithSubDepartmentsDto[]>> {
    return this.http.get<ApiResponse<DepartmentWithSubDepartmentsDto[]>>(
      `${this.baseUrl}/get-department-with-sub-departments`
    );
  }

  // 🔹 Delete Department
  deleteDepartment(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.baseUrl}/delete-department?id=${id}`
    );
  }

  // 🔹 Delete Department With SubDepartments
  deleteDepartmentWithSubDepartments(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.baseUrl}/delete-department-with-sub-departments?id=${id}`
    );
  }
}
