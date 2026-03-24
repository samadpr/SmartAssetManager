import { Component, Inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { CompanyWithUserInfo } from '../../../core/models/interfaces/company/company.interface';
import { SubscriptionsService } from '../../../core/services/admin/subscriptions/subscriptions.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { SubscriptionsRequest } from '../../../core/models/admin/subscriptions.interface';
 
export interface AssignSubscriptionDialogData {
  company: CompanyWithUserInfo;
}
 
// Duration preset options
export interface DurationPreset {
  label: string;
  days: number;
  icon: string;
  popular?: boolean;
}
 
const DURATION_PRESETS: DurationPreset[] = [
  { label: '7 Days', days: 7, icon: 'calendar_view_week' },
  { label: '1 Month', days: 30, icon: 'calendar_month' },
  { label: '3 Months', days: 90, icon: 'date_range', popular: false },
  { label: '6 Months', days: 180, icon: 'date_range', popular: true },
  { label: '1 Year', days: 365, icon: 'event_available', popular: true },
  { label: '2 Years', days: 730, icon: 'workspace_premium' },
];
 
@Component({
  selector: 'app-assign-subscription-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, DecimalPipe,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatProgressSpinnerModule, MatTooltipModule,
    MatDividerModule, MatChipsModule,
  ],
  templateUrl: './assign-subscription-dialog.component.html',
  styleUrl: './assign-subscription-dialog.component.scss'
})
export class AssignSubscriptionDialogComponent {
  
  form!: FormGroup;
  saving = false;
  isEditMode = false;
 
  durationPresets = DURATION_PRESETS;
  selectedPresetDays = signal<number | null>(null);
 
  // "YYYY-MM-DD" string — drives expiry display in template
  expiryDateStr = signal<string | null>(null);
 
  totalCostDisplay = computed(() => {
    const amount = this.form?.get('planAmount')?.value ?? 0;
    const days   = this.form?.get('durationDays')?.value ?? 0;
    if (!amount || !days) return null;
    const months = +(days / 30).toFixed(1);
    return { total: amount, perDay: +(amount / days).toFixed(2), months };
  });
 
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AssignSubscriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignSubscriptionDialogData,
    private subscriptionsService: SubscriptionsService,
    private globalService: GlobalService,
  ) {}
 
  ngOnInit(): void {
    this.isEditMode = !!this.data.company.subscriptionId;
    this._buildForm();
    if (this.isEditMode) {
      this._patchExistingValues();
    }
    this.form.get('startDate')?.valueChanges.subscribe(() => this._recalcExpiry());
    this.form.get('durationDays')?.valueChanges.subscribe(() => this._recalcExpiry());
    this._recalcExpiry();
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // FORM BUILD
  // ─────────────────────────────────────────────────────────────────────────
 
  private _buildForm(): void {
    this.form = this.fb.group({
      name:            ['',   [Validators.required, Validators.minLength(2)]],
      planAmount:      [null, [Validators.required, Validators.min(0)]],
      durationDays:    [null, [Validators.required, Validators.min(1), Validators.max(3650)]],
      startDate:       [this._todayStr(), [Validators.required]],
      assetLimit:      [null, [Validators.required, Validators.min(1)]],
      systemUserLimit: [null, [Validators.required, Validators.min(1)]],
      totalUserLimit:  [null, [Validators.required, Validators.min(1)]],
      isPlanActive:    [true],
    });
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // PATCH EDIT VALUES
  // ─────────────────────────────────────────────────────────────────────────
 
  private _patchExistingValues(): void {
    const c = this.data.company;
    if (!c.subscriptionId) return;
 
    this.subscriptionsService.getSubscriptionById(c.subscriptionId).subscribe({
      next: (res) => {
        if (!res?.data) return;
        const sub = res.data;
 
        this.form.patchValue({
          name:            sub.name,
          planAmount:      sub.planAmount,
          durationDays:    sub.durationDays,
          assetLimit:      sub.assetLimit,
          systemUserLimit: sub.systemUserLimit,
          totalUserLimit:  sub.totalUserLimit,
          isPlanActive:    sub.isPlanActive,
        });
 
        const match = this.durationPresets.find(p => p.days === sub.durationDays);
        if (match) this.selectedPresetDays.set(match.days);
 
        // _extractDatePart slices characters 0-9 directly from the string.
        // It NEVER calls new Date() so timezone can never shift the value.
        // "2026-03-13T00:00:00"          → "2026-03-13"  ✅
        // "2026-03-12T20:00:00.000000Z"  → "2026-03-12"  ✅ (takes the literal DB value)
        const rawStart = (sub as any).subscriptionDate ?? c.subscriptionDate;
        if (rawStart) {
          this.form.patchValue({ startDate: this._extractDatePart(rawStart) });
        }
 
        this._recalcExpiry();
      }
    });
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // EXPIRY RECALC — pure string arithmetic, zero Date objects involved
  // ─────────────────────────────────────────────────────────────────────────
 
  private _recalcExpiry(): void {
    const startStr: string = this.form.get('startDate')?.value;
    const days: number     = this.form.get('durationDays')?.value;
 
    if (startStr && days && days > 0) {
      this.expiryDateStr.set(this._addDaysToDateStr(startStr, Number(days)));
    } else {
      this.expiryDateStr.set(null);
    }
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────────────────────────────────────────
 
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const v = this.form.value;
 
    // ─── KEY RULE ───────────────────────────────────────────────────────────
    // Append T00:00:00 directly to the "YYYY-MM-DD" string from the form.
    // No new Date(), no toISOString(), no timezone conversion — ever.
    // The backend receives exactly "2026-03-13T00:00:00" and stores it as-is.
    // ────────────────────────────────────────────────────────────────────────
    const subscriptionDate: string | undefined =
      v.startDate ? `${v.startDate}T00:00:00` : undefined;
 
    const subscriptionExpiryDate: string | undefined =
      this.expiryDateStr() ? `${this.expiryDateStr()}T00:00:00` : undefined;
 
    const payload: SubscriptionsRequest = {
      name:            v.name,
      planAmount:      Number(v.planAmount),
      durationDays:    Number(v.durationDays),
      assetLimit:      Number(v.assetLimit),
      systemUserLimit: Number(v.systemUserLimit),
      totalUserLimit:  Number(v.totalUserLimit),
      isPlanActive:    v.isPlanActive,
      subscriptionDate,
      subscriptionExpiryDate,
    };
 
    if (this.isEditMode && this.data.company.subscriptionId) {
      const updatePayload: SubscriptionsRequest = {
        ...payload,
        id: this.data.company.subscriptionId,
      };
      this.subscriptionsService.updateSubscription(this.data.company.id, updatePayload).subscribe({
        next: (res) => {
          this.saving = false;
          if (res?.success) {
            this.dialogRef.close({
              subscriptionId: this.data.company.subscriptionId,
              startDate:      subscriptionDate,
              endDate:        subscriptionExpiryDate,
              planName:       v.name,
              isPlanActive:   v.isPlanActive,
            });
          } else {
            this.globalService.showToastr(res?.message ?? 'Update failed', 'error');
          }
        },
        error: () => {
          this.saving = false;
          this.globalService.showToastr('Failed to update subscription', 'error');
        }
      });
    } else {
      this.subscriptionsService.createSubscription(this.data.company.id, payload).subscribe({
        next: (res) => {
          this.saving = false;
          if (res?.success && res.data) {
            this.dialogRef.close({
              subscriptionId: res.data.id,
              startDate:      subscriptionDate,
              endDate:        subscriptionExpiryDate,
              planName:       v.name,
              isPlanActive:   v.isPlanActive,
            });
          } else {
            this.globalService.showToastr(res?.message ?? 'Creation failed', 'error');
          }
        },
        error: () => {
          this.saving = false;
          this.globalService.showToastr('Failed to create subscription', 'error');
        }
      });
    }
  }
 
  onCancel(): void {
    this.dialogRef.close(null);
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // TEMPLATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────
 
  selectPreset(preset: DurationPreset): void {
    this.selectedPresetDays.set(preset.days);
    this.form.patchValue({ durationDays: preset.days });
  }
 
  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }
 
  get durationDaysValue(): number {
    return this.form.get('durationDays')?.value ?? 0;
  }
 
  get isCustomDuration(): boolean {
    const d = this.form.get('durationDays')?.value;
    return d && !this.durationPresets.some(p => p.days === d);
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE DATE UTILITIES — strings only, no timezone conversion
  // ─────────────────────────────────────────────────────────────────────────
 
  /**
   * Today's date as "YYYY-MM-DD" in LOCAL time.
   * Uses getFullYear/Month/Date (local) — never toISOString() (UTC).
   */
  private _todayStr(): string {
    const d  = new Date();
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }
 
  /**
   * Extracts "YYYY-MM-DD" from any backend date string WITHOUT new Date().
   * Just takes the first 10 characters — always safe regardless of format:
   *
   *   "2026-03-13"                       → "2026-03-13"
   *   "2026-03-13T00:00:00"              → "2026-03-13"
   *   "2026-03-12T20:00:00.0000000Z"     → "2026-03-12"
   *   "2026-03-13T00:00:00+05:30"        → "2026-03-13"
   */
  private _extractDatePart(raw: string | Date): string {
    if (raw instanceof Date) {
      // Only if already a Date object — read local fields
      const yy = raw.getFullYear();
      const mm = String(raw.getMonth() + 1).padStart(2, '0');
      const dd = String(raw.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    }
    return String(raw).slice(0, 10);
  }
 
  /**
   * Adds N days to "YYYY-MM-DD" → returns "YYYY-MM-DD".
   * Uses new Date(yyyy, mm-1, dd) constructor which is LOCAL midnight — safe.
   * Reads result via local getFullYear/Month/Date — no UTC shift.
   */
  private _addDaysToDateStr(dateStr: string, days: number): string {
    const [yyyy, mm, dd] = dateStr.split('-').map(Number);
    const d = new Date(yyyy, mm - 1, dd);   // local midnight — safe
    d.setDate(d.getDate() + days);
    const ry = d.getFullYear();
    const rm = String(d.getMonth() + 1).padStart(2, '0');
    const rd = String(d.getDate()).padStart(2, '0');
    return `${ry}-${rm}-${rd}`;
  }
}
