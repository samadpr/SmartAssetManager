import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { AssetApprovalListItem, AssetApprovalRequest, AssetBatchDeleteRequest, AssetBatchDetail, AssetBatchListItem, AssetBatchQuantityUpdateRequest, AssetDetail, AssetDisposeRequest, AssetRequest, AssetTransferRequest, AssetUnitStatusUpdateRequest } from '../../models/interfaces/asset-manage/assets.interface';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/interfaces/ApiResponse.interface';

@Injectable({
  providedIn: 'root'
})
export class ManageAssetsService {
  private baseUrl = `${environment.apiUrl}/asset`;

  constructor(private http: HttpClient) { }
  // ===========================================================================
  //  CREATE  —  POST /asset/create
  //
  //  Creates one AssetBatch + one Asset row per unit (request.quantity).
  //  Returns: ApiResponse<AssetBatchDetail>
  //    data.batchId, data.batchCode — the created batch
  //    data.assets[]                — each physical unit with its own
  //                                   assetId, qrcode, qrcodeImage, barcode
  //
  //  For quantity > 1: populate request.serialNumbers[] (one per unit).
  //  For quantity = 1: just set request.assetSerialNo.
  // ===========================================================================

  createAsset(request: AssetRequest): Observable<ApiResponse<AssetBatchDetail>> {
    return this.http.post<ApiResponse<AssetBatchDetail>>(
      `${this.baseUrl}/create`,
      this.toFormData(request)
    );
  }

  // ===========================================================================
  //  UPDATE SHARED FIELDS  —  PUT /asset/update
  //
  //  Pass any unit's id from the batch. Updates brand, model, category,
  //  price, depreciation etc. across ALL sibling units in the batch.
  //  Serial numbers, QR codes, and barcodes are NOT changed here.
  //  Use updateBatchQuantity() to add/remove units.
  //
  //  Returns: ApiResponse<AssetBatchDetail>
  // ===========================================================================

  updateAsset(request: AssetRequest): Observable<ApiResponse<AssetBatchDetail>> {
    return this.http.put<ApiResponse<AssetBatchDetail>>(
      `${this.baseUrl}/update`,
      this.toFormData(request)
    );
  }

  // ===========================================================================
  //  ADD / REMOVE UNITS  —  PATCH /asset/update-batch-quantity
  //
  //  Add new units (supply addSerialNumbers[]) or soft-delete existing
  //  units (supply removeAssetIds[]). Both can be done in one call.
  //
  //  Returns: ApiResponse<AssetBatchDetail>
  // ===========================================================================

  updateBatchQuantity(
    request: AssetBatchQuantityUpdateRequest
  ): Observable<ApiResponse<AssetBatchDetail>> {
    return this.http.patch<ApiResponse<AssetBatchDetail>>(
      `${this.baseUrl}/update-batch-quantity`,
      request
    );
  }

  updateUnitStatus(request: AssetUnitStatusUpdateRequest): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(
      `${this.baseUrl}/update-unit-status`,
      request
    );
  }

  // ===========================================================================
  //  BATCH LIST  —  GET /asset/batch-list
  //
  //  Main asset grid — one row per batch.
  //  Shows batchCode, assetName, originalQuantity, activeQuantity, status.
  //  Use this for the manage-assets table.
  //
  //  Returns: ApiResponse<AssetBatchListItem[]>
  // ===========================================================================

  getAssetBatchList(): Observable<ApiResponse<AssetBatchListItem[]>> {
    return this.http.get<ApiResponse<AssetBatchListItem[]>>(
      `${this.baseUrl}/batch-list`
    );
  }

  // ===========================================================================
  //  BATCH DETAIL  —  GET /asset/batch-detail?batchId=
  //
  //  Expandable row — returns the batch header + all individual unit rows.
  //  Each unit has its own assetId, assetSerialNo, qrcode, qrcodeImage, barcode.
  //  Use when user clicks a row in the batch grid to see each unit.
  //
  //  Returns: ApiResponse<AssetBatchDetail>
  // ===========================================================================

  getAssetBatchDetail(batchId: number): Observable<ApiResponse<AssetBatchDetail>> {
    return this.http.get<ApiResponse<AssetBatchDetail>>(
      `${this.baseUrl}/batch-detail?batchId=${batchId}`
    );
  }

  // ===========================================================================
  //  GET BY DB ID  —  GET /asset/get-by-id?id=
  //
  //  Returns one Asset unit by its database Id.
  //  Used for detail view, edit dialog, QR scan result.
  //  Returns depreciation schedule if asset is depreciable.
  //
  //  Returns: ApiResponse<AssetDetail>
  // ===========================================================================

  getById(id: number): Observable<ApiResponse<AssetDetail>> {
    return this.http.get<ApiResponse<AssetDetail>>(
      `${this.baseUrl}/get-by-id?id=${id}`
    );
  }

  // ===========================================================================
  //  GET BY ASSET CODE  —  GET /asset/get-by-asset-id?assetId=
  //
  //  Returns one Asset unit by its AssetId code (e.g. "20260127000001").
  //  Used for QR / barcode scanner lookup.
  //
  //  Returns: ApiResponse<AssetDetail>
  // ===========================================================================

  getByAssetId(assetId: string): Observable<ApiResponse<AssetDetail>> {
    return this.http.get<ApiResponse<AssetDetail>>(
      `${this.baseUrl}/get-by-asset-id?assetId=${encodeURIComponent(assetId)}`
    );
  }

  // ===========================================================================
  //  GET FLAT LIST  —  GET /asset/get-by-org-id
  //
  //  Returns ALL active asset units as a flat list (one row per unit).
  //  Each unit includes batchId and batchCode fields.
  //
  //  USE THIS FOR:
  //    - Transfer dialog (pick one specific unit to transfer)
  //    - Dispose dialog (pick one specific unit)
  //    - Asset issue module (issue a specific unit)
  //    - Reports (need all individual units)
  //    - Any dropdown that lists individual assets
  //
  //  DO NOT use for the main asset grid — use getBatchList() instead.
  //
  //  Returns: ApiResponse<AssetDetail[]>
  // ===========================================================================

  getByOrg(): Observable<ApiResponse<AssetDetail[]>> {
    return this.http.get<ApiResponse<AssetDetail[]>>(
      `${this.baseUrl}/get-by-org-id`
    );
  }

  deleteBatch(request: AssetBatchDeleteRequest): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(
      `${this.baseUrl}/delete-batch`,
      { body: request }
    );
  }

  // ===========================================================================
  //  DELETE  —  DELETE /asset/delete?id=
  //
  //  Soft-deletes one asset unit. Automatically decrements batch ActiveQuantity.
  //  Does NOT delete the entire batch — just the one unit.
  //  To remove multiple units at once, use updateBatchQuantity().
  // ===========================================================================

  deleteAsset(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(
      `${this.baseUrl}/delete?id=${id}`
    );
  }

  // ===========================================================================
  //  TRANSFER  —  POST /asset/transfer
  //
  //  Transfers one specific asset unit to a user or site/branch.
  //  Admin: approved immediately.
  //  Non-admin: creates a pending approval request.
  // ===========================================================================

  transferAsset(request: AssetTransferRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.baseUrl}/transfer`,
      request
    );
  }

  // ===========================================================================
  //  DISPOSE  —  POST /asset/dispose
  //
  //  Marks one asset unit as disposed.
  //  Admin: approved immediately, decrements batch ActiveQuantity.
  //  Non-admin: creates a pending approval request.
  // ===========================================================================

  disposeAsset(request: AssetDisposeRequest): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('AssetId', request.assetId.toString());
    formData.append('DisposalDate', request.disposalDate.toISOString());
    formData.append('DisposalMethod', request.disposalMethod.toString());
    if (request.disposalDocument)
      formData.append('DisposalDocument', request.disposalDocument);
    if (request.comment)
      formData.append('Comment', request.comment);

    return this.http.post<ApiResponse>(
      `${this.baseUrl}/dispose`,
      formData
    );
  }

  // ===========================================================================
  //  APPROVE  —  POST /asset/approve
  // ===========================================================================

  approveAsset(request: AssetApprovalRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.baseUrl}/approve`,
      request
    );
  }

  // ===========================================================================
  //  REJECT  —  POST /asset/reject
  // ===========================================================================

  rejectAsset(request: AssetApprovalRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.baseUrl}/reject`,
      request
    );
  }

  // ===========================================================================
  //  PENDING APPROVALS  —  GET /asset/get-approval-pending-list
  // ===========================================================================

  getApprovalPendingList(): Observable<ApiResponse<AssetApprovalListItem[]>> {
    return this.http.get<ApiResponse<AssetApprovalListItem[]>>(
      `${this.baseUrl}/get-approval-pending-list`
    );
  }

  // ===========================================================================
  //  PRIVATE — FormData builder
  //
  //  Handles all field types:
  //    File       → appended with filename
  //    Date       → ISO string
  //    string[]   → each element appended as key[0], key[1], ...
  //                 (how ASP.NET Core model binding reads List<string>)
  //    boolean    → "true" / "false"
  //    number     → string representation
  //    string     → appended as-is (empty strings skipped)
  //    null/undef → skipped
  // ===========================================================================

  private toFormData(obj: AssetRequest): FormData {
    const formData = new FormData();

    const appendValue = (key: string, value: any): void => {
      if (value === null || value === undefined) return;

      // File upload
      if (value instanceof File) {
        formData.append(key, value, value.name);
        return;
      }

      // Date → ISO string
      if (value instanceof Date) {
        formData.append(key, value.toISOString());
        return;
      }

      // Array — handle both primitive arrays and object arrays
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item === null || item === undefined) return;

          if (
            typeof item === 'object' &&
            !(item instanceof File) &&
            !(item instanceof Date)
          ) {
            // ── Object array (e.g. unitAssignments[]) ──────────────────────
            // ASP.NET Core [FromForm] binding expects:
            //   unitAssignments[0].sequence=1
            //   unitAssignments[0].assignTo=1
            //   unitAssignments[0].assignUserId=42
            //   unitAssignments[1].sequence=2  …
            Object.entries(item).forEach(([prop, propValue]) => {
              appendValue(`${key}[${index}].${prop}`, propValue);
            });
          } else {
            // ── Primitive array (e.g. serialNumbers[]) ────────────────────
            formData.append(`${key}[${index}]`, String(item));
          }
        });
        return;
      }

      // Boolean
      if (typeof value === 'boolean') {
        formData.append(key, String(value));
        return;
      }

      // Number
      if (typeof value === 'number') {
        formData.append(key, String(value));
        return;
      }

      // String — skip empty
      if (typeof value === 'string') {
        if (value.trim() !== '') formData.append(key, value);
        return;
      }

      // Fallback
      formData.append(key, String(value));
    };

    Object.entries(obj).forEach(([key, value]) => appendValue(key, value));

    return formData;
  }
}
