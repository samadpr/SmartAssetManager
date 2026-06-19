import { Component, computed, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { animate, style, transition, trigger } from '@angular/animations';
import { Company, CompanyRequest } from '../../../core/models/interfaces/company/company.interface';
import { Industry } from '../../../core/models/interfaces/company/Industries.interface';
import { CountryService } from '../../../core/services/account/country/country.service';
import { IndustriesService } from '../../../core/services/Industries/industries.service';
import { CompanyService } from '../../../core/services/company/company.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { RouterModule } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { Subscriptions } from '../../../core/models/admin/subscriptions.interface';
import { FileUrlHelper } from '../../../core/helper/get-file-url';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../../core/services/dashboard/dashboard.service';
import { CompanyStorageService } from '../../../core/services/localStorage/company/company-storage.service';

// ─── View models ──────────────────────────────────────────────────────────────
interface UsageStats {
  assetsUsed: number;
  systemUsersUsed: number;
  totalUsersUsed: number;
}

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PageHeaderComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule,
    MatRippleModule,
  ],
  templateUrl: './company.component.html',
  styleUrl: './company.component.scss',
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate('380ms ease-out', style({ opacity: 1, transform: 'none' }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(18px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ]
})
export class CompanyComponent implements OnInit {

  // ── State ──────────────────────────────────────────────────────────────────
  isLoading = signal(true);
  isStatsLoading = signal(true);
  isSaving = signal(false);
  isEditMode = signal(false);
  orgIdCopied = signal(false);

  companyData = signal<Company | null>(null);
  industries = signal<Industry[]>([]);
  countries = signal<any[]>([]);
  subscriptionData = signal<Subscriptions | null>(null);
  logoPreview = signal<string | null>(null);
  selectedLogoFile: File | null = null;

  isDragOver = false;

  usageStats = signal<UsageStats>({
    assetsUsed: 0,
    systemUsersUsed: 0,
    totalUsersUsed: 0
  });

  companyForm!: FormGroup;

  // ── Computed ───────────────────────────────────────────────────────────────
  companyLogoUrl = computed(() => {
    const logo = this.companyData()?.logo;
    if (!logo) return 'assets/images/logos/company_logo.png';
    return FileUrlHelper.getFullUrl(logo);
  });

  industryName = computed(() => {
    const id = this.companyData()?.industriesId;
    if (!id) return 'Not specified';
    return this.industries().find(i => i.id === id)?.name || 'Not specified';
  });

  shortOrgId = computed(() => {
    const id = this.companyData()?.organizationId;
    if (!id) return '—';
    return id.length > 14 ? `${id.substring(0, 8)}…${id.slice(-4)}` : id;
  });

  isExpiringSoon = computed(() => {
    const exp = this.companyData()?.subscriptionExpiryDate;
    if (!exp) return false;
    const diff = new Date(exp).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  });

  daysLeft = computed(() => {
    const exp = this.companyData()?.subscriptionExpiryDate;
    if (!exp) return 0;
    return Math.ceil((new Date(exp).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  });

  // ── Usage percentages (capped 0–100) ──────────────────────────────────────
  assetUsagePct = computed(() => {
    const limit = this.subscriptionData()?.assetLimit;
    const used = this.usageStats().assetsUsed;
    if (!limit || limit <= 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  });

  systemUserUsagePct = computed(() => {
    const limit = this.subscriptionData()?.systemUserLimit;
    const used = this.usageStats().systemUsersUsed;
    if (!limit || limit <= 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  });

  totalUserUsagePct = computed(() => {
    const limit = this.subscriptionData()?.totalUserLimit;
    const used = this.usageStats().totalUsersUsed;
    if (!limit || limit <= 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  });

  // ── Remaining slots ────────────────────────────────────────────────────────
  assetRemaining = computed(() =>
    Math.max(0, (this.subscriptionData()?.assetLimit ?? 0) - this.usageStats().assetsUsed)
  );

  systemUserRemaining = computed(() =>
    Math.max(0, (this.subscriptionData()?.systemUserLimit ?? 0) - this.usageStats().systemUsersUsed)
  );

  totalUserRemaining = computed(() =>
    Math.max(0, (this.subscriptionData()?.totalUserLimit ?? 0) - this.usageStats().totalUsersUsed)
  );

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private industriesService: IndustriesService,
    private countryService: CountryService,
    private globalService: GlobalService,
    private dashboardService: DashboardService,
    private companyStorage: CompanyStorageService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  // ── Form init ──────────────────────────────────────────────────────────────
  private initForm(): void {
    this.companyForm = this.fb.group({
      id: [null],
      industriesId: [null, Validators.required],
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)],
      fax: [''],
      currency: [''],
      address: [''],
      city: [''],
      country: [''],
      website: ['', Validators.pattern(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)],
      logo: [''],
    });
  }

  // ── Data loading ───────────────────────────────────────────────────────────
  private loadData(): void {
    this.isLoading.set(true);
    this.isStatsLoading.set(true);

    // Industries (non-blocking)
    this.industriesService.getAllIndustries().subscribe({
      next: r => { if (r.success && r.data) this.industries.set(r.data); },
      error: () => { }
    });

    // Countries (sync)
    this.countries.set(this.countryService.getAllCountries());

    // Company + KPI in parallel
    forkJoin({
      company: this.companyService.getCurrentUserCompany(),
      kpi: this.dashboardService.getKpiStats()
    }).subscribe({
      next: ({ company, kpi }) => {

        // ── Company ─────────────────────────────────────────────────────
        if (company.success && company.data) {
          this.companyData.set(company.data);
          this.companyForm.patchValue(company.data as any);

          if (company.data.subscriptionPlan) {
            this.subscriptionData.set(company.data.subscriptionPlan as Subscriptions);
          }
        }

        // ── KPI stats → usage ───────────────────────────────────────────
        if (kpi.success && kpi.data) {
          const d = kpi.data;

          /*
           * KPI field mapping (adjust if your backend uses different keys):
           *   d.totalAssets.value     → total assets created in the org
           *   d.activeUsers.value     → users with login access (system users)
           *   d.sitesAndBranches      → not needed here
           *
           * For "total users" we use activeUsers as the best available proxy.
           * If your dashboard exposes a separate "totalUsers" KPI, swap it in.
           */
          const assetsUsed = Number(d.totalAssets?.value) ?? 0;
          const systemUsersUsed = Number(d.systemUsers?.value) ?? 0;
          const totalUsersUsed = Number(d.activeUsers?.value) ?? 0;

          this.usageStats.set({ assetsUsed, systemUsersUsed, totalUsersUsed });
        }

        this.isLoading.set(false);
        this.isStatsLoading.set(false);
      },
      error: () => {
        // Try company alone so the page still loads
        this.companyService.getCurrentUserCompany().subscribe({
          next: r => {
            if (r.success && r.data) {
              this.companyData.set(r.data);
              this.companyForm.patchValue(r.data as any);
              if (r.data.subscriptionPlan) {
                this.subscriptionData.set(r.data.subscriptionPlan as Subscriptions);
              }
            }
            this.isLoading.set(false);
          },
          error: () => {
            this.globalService.showToastr('Failed to load company data', 'error');
            this.isLoading.set(false);
          }
        });
        this.isStatsLoading.set(false);
      }
    });
  }

  private updateCompanyLocallStorage(){
    this.companyService.getCurrentUserCompany().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.companyStorage.clear(); // Clear old data
          const company = response.data;
          this.companyStorage.save(company);
        }
      },
      error: (err) => {
        console.error('Error loading company data:', err);
        // Keep default values on error
      }
    });
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  toggleEditMode(): void {
    if (this.isEditMode()) {
      const d = this.companyData();
      if (d) this.companyForm.patchValue(d as any);
      this.logoPreview.set(null);
      this.selectedLogoFile = null;
      this.isEditMode.set(false);
    } else {
      this.isEditMode.set(true);
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  saveCompany(): void {
    if (this.companyForm.invalid) {
      this.markAllTouched();
      this.globalService.showToastr('Please fill in all required fields', 'error');
      return;
    }

    this.isSaving.set(true);
    const request: CompanyRequest = {
      ...this.companyForm.value,
      logo: this.selectedLogoFile ?? (this.companyForm.value.logo || null)
    };

    this.companyService.updateCompany(request).subscribe({
      next: r => {
        if (r.success) {
          this.globalService.showToastr('Company profile updated successfully', 'success');
          // this.loadData();
          this.updateCompanyLocallStorage();
          this.isEditMode.set(false);
          this.logoPreview.set(null);
          this.selectedLogoFile = null;
          setTimeout(() => window.location.reload(), 500);
        } else {
          this.globalService.showToastr(r.message || 'Update failed', 'error');
        }
        this.isSaving.set(false);
      },
      error: () => {
        this.globalService.showToastr('Failed to update company', 'error');
        this.isSaving.set(false);
      }
    });
  }

  // ── Logo handling ──────────────────────────────────────────────────────────
  onLogoFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this._previewFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this._previewFile(file);
    }
  }

  private _previewFile(file: File): void {
    this.selectedLogoFile = file;
    const reader = new FileReader();
    reader.onload = () => this.logoPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onLogoError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/images/logos/company_logo.png';
  }

  // ── Org ID copy (works over HTTP too) ─────────────────────────────────────
  copyOrgId(): void {
    const id = this.companyData()?.organizationId;
    if (!id) return;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(id)
        .then(() => this._showCopied())
        .catch(() => this._fallbackCopy(id));
    } else {
      this._fallbackCopy(id);
    }
  }

  private _fallbackCopy(text: string): void {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      this._showCopied();
    } catch { /* silent */ }
    document.body.removeChild(ta);
  }

  private _showCopied(): void {
    this.orgIdCopied.set(true);
    setTimeout(() => this.orgIdCopied.set(false), 2000);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getFlagUrl(countryNameOrCode: string): string {
    const all = this.countries();
    const found = all.find(c =>
      c.code?.toLowerCase() === countryNameOrCode?.toLowerCase() ||
      c.name?.toLowerCase() === countryNameOrCode?.toLowerCase()
    );
    const code = found?.code || countryNameOrCode?.substring(0, 2).toUpperCase();
    return this.countryService.getFlagUrl(code);
  }

  /**
   * SVG stroke-dasharray for mini donut (r=30, circumference≈188.5).
   */
  donutDash(pct: number): string {
    const circ = 188.5;
    const clamped = Math.max(0, Math.min(100, pct));
    const filled = (clamped / 100) * circ;
    return `${filled} ${circ - filled}`;
  }

  /** CSS class for gauge fill based on usage level */
  gaugeFillClass(pct: number, base: string): string {
    if (pct >= 90) return 'gf-danger';
    if (pct >= 75) return 'gf-warning';
    return base;
  }

  private markAllTouched(): void {
    Object.values(this.companyForm.controls).forEach(c => c.markAsTouched());
  }
}
