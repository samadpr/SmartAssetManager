import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { forgotPasswordRequest, loginresponse, registerconfirm, resetPasswordRequest, userLogin, userRegister } from '../../models/interfaces/account/user.model';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  constructor(private http: HttpClient) { }

  baseUrl = environment.apiUrl

  _registerresp = signal<registerconfirm>({
    email: '',
    otpText: ''
  });

  userRegistration(_data: userRegister) {
    return this.http.post(this.baseUrl + '/account/register', _data);
  }

  confirmRegistration(_data: registerconfirm) {
    return this.http.post<loginresponse>(this.baseUrl + '/account/email-confirmation', _data);
  }

  resendVerificationCode(email: string) {
    return this.http.post<{ isSuccess: boolean; message: string }>(
      `${this.baseUrl}/account/send-email-verification-code?email=${encodeURIComponent(email)}`,
      null // because you're sending data via query string, not body
    );
  }

  proceedLogin(_data: userLogin) {
    return this.http.post<loginresponse>(this.baseUrl + '/account/login', _data);
  }

  logout(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/account/logout`, {});
  }

  // ================= FORGOT PASSWORD =================
  forgotPassword(data: forgotPasswordRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.baseUrl}/account/forgot-password`,
      data
    );
  }

  // ================= RESET PASSWORD =================
  resetPassword(data: resetPasswordRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.baseUrl}/account/reset-password`,
      data
    );
  }


  // getProfileData(): Observable<UserProfile> {
  //   return this.http.get<UserProfile>(`${this.baseUrl}/account/get-profile-Data`);
  // }

  getUserLocation(): Observable<any> {
    return this.http.get('https://ipapi.co/json/');
  }

  getPublicIP(): Observable<any> {
    return this.http.get('https://api.ipify.org/?format=json');
  }

}
