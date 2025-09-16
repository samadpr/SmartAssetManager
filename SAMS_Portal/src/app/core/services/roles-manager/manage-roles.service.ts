import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { AspNetRoleDto, ManageRoleDetailsRequest, ManageUserRoleRequest, UserRoleRequest } from '../../models/interfaces/manage-roles/manage-roles.interface'
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';

@Injectable({
  providedIn: 'root'
})
export class ManageRolesService {
  private baseUrl = `${environment.apiUrl}/manage-user-roles`; 

  constructor(private http: HttpClient) { }

  // ------------------ CREATE ------------------

  createRoleWithRoleDetails(request: ManageUserRoleRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/create-role-with-role-details`, request);
  }

  createUserRole(request: UserRoleRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/create-user-role`, request);
  }

  createUserRoleDetails(request: ManageRoleDetailsRequest[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/create-user-role-details`, request);
  }

   // ------------------ READ ------------------

  getUserRolesWithRoleDetails(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/get-user-roles-with-role-details`);
  }

  getUserRoles(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/get-user-roles`);
  }

  getUserRoleById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/get-user-role-by-id`, {
      params: { id }
    });
  }

  getRoleDetailsByManagedRoleId(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/get-role-details-by-managed-role-id`, {
      params: { id }
    });
  }

  // NEW: Fetch actual AspNetRoles (GUID + name) - adjust endpoint to your backend controller
  getAllAspNetRoles(): Observable<AspNetRoleDto[]> {
    return this.http.get<AspNetRoleDto[]>(`${this.baseUrl}/get-all-asp-net-roles`); // change URL if needed
  }

   // ------------------ UPDATE ------------------

  updateUserRoleWithRoleDetails(request: ManageUserRoleRequest): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/update-user-role-with-role-details`, request);
  }

  // ------------------ DELETE ------------------

  deleteUserRoleById(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/delete-user-role-by-id`, {
      params: { id }
    });
  }
}
