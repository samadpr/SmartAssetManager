import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';
import { LoginAccessRequest, UpdateLoginAccessRequest, UserProfileRequest } from '../../models/account/userProfile';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
private baseUrl = `${environment.apiUrl}/user-profile`;

  constructor(private http: HttpClient) {}

  // ✅ Create User Profile
  createUserProfile(payload: UserProfileRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/create-user-profile`, payload);
  }

  // ✅ Get All Created User Profiles
  getCreatedUsersProfile(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/get-created-users-profile`);
  }

  // ✅ Get All Created User Profiles
  getCreatedUsersProfilesDetails(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/get-created-user-profiles-details`);
  }

  // ✅ Update User Profile
  updateCreatedUserProfile(payload: UserProfileRequest): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/update-created-user-profile`, payload);
  }

  // ✅ Delete User Profile
  deleteCreatedUserProfile(userProfileId: number): Observable<ApiResponse> {
    const params = new HttpParams().set('userProfileId', userProfileId);
    return this.http.delete<ApiResponse>(`${this.baseUrl}/delete-created-user-profile`, { params });
  }

  // ✅ Allow Login Access (Admin Only)
  allowLoginAccessForCreatedUser(payload: LoginAccessRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/allow-login-access-for-created-user`, payload);
  }

  // ✅ Update Login Access (Admin Only)
  updateLoginAccessForCreatedUser(payload: UpdateLoginAccessRequest): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/update-login-access-for-created-user`, payload);
  }

  // ✅ Revoke Login Access (Admin Only)
  revokeLoginAccessForCreatedUserProfile(id: number): Observable<ApiResponse> {
    const params = new HttpParams().set('id', id);
    return this.http.delete<ApiResponse>(`${this.baseUrl}/revoke-login-access-for-created-user-profile`, { params });
  }

  // ✅ Get User Profiles used in a specific Role
  getUserProfilesUsedInRoleId(roleId: number): Observable<ApiResponse> {
    const params = new HttpParams().set('roleId', roleId);
    return this.http.get<ApiResponse>(`${this.baseUrl}/get-user-profiles-used-in-role-id`, { params });
  }
}
