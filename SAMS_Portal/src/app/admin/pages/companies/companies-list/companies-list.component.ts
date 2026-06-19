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

import { AdminPageHeaderComponent } from '../../../shared/widgets/admin-page-header/admin-page-header.component';
import { CompanyService } from '../../../../core/services/company/company.service';
import { CompanyWithUserInfo } from '../../../../core/models/interfaces/company/company.interface';
import { GlobalService } from '../../../../core/services/global/global.service';
import { JoinNonNullPipe } from '../../../../core/pipe/join-non-null.pipe';
import { FileUrlHelper } from '../../../../core/helper/get-file-url';
import { AssignSubscriptionDialogComponent } from '../assign-subscription-dialog/assign-subscription-dialog.component';
import { ToggleActiveDialogComponent } from '../toggle-active-dialog/toggle-active-dialog.component';
import { CompanyDetailService } from '../../../../core/services/admin/company/company-detail.service';
import { DeleteCompanyDialogComponent } from '../delete-company-dialog/delete-company-dialog.component';

// ─────────────────────────────────────────────────────────────────────────────
// Subscription status type — single source of truth for badge + toggle guard
// ─────────────────────────────────────────────────────────────────────────────
export type SubscriptionStatus =
  | 'no-plan'
  | 'plan-assigned'
  | 'active'
  | 'expired';
 

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
 
    // ── Data loading ──────────────────────────────────────────────────────────
 
    loadCompanies(): void {
        this.isLoading = true;
        this.companyService.getAllCompaniesWithUser().subscribe({
            next: (res) => {
                this.allCompanies = res.data ?? [];
                this.allCompanies.forEach(c => {
                    if (c.userInfo?.profilePicture)
                        c.userInfo.profilePicture = FileUrlHelper.getFullUrl(c.userInfo.profilePicture);
                    if (c.logo)
                        c.logo = FileUrlHelper.getFullUrl(c.logo);
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
 
    private refreshSingleCompany(companyId: number): void {
        this.companyDetailService.getCompanyById(companyId).subscribe({
            next: (res) => {
                if (!res?.data) return;
                const fresh = res.data as CompanyWithUserInfo;
                if (fresh.userInfo?.profilePicture)
                    fresh.userInfo.profilePicture = FileUrlHelper.getFullUrl(fresh.userInfo.profilePicture);
                if (fresh.logo) fresh.logo = FileUrlHelper.getFullUrl(fresh.logo);
                const idx = this.allCompanies.findIndex(c => c.id === companyId);
                if (idx !== -1) { this.allCompanies[idx] = fresh; this.applyFilters(); }
            },
            error: () => { /* silent — optimistic patch already applied */ }
        });
    }
 
    // ── Filtering ─────────────────────────────────────────────────────────────
 
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
 
        if (this.filterCountry !== 'all')
            result = result.filter(c => c.country === this.filterCountry);
 
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
 
    // ── Subscription status ───────────────────────────────────────────────────
 
    getSubscriptionStatus(company: CompanyWithUserInfo): SubscriptionStatus {
        if (!company.subscriptionId) return 'no-plan';
        if (!company.subscriptionDate || !company.subscriptionExpiryDate) return 'plan-assigned';
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const expiry = new Date(company.subscriptionExpiryDate); expiry.setHours(0, 0, 0, 0);
        return expiry < today ? 'expired' : 'active';
    }
 
    getSubscriptionBadge(company: CompanyWithUserInfo): { label: string; icon: string; css: string } {
        switch (this.getSubscriptionStatus(company)) {
            case 'no-plan':      return { label: 'No Plan',       icon: 'block',      css: 'badge--no-plan'  };
            case 'plan-assigned':return { label: 'Plan Assigned', icon: 'pending',    css: 'badge--assigned' };
            case 'expired':      return { label: 'Expired',       icon: 'event_busy', css: 'badge--expired'  };
            case 'active':       return { label: 'Subscribed',    icon: 'verified',   css: 'badge--active'   };
        }
    }
 
    // ── Toggle guard — ALSO requires isPlanActive ─────────────────────────────
 
    canToggleActive(company: CompanyWithUserInfo): boolean {
        return this.getSubscriptionStatus(company) === 'active'
            && (company.subscriptionPlan?.isPlanActive ?? false);
    }
 
    getToggleTooltip(company: CompanyWithUserInfo): string {
        const status = this.getSubscriptionStatus(company);
        if (status === 'active' && !(company.subscriptionPlan?.isPlanActive ?? false))
            return 'Subscription plan is inactive — activate the plan first';
        switch (status) {
            case 'no-plan':      return 'Assign a subscription plan before activating';
            case 'plan-assigned':return 'Subscription dates required to activate';
            case 'expired':      return 'Subscription has expired — renew to activate';
            case 'active':       return company.isActive ? 'Active — click to suspend' : 'Suspended — click to activate';
        }
    }
 
    // ── Helpers ───────────────────────────────────────────────────────────────
 
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
 
    // ── Actions ───────────────────────────────────────────────────────────────
 
    viewCompany(company: CompanyWithUserInfo): void {
        this.router.navigate(['/admin/companies', company.id]);
    }
 
    openSubscriptionDialog(company: CompanyWithUserInfo): void {
        const wasEditMode = !!company.subscriptionId;
        const ref = this.dialog.open(AssignSubscriptionDialogComponent, {
            width: '600px', maxWidth: '96vw', maxHeight: '90vh',
            panelClass: 'assign-sub-dialog-panel', data: { company }
        });
 
        ref.afterClosed().subscribe(result => {
            if (!result) return;
            company.subscriptionId = result.subscriptionId;
            company.subscriptionDate = result.startDate;
            company.subscriptionExpiryDate = result.endDate;
            this.applyFilters();
            this.refreshSingleCompany(company.id);
            this.globalService.showToastr(
                `Subscription ${wasEditMode ? 'updated' : 'assigned'} for ${company.name}`, 'success');
        });
    }
 
    onToggleActive(company: CompanyWithUserInfo, newState: boolean): void {
        if (!this.canToggleActive(company)) {
            this.globalService.showToastr(this.getToggleTooltip(company), 'warning');
            return;
        }
 
        const ref = this.dialog.open(ToggleActiveDialogComponent, {
            width: '440px', maxWidth: '96vw',
            panelClass: 'toggle-active-dialog-panel',
            data: { company: { name: company.name, id: company.id, organizationId: company.organizationId }, activate: newState }
        });
 
        ref.afterClosed().subscribe(confirmed => {
            if (!confirmed) return;
            this.companyDetailService.toggleCompanyActive(company.id, company.organizationId, newState).subscribe({
                next: (res) => {
                    if (res?.success) {
                        company.isActive = newState;
                        this.applyFilters();
                        this.globalService.showToastr(
                            `${company.name} ${newState ? 'activated' : 'suspended'} successfully`, 'success');
                    } else {
                        this.globalService.showToastr(res?.message ?? 'Toggle failed', 'error');
                    }
                },
                error: () => this.globalService.showToastr('Failed to update company status', 'error')
            });
        });
    }
 
    deleteCompany(company: CompanyWithUserInfo): void {
        const ref = this.dialog.open(DeleteCompanyDialogComponent, {
            width: '480px', maxWidth: '96vw',
            panelClass: 'delete-company-dialog-panel',
            data: { company: { id: company.id, name: company.name, organizationId: company.organizationId } }
        });
 
        ref.afterClosed().subscribe(result => {
            if (!result?.confirmed) return;
            this.companyDetailService.deleteCompany(company.id, result.reason).subscribe({
                next: (res) => {
                    if (res?.success) {
                        this.allCompanies = this.allCompanies.filter(c => c.id !== company.id);
                        this.applyFilters();
                        this.globalService.showToastr(`${company.name} deleted successfully`, 'success');
                    } else {
                        this.globalService.showToastr(res?.message ?? 'Delete failed', 'error');
                    }
                },
                error: () => this.globalService.showToastr('Failed to delete company', 'error')
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
}
