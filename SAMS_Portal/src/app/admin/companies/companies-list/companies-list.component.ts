import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, SlicePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { AdminPageHeaderComponent } from '../../shared/widgets/admin-page-header/admin-page-header.component';
import { CompanyService } from '../../../core/services/company/company.service';
import { CompanyWithUserInfo } from '../../../core/models/interfaces/company/company.interface';
import { GlobalService } from '../../../core/services/global/global.service';
import { JoinNonNullPipe } from '../../../core/pipe/join-non-null.pipe';
import { FileUrlHelper } from '../../../core/helper/get-file-url';
import { AssignSubscriptionDialogComponent } from '../assign-subscription-dialog/assign-subscription-dialog.component';
import { ToggleActiveDialogComponent } from '../toggle-active-dialog/toggle-active-dialog.component';
import { CompanyDetailService } from '../../../core/services/admin/company/company-detail.service';

// ─────────────────────────────────────────────────────────────────────────────
// Subscription status type — single source of truth for badge + toggle guard
// ─────────────────────────────────────────────────────────────────────────────
export type SubscriptionStatus =
  | 'no-plan'        // no subscriptionId at all
  | 'plan-assigned'  // has subscriptionId but one/both dates are missing
  | 'active'         // has id + both dates + expiry NOT yet crossed
  | 'expired';       // has id + both dates + expiry HAS crossed today
 

@Component({
  selector: 'app-companies-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    DatePipe, SlicePipe, TitleCasePipe,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressBarModule, MatChipsModule,
    MatTooltipModule, MatMenuModule, MatDividerModule, MatTableModule,
    MatDialogModule, MatSlideToggleModule,
    AdminPageHeaderComponent, JoinNonNullPipe,
  ],
  templateUrl: './companies-list.component.html',
  styleUrl: './companies-list.component.scss'
})
export class CompaniesListComponent implements OnInit {
 
  allCompanies: CompanyWithUserInfo[] = [];
  filteredCompanies: CompanyWithUserInfo[] = [];
  isLoading = false;
  viewMode: 'card' | 'table' = 'card';
 
  searchTerm = '';
  filterStatus: 'all' | 'active' | 'expired' | 'no-subscription' = 'all';
  filterCountry = 'all';
  sortBy: 'name' | 'date' | 'expiry' | 'status' = 'date';
  availableCountries: string[] = [];
 
  // ── Summary counts (header stats) ────────────────────────────────────────
  get totalCompanies() { return this.allCompanies.length; }
  get activeCompanies() { return this.allCompanies.filter(c => c.isActive).length; }
  get expiredCompanies() { return this.allCompanies.filter(c => this.getSubscriptionStatus(c) === 'expired').length; }
  get trialCompanies() { return this.allCompanies.filter(c => !c.subscriptionId).length; }
 
  tableColumns = ['company', 'admin', 'email', 'location', 'status', 'expiry', 'registered', 'actions'];
 
  constructor(
    private companyService: CompanyService,
    private companyDetailService: CompanyDetailService,
    private globalService: GlobalService,
    private router: Router,
    private dialog: MatDialog,
  ) { }
 
  ngOnInit(): void { this.loadCompanies(); }
 
  // ─────────────────────────────────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────────────────────────────────
 
  loadCompanies(): void {
    this.isLoading = true;
    this.companyService.getAllCompaniesWithUser().subscribe({
      next: (res) => {
        this.allCompanies = res.data ?? [];
        this.allCompanies.forEach(c => {
          if (c.userInfo?.profilePicture) {
            c.userInfo.profilePicture = FileUrlHelper.getFullUrl(c.userInfo.profilePicture);
          }
          if ((c as any).isActive === undefined) (c as any).isActive = false;
        });
        this.extractCountries();
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.globalService.showToastr('Failed to load companies', 'error');
        this.isLoading = false;
      }
    });
  }
 
  /**
   * Refreshes only a single company from the server in-place.
   * No full list reload — smooth optimistic UX.
   *
   * Requires: GET /admin/company/get-by-id?id={companyId}
   * If this endpoint does not exist, see api-requirements.md
   */
  private refreshSingleCompany(companyId: number): void {
    this.companyDetailService.getCompanyById(companyId).subscribe({
      next: (res) => {
        if (!res?.data) return;
        const fresh = res.data as CompanyWithUserInfo;
        if (fresh.userInfo?.profilePicture) {
          fresh.userInfo.profilePicture = FileUrlHelper.getFullUrl(fresh.userInfo.profilePicture);
        }
        const idx = this.allCompanies.findIndex(c => c.id === companyId);
        if (idx !== -1) {
          this.allCompanies[idx] = fresh;
          this.applyFilters();
        }
      },
      error: () => { /* silent — local optimistic patch already applied */ }
    });
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // FILTERING & SORTING
  // ─────────────────────────────────────────────────────────────────────────
 
  private extractCountries(): void {
    const set = new Set<string>();
    this.allCompanies.forEach(c => { if (c.country) set.add(c.country); });
    this.availableCountries = Array.from(set).sort();
  }
 
  applyFilters(): void {
    let result = [...this.allCompanies];
 
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.trim().toLowerCase();
      result = result.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.country?.toLowerCase().includes(q) ||
        c.organizationId?.toLowerCase().includes(q) ||
        c.userInfo?.firstName?.toLowerCase().includes(q) ||
        c.userInfo?.lastName?.toLowerCase().includes(q) ||
        c.userInfo?.email?.toLowerCase().includes(q)
      );
    }
 
    if (this.filterStatus !== 'all') {
      result = result.filter(c => {
        const status = this.getSubscriptionStatus(c);
        if (this.filterStatus === 'active')          return c.isActive;
        if (this.filterStatus === 'expired')         return status === 'expired';
        if (this.filterStatus === 'no-subscription') return status === 'no-plan';
        return true;
      });
    }
 
    if (this.filterCountry !== 'all') {
      result = result.filter(c => c.country === this.filterCountry);
    }
 
    result.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':   return (a.name ?? '').localeCompare(b.name ?? '');
        case 'date':   return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
        case 'expiry': return new Date(a.subscriptionExpiryDate ?? 0).getTime() - new Date(b.subscriptionExpiryDate ?? 0).getTime();
        case 'status': return Number(b.isActive) - Number(a.isActive);
        default:       return 0;
      }
    });
 
    this.filteredCompanies = result;
  }
 
  clearFilters(): void {
    this.searchTerm = ''; this.filterStatus = 'all';
    this.filterCountry = 'all'; this.sortBy = 'date';
    this.applyFilters();
  }
 
  hasActiveFilters(): boolean {
    return this.searchTerm.trim() !== '' || this.filterStatus !== 'all' || this.filterCountry !== 'all';
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // SUBSCRIPTION STATUS — single source of truth
  // ─────────────────────────────────────────────────────────────────────────
 
  /**
   * Status rules:
   *  'no-plan'       → no subscriptionId
   *  'plan-assigned' → has subscriptionId, but missing subscriptionDate or subscriptionExpiryDate
   *  'expired'       → has all fields, subscriptionExpiryDate < today
   *  'active'        → has all fields, subscriptionExpiryDate >= today
   */
  getSubscriptionStatus(company: CompanyWithUserInfo): SubscriptionStatus {
    if (!company.subscriptionId) return 'no-plan';
    if (!company.subscriptionDate || !company.subscriptionExpiryDate) return 'plan-assigned';
 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(company.subscriptionExpiryDate);
    expiry.setHours(0, 0, 0, 0);
 
    return expiry < today ? 'expired' : 'active';
  }
 
  /** Returns label, icon, and CSS class for the subscription badge in the template */
  getSubscriptionBadge(company: CompanyWithUserInfo): { label: string; icon: string; css: string } {
    switch (this.getSubscriptionStatus(company)) {
      case 'no-plan':
        return { label: 'No Plan',       icon: 'block',        css: 'badge--no-plan'  };
      case 'plan-assigned':
        return { label: 'Plan Assigned', icon: 'pending',      css: 'badge--assigned' };
      case 'expired':
        return { label: 'Expired',       icon: 'event_busy',   css: 'badge--expired'  };
      case 'active':
        return { label: 'Subscribed',    icon: 'verified',     css: 'badge--active'   };
    }
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // TOGGLE ACTIVE GUARD
  // ─────────────────────────────────────────────────────────────────────────
 
  /**
   * Toggle is ENABLED only when subscription status is 'active':
   *  ✅ has subscriptionId
   *  ✅ has subscriptionDate
   *  ✅ has subscriptionExpiryDate
   *  ✅ subscriptionExpiryDate >= today (not expired)
   *
   * 'expired' status → toggle DISABLED (must renew plan first)
   */
  canToggleActive(company: CompanyWithUserInfo): boolean {
    return this.getSubscriptionStatus(company) === 'active';
  }
 
  getToggleTooltip(company: CompanyWithUserInfo): string {
    switch (this.getSubscriptionStatus(company)) {
      case 'no-plan':
        return 'Assign a subscription plan before activating';
      case 'plan-assigned':
        return 'Subscription dates required to activate';
      case 'expired':
        return 'Subscription has expired — renew to activate';
      case 'active':
        return company.isActive ? 'Active — click to suspend' : 'Suspended — click to activate';
    }
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────
 
  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }
 
  isExpiringSoon(expiryDate: string | undefined): boolean {
    if (!expiryDate) return false;
    const diff = new Date(expiryDate).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  }
 
  trackById(_: number, c: CompanyWithUserInfo): number { return c.id; }
 
  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────────────────
 
  viewCompany(company: CompanyWithUserInfo): void {
    this.router.navigate(['/admin/companies', company.id]);
  }
 
  openSubscriptionDialog(company: CompanyWithUserInfo): void {
    const wasEditMode = !!company.subscriptionId;
 
    const ref = this.dialog.open(AssignSubscriptionDialogComponent, {
      width: '600px',
      maxWidth: '96vw',
      maxHeight: '90vh',
      panelClass: 'assign-sub-dialog-panel',
      data: { company }
    });
 
    ref.afterClosed().subscribe(result => {
      if (!result) return;
 
      // ── Optimistic local patch ─────────────────────────────────────────
      company.subscriptionId = result.subscriptionId;
      company.subscriptionDate = result.startDate;
      company.subscriptionExpiryDate = result.endDate;
      // ⚠️  isActive is NOT touched here.
      // The company's active/inactive state is controlled ONLY via the
      // dedicated toggle button — never auto-changed after subscription add/edit.
 
      this.applyFilters();
 
      // ── Server refresh for authoritative state (single company only) ───
      this.refreshSingleCompany(company.id);
 
      this.globalService.showToastr(
        `Subscription ${wasEditMode ? 'updated' : 'assigned'} for ${company.name}`,
        'success'
      );
    });
  }
 
  onToggleActive(company: CompanyWithUserInfo, newState: boolean): void {
    if (!this.canToggleActive(company)) {
      this.globalService.showToastr(this.getToggleTooltip(company), 'warning');
      return;
    }
 
    const ref = this.dialog.open(ToggleActiveDialogComponent, {
      width: '440px',
      maxWidth: '96vw',
      panelClass: 'toggle-active-dialog-panel',
      data: {
        company: {
          name: company.name,
          id: company.id,
          organizationId: company.organizationId,
        },
        activate: newState,
      }
    });
 
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
 
      this.companyDetailService.toggleCompanyActive(
        company.id,
        company.organizationId,
        newState
      ).subscribe({
        next: (res) => {
          if (res?.success) {
            company.isActive = newState;
            this.applyFilters();
            this.globalService.showToastr(
              `${company.name} ${newState ? 'activated' : 'suspended'} successfully`,
              'success'
            );
          } else {
            this.globalService.showToastr(res?.message ?? 'Toggle failed', 'error');
          }
        },
        error: () => {
          this.globalService.showToastr('Failed to update company status', 'error');
        }
      });
    });
  }
 
  contactAdmin(company: CompanyWithUserInfo): void {
    const email = company.userInfo?.email ?? company.email;
    if (email) window.open(`mailto:${email}`);
    else this.globalService.showToastr('No email address found', 'warning');
  }
 
  contactCompanyPhone(company: CompanyWithUserInfo): void {
    const phone = company.phone ?? company.userInfo?.phoneNumber;
    if (phone) window.open(`tel:${phone}`);
    else this.globalService.showToastr('No phone number found', 'warning');
  }
 
  deleteCompany(company: CompanyWithUserInfo): void {
    this.globalService.showToastr(`Delete ${company.name} — wire to confirmation dialog`, 'error');
  }
}
