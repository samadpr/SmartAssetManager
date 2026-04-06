import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ManageAssetsComponent } from './pages/assets/manage-assets/manage-assets.component';
import { ManageUserComponent } from './pages/users/manage-user/manage-user.component';
import { UserProfilesComponent } from './pages/users/user-profiles/user-profiles.component';
import { DesignationComponent } from './pages/users/designation/designation.component';
import { ProfileComponent } from './pages/account/profile/profile.component';
import { SettingsComponent } from './pages/settings/settings/settings.component';
import { LoginComponent } from './pages/account/login/login.component';
import { RegisterComponent } from './pages/account/register/register.component';
import { LayoutbodyComponent } from './shared/layout/layoutbody/layoutbody.component';
import { ConfirmotpComponent } from './pages/account/confirmotp/confirmotp.component';
import { authGuard, portalGuard } from './core/guards/auth.guard';
import { ManageRolesComponent } from './pages/roles/manage-roles/manage-roles.component';
import { DepartmentComponent } from './pages/department-subdepartment/department/department.component';
import { SubDepartmentComponent } from './pages/department-subdepartment/sub-department/sub-department.component';
import { UserEmailVerificationComponent } from './pages/users/user-email-verification/user-email-verification.component';
import { CompanyComponent } from './pages/company/company/company.component';
import { CompanyOnboardingComponent } from './pages/company/company-onboarding/company-onboarding.component';
import { SitesOrBranchsComponent } from './pages/sites-or-branchs/sites-or-branchs/sites-or-branchs.component';
import { AreasComponent } from './pages/sites-or-branchs/areas/areas.component';
import { CitiesComponent } from './pages/sites-or-branchs/cities/cities.component';
import { AssetCategoryComponent } from './pages/assets/asset-category/asset-category/asset-category.component';
import { AssetSubCategoryComponent } from './pages/assets/asset-category/asset-sub-category/asset-sub-category.component';
import { LoginAccessComponent } from './pages/users/login-access/login-access.component';
import { UserPasswordSetupComponent } from './pages/users/user-password-setup/user-password-setup.component';
import { SupplierComponent } from './pages/assets/supplier/supplier.component';
import { AssetApproveComponent } from './pages/assets/asset-approve/asset-approve.component';
import { ReportsComponent } from './pages/reports/reports/reports.component';
import { AssetReportComponent } from './pages/reports/asset-report/asset-report.component';
import { AssetQrBarcodeComponent } from './pages/assets/asset-qr-barcode/asset-qr-barcode.component';
import { AssetsIssueComponent } from './pages/assets-issue/assets-issue.component';
import { roleGuard } from './core/guards/role.guard';
import { SelectPlanComponent } from './pages/account/select-plan/select-plan.component';
import { activationGuard } from './core/guards/subscription.guard';
import { PendingActivationComponent } from './pages/account/pending-activation/pending-activation.component';
import { SiteAssetOverviewComponent } from './pages/sites-or-branchs/site-asset-overview/site-asset-overview.component';
import { AssetBulkUploadComponent } from './pages/assets/manage-assets/asset-bulk-upload/asset-bulk-upload.component';
import { AssetBulkTransferComponent } from './pages/assets/asset-bulk-transfer/asset-bulk-transfer.component';
import { AssetTransferReportComponent } from './pages/reports/asset-transfer-report/asset-transfer-report.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
    },
    {
        path: 'login',
        component: LoginComponent,
        title: 'Login'
    },
    {
        path: 'register',
        component: RegisterComponent,
        title: 'Register'
    },
    {
        path: 'confirmotp',
        component: ConfirmotpComponent,
        title: 'Confirm OTP'
    },
    {
        path: 'company-onboarding',
        component: CompanyOnboardingComponent,
        canActivate: [authGuard],
        title: 'Company Onboarding'
    },
    // ── Pending activation waiting room ──────────────────────────────────────
    // Requires auth only (not activationGuard — that would cause a redirect loop)
    {
        path: 'pending-activation',
        component: PendingActivationComponent,
        canActivate: [authGuard],
        title: 'Awaiting Activation'
    },
    {
        path: 'user-email-verification',
        component: UserEmailVerificationComponent,
        title: 'Email Verification'
    },
    {
        path: 'user-password-setup',
        component: UserPasswordSetupComponent,
        title: 'Password Setup'
    },
    {
        path: '',
        canActivate: [authGuard, portalGuard, activationGuard],
        data: { portal: 'tenant' },
        component: LayoutbodyComponent,
        children: [
            {
                path: 'dashboard',
                component: DashboardComponent,
                title: 'Dashboard'
            },
            {
                path: 'assets',
                component: ManageAssetsComponent,
                title: 'Manage Assets'
            },
            {
                path: 'assets/site-branch-assets-overview',
                component: SiteAssetOverviewComponent,
                title: 'Site & Branch Assets Overview'
            },
            {
                path: 'assets/bulk-upload',
                component: AssetBulkUploadComponent,
                title: 'Bulk Asset Upload'
            },
            {
                path: 'assets/suppliers',
                component: SupplierComponent,
                title: 'Suppliers'
            },
            {
                path: 'assets/asset-approve',
                component: AssetApproveComponent,
                title: 'Asset Approve'
            },
            {
                path: 'assets/asset-issue',
                component: AssetsIssueComponent,
                title: 'Asset Issue'
            },
            {
                path: 'assets/asset-qr-barcode',
                component: AssetQrBarcodeComponent,
                title: 'Asset QR & Barcode'
            },
            {
                path: 'assets/bulk-transfer',
                component: AssetBulkTransferComponent,
                title: 'Asset Bulk Transfer'
            },
            {
                path: 'asset-category',
                component: AssetCategoryComponent,
                title: 'Asset Category'
            },
            {
                path: 'asset-category/asset-sub-category',
                component: AssetSubCategoryComponent,
                title: 'Asset Sub Category'
            },
            {
                path: 'sites-branchs',
                component: SitesOrBranchsComponent,
                title: 'Sites & Branchs'
            },
            {
                path: 'sites-branchs/cities',
                component: CitiesComponent,
                title: 'Cities'
            },
            {
                path: 'sites-branchs/areas',
                component: AreasComponent,
                title: 'Areas'
            },
            {
                path: 'manage-users',
                component: ManageUserComponent,
                title: 'Manage Users'
            },
            {
                path: 'manage-users/login-access',
                component: LoginAccessComponent,
                title: 'Login Access'
            },
            {
                path: 'manage-users/user-profile',
                component: UserProfilesComponent,
                title: 'User Profiles'
            },
            {
                path: 'manage-users/designations',
                component: DesignationComponent,
                title: 'Designations'
            },
            {
                path: 'department',
                component: DepartmentComponent,
                title: 'Department'
            },
            {
                path: 'manage-roles',
                component: ManageRolesComponent,
                title: 'Manage Roles'
            },
            {
                path: 'profile',
                component: ProfileComponent,
                title: 'Profile'
            },
            {
                path: 'department/sub-department',
                component: SubDepartmentComponent,
                title: 'Sub Department'
            },
            {
                path: 'settings',
                component: SettingsComponent,
                title: 'Settings'
            },
            {
                path: 'company',
                component: CompanyComponent,
                title: 'Company'
            },
            {
                path: 'reports',
                component: ReportsComponent,
                title: 'Reports'
            },
            {
                path: 'reports/asset-reports',
                component: AssetReportComponent,
                title: 'Asset Reports'
            },
            {
                path: 'reports/asset-transfer-reports',
                component: AssetTransferReportComponent,
                title: 'Asset Transfer Reports'
            }
        ]
    },
    {
        path: 'admin',
        loadChildren: () =>
            import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
    },

];
