import { Injectable } from '@angular/core';
import { loginresponse } from '../../../models/interfaces/account/user.model';
import { localStorageUserProfile } from '../../../models/interfaces/account/userProfile';

@Injectable({
  providedIn: 'root'
})
export class UserProfileStorageService {
  private readonly Key = 'user_profile';
  
  save(profile: Partial<localStorageUserProfile>): void {
    if (profile) {
      console.log('Saving to localStorage:', profile);
      localStorage.setItem(this.Key, JSON.stringify(profile));
    } else {
      localStorage.removeItem(this.Key); // Optional: clear invalid data
    }
    
  }

  get(): localStorageUserProfile | null {
    const profile = localStorage.getItem(this.Key);
    if (!profile) {
      return null;
    }
    var user = profile ? JSON.parse(profile) : null;
    return {
      email: user.email || '',
      fullName: user.fullName || '',
      createdBy: user.createdBy || ''
    } as localStorageUserProfile;
  }

  clear(): void {
    localStorage.removeItem(this.Key);
  }
}
