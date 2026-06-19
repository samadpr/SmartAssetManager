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
import { authGuard, portalGuard } from './core/guards/auth/auth.guard';
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
import { roleGuard } from './core/guards/role/role.guard';
import { SelectPlanComponent } from './pages/account/select-plan/select-plan.component';
import { activationGuard } from './core/guards/subscription/subscription.guard';
import { PendingActivationComponent } from './pages/account/pending-activation/pending-activation.component';
import { SiteAssetOverviewComponent } from './pages/sites-or-branchs/site-asset-overview/site-asset-overview.component';
import { AssetBulkUploadComponent } from './pages/assets/manage-assets/asset-bulk-upload/asset-bulk-upload.component';
import { AssetBulkTransferComponent } from './pages/assets/asset-bulk-transfer/asset-bulk-transfer.component';
import { AssetTransferReportComponent } from './pages/reports/asset-transfer-report/asset-transfer-report.component';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized.component';
import { permissionGuard, } from './core/guards/permission/permission.guard';
import { Permissions } from './core/models/rbac/permissions.constants';
import { AiChatComponent } from './pages/ai-chat/ai-chat.component';
import { ForgotPasswordComponent } from './pages/account/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/account/reset-password/reset-password.component';
import { AssetBatchDetailComponent } from './pages/assets/manage-assets/asset-batch-detail/asset-batch-detail.component';
import { AiChatPageComponent } from './pages/ai-chat/ai-chat-page/ai-chat-page.component';

export const routes: Routes = [
    // {
    //     path: '',
    //     pathMatch: 'full',
    //     redirectTo: 'dashboard'
    // },
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
        path: 'unauthorized',
        component: UnauthorizedComponent,
        title: 'Access Denied'
    },
    {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
        title: 'Forgot Password'
    },
    {
        path: 'reset-password',
        component: ResetPasswordComponent,
        title: 'Reset Password'
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
        path: '',
        canActivate: [authGuard, portalGuard, activationGuard],
        data: { portal: 'tenant' },
        component: LayoutbodyComponent,
        children: [
            // Default redirect
            {
                path: 'ai-chat',
                component: AiChatPageComponent,   // ← use AiChatPageComponent (full page)
                canActivate: [permissionGuard],
                title: 'SAMS AI'
            },
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'dashboard'
            },
            {
                path: 'dashboard',
                component: DashboardComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.DASHBOARD },
                title: 'Dashboard'
            },
            // ── Assets ────────────────────────────────────────────────────────────────
            {
                path: 'asset-management',
                component: ManageAssetsComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.ASSET },
                title: 'Manage Assets'
            },
            {
                path: 'asset-management/batch/:hash',
                component: AssetBatchDetailComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.ASSET },
                title: 'Asset Batch Detail'
            },
            {
                path: 'asset-management/site-branch-assets-overview',
                component: SiteAssetOverviewComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.ASSET_SITE },
                title: 'Site & Branch Assets Overview'
            },
            {
                path: 'asset-management/bulk-upload',
                component: AssetBulkUploadComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.ASSET },
                title: 'Bulk Asset Upload'
            },
            {
                path: 'asset-management/suppliers',
                component: SupplierComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.SUPPLIER },
                title: 'Suppliers'
            },
            {
                path: 'asset-management/asset-approve',
                component: AssetApproveComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.ASSET_APPROVAL },
                title: 'Asset Approve'
            },
            {
                path: 'asset-management/asset-issue',
                component: AssetsIssueComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.ASSET_ISSUE },
                title: 'Asset Issue'
            },
            {
                path: 'asset-management/asset-qr-barcode',
                component: AssetQrBarcodeComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.PRINT_QRCODE },
                title: 'Asset QR & Barcode'
            },
            {
                path: 'asset-management/bulk-transfer',
                component: AssetBulkTransferComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.ASSET },
                title: 'Asset Bulk Transfer'
            },

            // ── Asset Category ────────────────────────────────────────────────────────
            {
                path: 'asset-category',
                component: AssetCategoryComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.ASSET_CATEGORIE },
                title: 'Asset Category'
            },
            {
                path: 'asset-category/asset-sub-category',
                component: AssetSubCategoryComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.ASSET_SUB_CATEGORIE },
                title: 'Asset Sub Category'
            },

            // ── Sites & Branches ──────────────────────────────────────────────────────
            {
                path: 'sites-branchs',
                component: SitesOrBranchsComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.ASSET_SITE },
                title: 'Sites & Branches'
            },
            {
                path: 'sites-branchs/cities',
                component: CitiesComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.ASSET_SITE },
                title: 'Cities'
            },
            {
                path: 'sites-branchs/areas',
                component: AreasComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.ASSET_LOCATION },
                title: 'Areas'
            },

            // ── Users ─────────────────────────────────────────────────────────────────
            {
                path: 'manage-users',
                component: ManageUserComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.USER_MANAGEMENT },
                title: 'Manage Users'
            },
            {
                path: 'manage-users/login-access',
                component: LoginAccessComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.USER_MANAGEMENT },
                title: 'Login Access'
            },
            {
                path: 'manage-users/user-profile',
                component: UserProfilesComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.USER_MANAGEMENT },
                title: 'User Profiles'
            },
            {
                path: 'manage-users/designations',
                component: DesignationComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.DESIGNATION },
                title: 'Designations'
            },

            // ── Departments ──────────────────────────────────────────────────────────
            {
                path: 'department',
                component: DepartmentComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.DEPARTMENT },
                title: 'Department'
            },
            {
                path: 'department/sub-department',
                component: SubDepartmentComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.SUB_DEPARTMENT },
                title: 'Sub Department'
            },

            // ── Roles ─────────────────────────────────────────────────────────────────
            {
                path: 'manage-roles',
                component: ManageRolesComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.MANAGE_USER_ROLES },
                title: 'Manage Roles'
            },

            // ── Profile & Company ────────────────────────────────────────────────────
            {
                path: 'profile',
                component: ProfileComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.USER_PROFILE },
                title: 'Profile'
            },
            {
                path: 'settings',
                component: SettingsComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.EMAIL_SETTING },
                title: 'Settings'
            },
            {
                path: 'company',
                component: CompanyComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.COMPANY_INFO },
                title: 'Company'
            },

            // ── Reports ───────────────────────────────────────────────────────────────
            {
                path: 'reports',
                component: ReportsComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.ASSET_INFO_REPORT },
                title: 'Reports'
            },
            {
                path: 'reports/asset-reports',
                component: AssetReportComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.ASSET_INFO_REPORT },
                title: 'Asset Reports'
            },
            {
                path: 'reports/asset-transfer-reports',
                component: AssetTransferReportComponent,
                canActivate: [permissionGuard],
                data: { permission: Permissions.ASSET_TRANSFER_REPORT },
                title: 'Asset Transfer Reports'
            },
            // ── AI Chat ──────────────────────────────────────────────────────────────
            {
                path: 'ai-chat',
                component: AiChatComponent,
                canActivate: [permissionGuard],
                // data: { permission: Permissions.AI_CHAT },
                title: 'AI Chat'
            }
        ]
    },
    {
        path: 'admin',
        loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
    },

    // ── Fallback ──────────────────────────────────────────────────────────────────
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
