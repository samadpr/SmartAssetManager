import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from '../../../../../environments/environment.development';
import { UserProfileData, UserProfileDetails, UserProfileRequest } from '../../../models/interfaces/account/userProfile';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(private http: HttpClient) { }

  baseUrl = environment.apiUrl

  uploadProfilePicture(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(
      `${this.baseUrl}/account/upload-profile-picture`,
      formData
    );
  }


  getProfileData(): Observable<UserProfileData> {
    return this.http.get<UserProfileData>(`${this.baseUrl}/account/get-profile-data`);
  }

  getProfileDetails(): Observable<UserProfileDetails> {
    return this.http.get<UserProfileDetails>(`${this.baseUrl}/account/get-profile-details`);
  }

  updateProfileData(profile: UserProfileRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/account/update-profile`, profile, {
      responseType: 'text'  // 👈 Important
    });
  }
}
