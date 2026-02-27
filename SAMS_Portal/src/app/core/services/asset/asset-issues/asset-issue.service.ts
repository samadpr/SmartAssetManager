import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssetIssue, AssetIssueDetails } from '../../../models/interfaces/asset-manage/asset-issue.interface';
import { ApiResponse } from '../../../models/interfaces/ApiResponse.interface';

@Injectable({
  providedIn: 'root'
})
export class AssetIssueService {
  private baseUrl = `${environment.apiUrl}/asset-issue`;

  constructor(private http: HttpClient) { }

  // ✅ CREATE
  create(issue: AssetIssue): Observable<any> {
    const formData = this.toFormData(issue);
    return this.http.post(`${this.baseUrl}/create`, formData);
  }

  // ✅ UPDATE
  update(issue: AssetIssue): Observable<any> {
    const formData = this.toFormData(issue);
    return this.http.put(`${this.baseUrl}/update`, formData);
  }

  // ✅ GET BY ORG
  getByOrg(): Observable<ApiResponse<AssetIssueDetails[]>> {
    return this.http.get<ApiResponse<AssetIssueDetails[]>>(`${this.baseUrl}/get-by-org`);
  }

  // ✅ GET BY ID
  getById(id: number): Observable<ApiResponse<AssetIssueDetails>> {
    return this.http.get<ApiResponse<AssetIssueDetails>>(
      `${this.baseUrl}/get-by-id?id=${id}`
    );
  }

  // ✅ DELETE
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete?id=${id}`);
  }

  // Helper: Convert object to FormData
  private toFormData(obj: AssetIssue): FormData {
    const formData = new FormData();

    console.log('🔄 Converting to FormData:', obj);

    Object.entries(obj).forEach(([key, value]) => {
      // Skip null/undefined
      if (value === null || value === undefined) {
        console.log(`⏭️  Skipping ${key}: null/undefined`);
        return;
      }

      // 🔥 CRITICAL: Handle File objects
      if (value instanceof File) {
        formData.append(key, value, value.name);
        console.log(`✅ FILE: ${key} = ${value.name} (${value.size} bytes)`);
        return;
      }

      // Handle Date objects
      if (value instanceof Date) {
        formData.append(key, value.toISOString());
        console.log(`📅 DATE: ${key} = ${value.toISOString()}`);
        return;
      }

      // 🔥 CRITICAL: Handle string paths (existing files)
      if (typeof value === 'string') {
        // Only append if not empty
        if (value.trim() !== '') {
          formData.append(key, value);
          console.log(`📄 STRING: ${key} = ${value}`);
        }
        return;
      }

      // Handle booleans
      if (typeof value === 'boolean') {
        formData.append(key, String(value));
        console.log(`✔️  BOOL: ${key} = ${value}`);
        return;
      }

      // Handle numbers
      if (typeof value === 'number') {
        formData.append(key, String(value));
        console.log(`🔢 NUMBER: ${key} = ${value}`);
        return;
      }

      // Fallback: convert to string
      formData.append(key, String(value));
      console.log(`❓ OTHER: ${key} = ${String(value)}`);
    });

    // 🔍 DEBUG: Log all FormData entries
    console.log('📦 Final FormData entries:');
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name}`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    });

    return formData;
  }
}
