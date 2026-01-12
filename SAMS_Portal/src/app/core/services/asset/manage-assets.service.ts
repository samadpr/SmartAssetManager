import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { AssetApprovalListItem, AssetApprovalRequest, AssetDetail, AssetDisposeRequest, AssetRequest, AssetResponse, AssetTransferRequest } from '../../models/interfaces/asset-manage/assets.interface';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';

@Injectable({
  providedIn: 'root'
})
export class ManageAssetsService {
  private baseUrl = `${environment.apiUrl}/asset`;

  constructor(private http: HttpClient) { }

  // CREATE
  createAsset(request: AssetRequest): Observable<ApiResponse<AssetDetail>> {
    const formData = this.toFormData(request);

    return this.http.post<ApiResponse<AssetDetail>>(
      `${this.baseUrl}/create`,
      formData
    );
  }


  // UPDATE
  updateAsset(request: AssetRequest): Observable<ApiResponse<AssetDetail>> {
    const formData = this.toFormData(request);
    return this.http.put<ApiResponse<AssetDetail>>(
      `${this.baseUrl}/update`,
      formData
    );
  }

  // GET BY ID
  getById(id: number): Observable<ApiResponse<AssetDetail>> {
    return this.http.get<ApiResponse<AssetDetail>>(`${this.baseUrl}/get-by-id?id=${id}`);
  }

  // GET BY ORG
  getByOrg(): Observable<ApiResponse<AssetDetail[]>> {
    return this.http.get<ApiResponse<AssetDetail[]>>(`${this.baseUrl}/get-by-org-id`);
  }

  // DELETE
  deleteAsset(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete?id=${id}`);
  }

  // Helper: Convert object to FormData
  private toFormData(obj: AssetRequest): FormData {
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

  private isIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/.test(value);
  }

  transferAsset(request: AssetTransferRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/transfer`,
      request
    );
  }

  disposeAsset(request: AssetDisposeRequest): Observable<ApiResponse<any>> {
    const formData = new FormData();

    formData.append('AssetId', request.assetId.toString());
    formData.append('DisposalDate', request.disposalDate.toISOString());
    formData.append('DisposalMethod', request.disposalMethod.toString());

    if (request.disposalDocument) {
      formData.append('DisposalDocument', request.disposalDocument);
    }

    if (request.comment) {
      formData.append('Comment', request.comment);
    }

    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/dispose`,
      formData
    );
  }


  // ---------------- APPROVE ASSET ----------------
  approveAsset(request: AssetApprovalRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/approve`,
      request
    );
  }

  // ---------------- REJECT ASSET ----------------
  rejectAsset(request: AssetApprovalRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/reject`,
      request
    );
  }

  // ---------------- GET PENDING APPROVAL LIST ----------------
  getApprovalPendingList(): Observable<ApiResponse<AssetApprovalListItem[]>> {
    return this.http.get<ApiResponse<AssetApprovalListItem[]>>(
      `${this.baseUrl}/get-approval-pending-list`
    );
  }


  // Helper: Get full file URL
  // getFullFileUrl(relativePath: string | null | undefined): string {
  //   if (!relativePath || relativePath.trim() === '') {
  //     return '';
  //   }

  //   // If already absolute URL, return as is
  //   if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
  //     return relativePath;
  //   }

  //   // Remove leading slash if present
  //   const cleanPath = relativePath.startsWith('/')
  //     ? relativePath.substring(1)
  //     : relativePath;

  //   // Construct full URL
  //   return `${environment.assetBaseUrl}/${cleanPath}`;
  // }
}
