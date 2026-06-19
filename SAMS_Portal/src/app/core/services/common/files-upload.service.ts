import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilesUploadService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  uploadProfilePicture(file: File): Observable<{ url: string }> {
    const formData = new FormData();

    // ✅ MUST MATCH DTO PROPERTY NAME
    formData.append('File', file);

    return this.http.post<{ url: string }>(
      `${this.baseUrl}/account/upload-profile-picture`,
      formData
    );
  }
}
