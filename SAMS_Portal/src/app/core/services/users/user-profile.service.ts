import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';
import { LoginAccessRequest, UpdateLoginAccessRequest, UserProfileRequest } from '../../models/interfaces/account/userProfile';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private baseUrl = `${environment.apiUrl}/user-profile`;

  constructor(private http: HttpClient) { }

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
  revokeLoginAccessForCreatedUserProfile(params: { id: number; sendEmail: boolean; message: string }): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(
      `${this.baseUrl}/revoke-login-access-for-created-user-profile`,
      { params }
    );
  }

  passwordSetup(payload: { email: string; token: string; password: string; confirmPassword: string }) {
    return this.http.post<ApiResponse>(`${this.baseUrl}/password-setup`, payload);
  }

  // ✅ Get User Profiles used in a specific Role
  getUserProfilesUsedInRoleId(roleId: number): Observable<ApiResponse> {
    const params = new HttpParams().set('roleId', roleId);
    return this.http.get<ApiResponse>(`${this.baseUrl}/get-user-profiles-used-in-role-id`, { params });
  }


  verifyEmail(userId: string, token: string): Observable<any> {
    const url = `${this.baseUrl}/user-email-confirm?userId=${userId}&token=${encodeURIComponent(token)}`;
    return this.http.post(url, {}); // post with empty body
  }
}
