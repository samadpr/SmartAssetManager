import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';
import { Supplier, SupplierRequest } from '../../models/interfaces/asset-manage/supplier.interface';

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {
  private baseUrl = `${environment.apiUrl}/supplier`;

  constructor(private http: HttpClient) { }

  // ─── CREATE ───────────────────────────────────────────────────────────────
  createSupplier(payload: SupplierRequest): Observable<ApiResponse<Supplier>> {
    const fd = this.buildFormData(payload);
    return this.http.post<ApiResponse<Supplier>>(`${this.baseUrl}/create`, fd);
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  updateSupplier(payload: SupplierRequest): Observable<ApiResponse<Supplier>> {
    const fd = this.buildFormData(payload);
    return this.http.put<ApiResponse<Supplier>>(`${this.baseUrl}/update`, fd);
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

  // ─── PRIVATE: Build FormData with PascalCase keys ────────────────
  private buildFormData(payload: SupplierRequest): FormData {
    const fd = new FormData();

    // Only append Id on update (when it exists)
    if (payload.id != null) {
      fd.append('Id', String(payload.id));
    }

    fd.append('Name',          payload.name          ?? '');
    fd.append('ContactPerson', payload.contactPerson ?? '');
    fd.append('Email',         payload.email         ?? '');
    fd.append('Phone',         payload.phone         ?? '');
    fd.append('Address',       payload.address       ?? '');

    // ✅ Only append TradeLicense when user picked a new File
    // String = existing URL from backend → skip (backend keeps old path when null)
    if (payload.tradeLicense instanceof File) {
      fd.append('TradeLicense', payload.tradeLicense, payload.tradeLicense.name);
    }

    // Debug — remove in production
    console.log('📦 Supplier FormData:');
    fd.forEach((v, k) => console.log(`  ${k}:`, v instanceof File ? `[File] ${v.name}` : v));

    return fd;
  }
}
