import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { loginresponse, registerconfirm, userLogin, userRegister } from '../../models/account/user.model';
import { UserProfile } from '../../models/account/userProfile';

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
    return this.http.post(this.baseUrl + '/account/email-confirmation', _data);
  }

  resendVerificationCode(email: string) {
    return this.http.post<{ isSuccess: boolean; message: string }>(
      `${this.baseUrl}/account/send-email-verification-code?email=${encodeURIComponent(email)}`,
      null // because you're sending data via query string, not body
    );
  }

  proceedLogin(_data: userLogin){
    return this.http.post<loginresponse>(this.baseUrl + '/account/login', _data);
  }

  getProfileData(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/account/get-profile-Data`);
  }

  getUserLocation(): Observable<any> {
    return this.http.get('https://ipapi.co/json/');
  }

  getPublicIP(): Observable<any> {
    return this.http.get('https://api.ipify.org/?format=json');
  }

}
