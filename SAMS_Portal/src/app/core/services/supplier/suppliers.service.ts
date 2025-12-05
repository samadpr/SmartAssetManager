import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';
import { Supplier, SupplierCreateRequest, SupplierUpdateRequest } from '../../models/interfaces/asset-manage/supplier.interface';

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {
  private baseUrl = `${environment.apiUrl}/supplier`;

  constructor(private http: HttpClient) { }

  // CREATE
  createSupplier(payload: SupplierCreateRequest): Observable<ApiResponse<Supplier>> {
    const fd = new FormData();

    fd.append("Name", payload.name);
    fd.append("ContactPerson", payload.contactPerson);
    fd.append("Email", payload.email);
    fd.append("Phone", payload.phone);
    fd.append("Address", payload.address);

    if (payload.tradeLicense instanceof File) {
      fd.append("TradeLicense", payload.tradeLicense);
    }

    return this.http.post<ApiResponse<Supplier>>(
      `${this.baseUrl}/create`,
      fd
    );
  }


  // UPDATE
  updateSupplier(payload: SupplierUpdateRequest): Observable<ApiResponse<Supplier>> {
    const fd = new FormData();

    fd.append("Id", payload.id.toString());
    fd.append("Name", payload.name);
    fd.append("ContactPerson", payload.contactPerson);
    fd.append("Email", payload.email);
    fd.append("Phone", payload.phone);
    fd.append("Address", payload.address);

    if (payload.tradeLicense instanceof File) {
      fd.append("TradeLicense", payload.tradeLicense);
    }

    return this.http.put<ApiResponse<Supplier>>(
      `${this.baseUrl}/update`,
      fd
    );
  }

  // GET BY ORG
  getSuppliersByOrg(): Observable<ApiResponse<Supplier[]>> {
    return this.http.get<ApiResponse<Supplier[]>>(
      `${this.baseUrl}/get-by-org`
    );
  }

  // DELETE
  deleteSupplier(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/delete?id=${id}`
    );
  }

  getFullFileUrl(relativePath: string | null | undefined): string {
    if (!relativePath || relativePath.trim() === '') {
      return '';
    }

    // If already absolute URL, return as is
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }

    // Remove leading slash if present
    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;

    // Construct full URL
    const fullUrl = `${environment.assetBaseUrl}/${cleanPath}`;

    console.log('🔗 File URL:', { relativePath, fullUrl });

    return fullUrl;
  }

}
