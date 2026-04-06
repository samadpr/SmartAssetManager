import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { animate, state, style, transition, trigger, query, stagger } from '@angular/animations';
 
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { ManageAssetsService } from '../../../core/services/asset/manage-assets.service';
import { SitesOrBranchesService } from '../../../core/services/sites-or-branchs/sites-or-branches.service';
import { AssetAreaService } from '../../../core/services/sites-or-branchs/areas/asset-area.service';
import { UserProfileService } from '../../../core/services/users/user-profile.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { FileUrlHelper } from '../../../core/helper/get-file-url';
import { AssignToType } from '../../../core/enum/asset.enums';
import { forkJoin } from 'rxjs';
 
// ── Session-storage key ──────────────────────────────────────────────────────
const BUCKET_STORAGE_KEY = 'asset_transfer_bucket_v1';
export const BUCKET_LIMIT = 100;
 
// ── Bucket item (lightweight — only what we need in UI + transfer) ───────────
export interface BucketItem {
  Id: number;         // DB id (used in transfer)
  assetId: string;       // Display ID  e.g. AST-0001
  name: string;
  assetBrand?: string;
  categoryDisplay?: string;
  siteDisplay?: string;
  assignUserDisplay?: string;
  imageUrl?: string;
  // Transfer state (NOT persisted)
  transferring?: boolean;
  transferred?: boolean;
  failed?: boolean;
  failMessage?: string;
}
 
interface DropdownOption {
  value: any;
  label: string;
  siteId?: number;
}
@Component({
  selector: 'app-asset-bulk-transfer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './asset-bulk-transfer.component.html',
  styleUrl: './asset-bulk-transfer.component.scss',
    animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, height: 0, overflow: 'hidden' }),
        animate('250ms ease-out', style({ opacity: 1, height: '*' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, height: 0, overflow: 'hidden' })),
      ]),
    ]),
    trigger('itemEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateX(20px)' })),
      ]),
    ]),
  ],
})
export class AssetBulkTransferComponent implements OnInit, OnDestroy, AfterViewInit {
  // ─── Template refs ────────────────────────────────────────────────────────
  @ViewChild('transferDialogTpl') transferDialogTpl!: TemplateRef<any>;
  @ViewChild('scanInput') scanInputRef!: ElementRef<HTMLInputElement>;
 
  // ─── Services ─────────────────────────────────────────────────────────────
  private assetService   = inject(ManageAssetsService);
  private siteService    = inject(SitesOrBranchesService);
  private areaService    = inject(AssetAreaService);
  private userService    = inject(UserProfileService);
  private globalService  = inject(GlobalService);
  private dialog         = inject(MatDialog);
  private fb             = inject(FormBuilder);
 
  // ─── Constants ────────────────────────────────────────────────────────────
  readonly BUCKET_LIMIT = BUCKET_LIMIT;
 
  // ─── Scanner state ────────────────────────────────────────────────────────
  scannerActive   = signal(false);
  scanning        = signal(false);
  scanBuffer      = '';
  lastScanSuccess = signal<boolean | null>(null);
  scanError       = signal('');
  showManual      = signal(false);
  manualAssetId   = '';
  scannedCount    = signal(0);
 
  // ─── Bucket state (reactive signals) ─────────────────────────────────────
  bucket           = signal<BucketItem[]>([]);
  selectedInBucket = signal<BucketItem[]>([]);
  showResults      = signal(false);
 
  // ─── Computed ─────────────────────────────────────────────────────────────
  bucketCount     = computed(() => this.bucket().length);
  transferableItems  = computed(() => this.bucket().filter(i => !i.transferred && !i.failed));
  transferableCount  = computed(() => this.transferableItems().length);
  capacityPct        = computed(() => Math.round((this.bucketCount() / this.BUCKET_LIMIT) * 100));
 
  // ─── Transfer progress ────────────────────────────────────────────────────
  isTransferring    = signal(false);
  transferTotal     = signal(0);
  transferDoneCount = signal(0);
  transferFailCount = signal(0);
  transferProgress  = computed(() =>
    this.transferTotal() > 0
      ? Math.round(((this.transferDoneCount() + this.transferFailCount()) / this.transferTotal()) * 100)
      : 0
  );
 
  // ─── Dropdown data ────────────────────────────────────────────────────────
  sitesList        = signal<DropdownOption[]>([]);
  allAreasList     = signal<DropdownOption[]>([]);
  filteredAreasList = signal<DropdownOption[]>([]);
  usersList        = signal<DropdownOption[]>([]);
 
  // ─── Transfer Form ────────────────────────────────────────────────────────
  transferForm!: FormGroup;
 
  // ─── Barcode scanner internals ────────────────────────────────────────────
  private scanDebounceTimer: any = null;
  private readonly SCAN_DEBOUNCE_MS = 100; // typical scanner sends chars < 50ms apart
 
  // ─── Keyboard listener ref ────────────────────────────────────────────────
  private keydownListener?: (e: KeyboardEvent) => void;
 
  // ─────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────────────
 
  ngOnInit(): void {
    this.buildTransferForm();
    this.loadDropdownData();
    this.restoreBucket();
    this.setupGlobalKeyCapture();
  }
 
  ngAfterViewInit(): void {
    // Auto-focus scan input after view is ready
    setTimeout(() => this.focusScanInput(), 300);
  }
 
  ngOnDestroy(): void {
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
    }
    clearTimeout(this.scanDebounceTimer);
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // Form
  // ─────────────────────────────────────────────────────────────────────────
 
  private buildTransferForm(): void {
    this.transferForm = this.fb.group({
      transferDate : [new Date(), Validators.required],
      dueDate      : [null],
      assignTo     : [AssignToType.NotAssigned, Validators.required],
      assignUserId : [null],
      siteId       : [null],
      areaId       : [null],
      note         : [''],
    });
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // Scanner activation
  // ─────────────────────────────────────────────────────────────────────────
 
  toggleScanner(): void {
    this.scannerActive.update(v => !v);
    if (this.scannerActive()) {
      this.lastScanSuccess.set(null);
      this.focusScanInput();
    }
  }
 
  focusScanInput(): void {
    setTimeout(() => {
      this.scanInputRef?.nativeElement?.focus();
    }, 50);
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // Barcode / QR scan capture — works for USB/Bluetooth scanners
  // (they type fast then send Enter)
  // Also captures POS device input via the global keydown approach
  // ─────────────────────────────────────────────────────────────────────────
 
  /**
   * Global keyboard listener: while scanner is active,
   * every keystroke goes into a buffer; Enter triggers lookup.
   * This lets POS/scanner devices work even if the input isn't explicitly focused.
   */
  private setupGlobalKeyCapture(): void {
    this.keydownListener = (e: KeyboardEvent) => {
      if (!this.scannerActive()) return;
 
      const tag = (e.target as HTMLElement)?.tagName?.toUpperCase();
      // If user is typing in a text field (manual input or form), skip global capture
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
 
      if (e.key === 'Enter') {
        if (this.scanBuffer.trim()) {
          this.processScannedCode(this.scanBuffer.trim());
          this.scanBuffer = '';
        }
        e.preventDefault();
        return;
      }
 
      // Accumulate printable characters
      if (e.key.length === 1) {
        this.scanBuffer += e.key;
        // Reset debounce
        clearTimeout(this.scanDebounceTimer);
        this.scanDebounceTimer = setTimeout(() => {
          // If no Enter came but buffer has content after 500ms, treat as complete scan
          if (this.scanBuffer.trim().length >= 3) {
            this.processScannedCode(this.scanBuffer.trim());
          }
          this.scanBuffer = '';
        }, 500);
      }
    };
 
    document.addEventListener('keydown', this.keydownListener);
  }
 
  /** Called when the hidden <input> receives keydown */
  onScanKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.scanBuffer.trim()) {
        this.processScannedCode(this.scanBuffer.trim());
        this.scanBuffer = '';
      }
    }
  }
 
  /** Called on (input) — handles paste or very fast scan completion without Enter */
  onScanInput(): void {
    clearTimeout(this.scanDebounceTimer);
    this.scanDebounceTimer = setTimeout(() => {
      if (this.scanBuffer.trim().length >= 3) {
        this.processScannedCode(this.scanBuffer.trim());
        this.scanBuffer = '';
      }
    }, this.SCAN_DEBOUNCE_MS);
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // Manual input
  // ─────────────────────────────────────────────────────────────────────────
 
  toggleManualInput(): void {
    this.showManual.update(v => !v);
  }
 
  lookupManual(): void {
    const id = this.manualAssetId?.trim();
    if (!id) return;
    this.processScannedCode(id);
    this.manualAssetId = '';
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // Core: look up scanned code → add to bucket
  // ─────────────────────────────────────────────────────────────────────────
 
  private processScannedCode(code: string): void {
    if (this.scanning()) return;
 
    // Guard: bucket full
    if (this.bucketCount() >= this.BUCKET_LIMIT) {
      this.setError(`Bucket is full (max ${this.BUCKET_LIMIT} assets)`);
      return;
    }
 
    // Guard: already in bucket
    if (this.bucket().some(i => i.assetId === code || String(i.Id) === code)) {
      this.setError(`Asset "${code}" is already in the bucket`);
      return;
    }
 
    this.scanning.set(true);
    this.lastScanSuccess.set(null);
 
    this.assetService.getByAssetId(code).subscribe({
      next: (res) => {
        this.scanning.set(false);
        if (!res.success || !res.data) {
          this.setError(`Asset "${code}" not found`);
          return;
        }
 
        const data = res.data;
 
        // Check duplicate by rowId too
        if (this.bucket().some(i => i.Id === data.id)) {
          this.setError(`Asset "${code}" already in bucket`);
          return;
        }
 
        const item: BucketItem = {
          Id          : data.id,
          assetId        : data.assetId,
          name           : data.name,
          assetBrand     : data.assetBrand,
          categoryDisplay: (data as any).categoryDisplay,
          siteDisplay    : (data as any).siteDisplay,
          assignUserDisplay: (data as any).assignUserDisplay,
          imageUrl       : data.imageUrl ? FileUrlHelper.getFullUrl(data.imageUrl) : undefined,
        };
 
        this.addToBucket(item);
        this.lastScanSuccess.set(true);
        this.scannedCount.update(n => n + 1);
 
        // Reset success indicator after 2s
        setTimeout(() => this.lastScanSuccess.set(null), 2000);
      },
      error: () => {
        this.scanning.set(false);
        this.setError(`Could not find asset "${code}"`);
      },
    });
  }
 
  private setError(msg: string): void {
    this.lastScanSuccess.set(false);
    this.scanError.set(msg);
    this.globalService.showToastr(msg, 'error');
    setTimeout(() => {
      this.lastScanSuccess.set(null);
    }, 3000);
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // Bucket management
  // ─────────────────────────────────────────────────────────────────────────
 
  private addToBucket(item: BucketItem): void {
    this.bucket.update(list => [...list, item]);
    this.persistBucket();
  }
 
  removeFromBucket(index: number): void {
    const item = this.bucket()[index];
    if (item?.transferring) return;
    this.bucket.update(list => list.filter((_, i) => i !== index));
    // Remove from selection too
    this.selectedInBucket.update(sel => sel.filter(s => s.assetId !== item?.assetId));
    this.persistBucket();
  }
 
  clearBucket(): void {
    if (this.isTransferring()) return;
    this.bucket.set([]);
    this.selectedInBucket.set([]);
    this.showResults.set(false);
    this.transferDoneCount.set(0);
    this.transferFailCount.set(0);
    sessionStorage.removeItem(BUCKET_STORAGE_KEY);
  }
 
  removeSelected(): void {
    const selIds = new Set(this.selectedInBucket().map(s => s.assetId));
    this.bucket.update(list => list.filter(i => !selIds.has(i.assetId) || i.transferring));
    this.selectedInBucket.set([]);
    this.persistBucket();
  }
 
  selectAll(): void {
    this.selectedInBucket.set(this.bucket().filter(i => !i.transferred && !i.failed));
  }
 
  isBucketItemSelected(item: BucketItem): boolean {
    return this.selectedInBucket().some(s => s.assetId === item.assetId);
  }
 
  toggleBucketSelect(item: BucketItem): void {
    if (this.isBucketItemSelected(item)) {
      this.selectedInBucket.update(sel => sel.filter(s => s.assetId !== item.assetId));
    } else {
      this.selectedInBucket.update(sel => [...sel, item]);
    }
  }
 
  trackByAssetId(_: number, item: BucketItem): string {
    return item.assetId;
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // Session storage persistence
  // ─────────────────────────────────────────────────────────────────────────
 
  private persistBucket(): void {
    try {
      // Only persist safe fields (strip runtime state)
      const clean = this.bucket().map(({ transferring, transferred, failed, failMessage, ...rest }) => rest);
      sessionStorage.setItem(BUCKET_STORAGE_KEY, JSON.stringify(clean));
    } catch {
      // Ignore quota errors
    }
  }
 
  private restoreBucket(): void {
    try {
      const raw = sessionStorage.getItem(BUCKET_STORAGE_KEY);
      if (raw) {
        const items: BucketItem[] = JSON.parse(raw);
        if (Array.isArray(items) && items.length > 0) {
          this.bucket.set(items);
          this.globalService.showSnackbar(
            `Restored ${items.length} asset(s) from previous session`,
            'info' as any,
          );
        }
      }
    } catch {
      sessionStorage.removeItem(BUCKET_STORAGE_KEY);
    }
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // Transfer dialog
  // ─────────────────────────────────────────────────────────────────────────
 
  openTransferDialog(): void {
    if (this.transferableCount() === 0) return;
    this.transferForm.reset({
      transferDate: new Date(),
      assignTo: AssignToType.NotAssigned,
    });
 
    this.dialog.open(this.transferDialogTpl, {
      maxWidth: '700px',
      width: '95vw',
      disableClose: true,
      panelClass: 'bulk-transfer-dialog-panel',
    });
  }
 
  onSiteChange(siteId: number): void {
    const areas = this.allAreasList().filter(a => a.siteId === siteId);
    this.filteredAreasList.set(areas);
    this.transferForm.patchValue({ areaId: null });
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // Execute transfer
  // ─────────────────────────────────────────────────────────────────────────
 
  executeTransfer(): void {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }
 
    const formVal = this.transferForm.value;
    const items = this.transferableItems();
 
    this.dialog.closeAll();
    this.isTransferring.set(true);
    this.transferTotal.set(items.length);
    this.transferDoneCount.set(0);
    this.transferFailCount.set(0);
    this.showResults.set(false);
 
    // Process one by one with sequential delay for UX clarity
    this.processNextTransfer(items, 0, formVal);
  }
 
  private processNextTransfer(items: BucketItem[], index: number, formVal: any): void {
    if (index >= items.length) {
      // All done
      this.isTransferring.set(false);
      this.showResults.set(true);
      this.persistBucket();
 
      const done = this.transferDoneCount();
      const fail = this.transferFailCount();
      if (fail === 0) {
        this.globalService.showSnackbar(`All ${done} assets transferred successfully!`, 'success');
      } else {
        this.globalService.showToastr(`${done} succeeded, ${fail} failed`, 'warning');
      }
      return;
    }
 
    const item = items[index];
 
    // Mark as transferring in bucket
    this.updateBucketItem(item.assetId, { transferring: true });
 
    const request = {
      assetId     : item.Id,
      transferDate: formVal.transferDate,
      dueDate     : formVal.dueDate || undefined,
      assignTo    : formVal.assignTo,
      assignUserId: formVal.assignTo === AssignToType.User ? formVal.assignUserId : undefined,
      siteId      : formVal.assignTo === AssignToType.Site ? formVal.siteId : undefined,
      areaId      : formVal.assignTo === AssignToType.Site ? formVal.areaId : undefined,
      note        : formVal.note || undefined,
    };
 
    this.assetService.transferAsset(request).subscribe({
      next: (res) => {
        if (res.success) {
          this.transferDoneCount.update(n => n + 1);
          this.updateBucketItem(item.assetId, { transferring: false, transferred: true, failed: false });
        } else {
          this.transferFailCount.update(n => n + 1);
          this.updateBucketItem(item.assetId, {
            transferring: false,
            transferred: false,
            failed: true,
            failMessage: res.message || 'Transfer failed',
          });
        }
        // Small delay between calls to avoid hammering the API
        setTimeout(() => this.processNextTransfer(items, index + 1, formVal), 200);
      },
      error: (err) => {
        this.transferFailCount.update(n => n + 1);
        this.updateBucketItem(item.assetId, {
          transferring: false,
          transferred: false,
          failed: true,
          failMessage: err?.error?.message || 'Network error',
        });
        setTimeout(() => this.processNextTransfer(items, index + 1, formVal), 200);
      },
    });
  }
 
  private updateBucketItem(assetId: string, patch: Partial<BucketItem>): void {
    this.bucket.update(list =>
      list.map(item => item.assetId === assetId ? { ...item, ...patch } : item)
    );
  }
 
  retryFailed(): void {
    // Reset failed items so they are retryable
    this.bucket.update(list =>
      list.map(item => item.failed ? { ...item, failed: false, failMessage: undefined } : item)
    );
    this.openTransferDialog();
  }
 
  clearAndReset(): void {
    this.clearBucket();
    this.transferDoneCount.set(0);
    this.transferFailCount.set(0);
    this.scannedCount.set(0);
    this.showResults.set(false);
    this.lastScanSuccess.set(null);
    sessionStorage.removeItem(BUCKET_STORAGE_KEY);
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // Dropdown data
  // ─────────────────────────────────────────────────────────────────────────
 
  private loadDropdownData(): void {
    forkJoin({
      sites : this.siteService.getMySites(),
      areas : this.areaService.getMyAreas(),
      users : this.userService.getOrganizationUsers(),
    }).subscribe({
      next: (r) => {
        this.sitesList.set(
          r.sites.data?.map(s => ({ value: s.id, label: s.name })) ?? []
        );
        this.allAreasList.set(
          r.areas.data?.map(a => ({ value: a.id, label: a.name ?? '', siteId: a.siteId })) ?? []
        );
        this.filteredAreasList.set(this.allAreasList());
        this.usersList.set(
          r.users.data?.map(u => ({
            value: u.userProfileId,
            label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Unknown',
          })) ?? []
        );
      },
      error: () => {
        this.globalService.showToastr('Failed to load dropdown data', 'error');
      },
    });
  }
}
