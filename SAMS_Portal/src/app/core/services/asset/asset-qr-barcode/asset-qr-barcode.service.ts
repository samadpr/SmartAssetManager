import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../../models/interfaces/ApiResponse.interface';
import { Observable } from 'rxjs';
import { AssetQrBarcode } from '../../../models/interfaces/asset-manage/asset-qr-barcode.interface';

@Injectable({
  providedIn: 'root'
})
export class AssetQrBarcodeService {
  private baseUrl = `${environment.apiUrl}/asset-qr-barcode`;

  constructor(private http: HttpClient) { }

  /**
   * Get Asset QR & Barcode list by Organization
   */
  getAssetQrBarcodesByOrg(): Observable<ApiResponse<AssetQrBarcode[]>> {
    return this.http.get<ApiResponse<AssetQrBarcode[]>>(
      `${this.baseUrl}/get-asset-qr-barcode-by-org`
    );
  }
}
