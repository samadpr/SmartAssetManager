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
import { authGuard } from './core/guards/auth.guard';
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

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'register',
        component: RegisterComponent
    },
    {
        path: 'confirmotp',
        component: ConfirmotpComponent
    },
    {
        path: 'company-onboarding',
        component: CompanyOnboardingComponent,
        canActivate: [authGuard]
    },
    {
        path: 'user-email-verification',
        component: UserEmailVerificationComponent
    },
    {
        path: 'user-password-setup',
        component: UserPasswordSetupComponent
    },
    {
        path: '',
        canActivate: [authGuard],
        component: LayoutbodyComponent,
        children: [
            {
                path: 'dashboard',
                component: DashboardComponent
            },
            {
                path: 'assets',
                component: ManageAssetsComponent
            },
            {
                path: 'assets/suppliers',
                component: SupplierComponent
            },
            {
                path: 'asset-category',
                component: AssetCategoryComponent
            },
            {
                path: 'asset-category/asset-sub-category',
                component: AssetSubCategoryComponent
            },
            {
                path: 'sites-branchs',
                component: SitesOrBranchsComponent
            },
            {
                path: 'sites-branchs/cities',
                component: CitiesComponent
            },
            {
                path: 'sites-branchs/areas',
                component: AreasComponent
            },
            {
                path: 'manage-users',
                component: ManageUserComponent,
            },
            {
                path: 'manage-users/login-access',
                component: LoginAccessComponent
            },
            {
                path: 'manage-users/user-profile',
                component: UserProfilesComponent,
            },
            {
                path: 'manage-users/designations',
                component: DesignationComponent,
            },
            {
                path: 'department',
                component: DepartmentComponent
            },
            {
                path: 'manage-roles',
                component: ManageRolesComponent
            },
            {
                path: 'profile',
                component: ProfileComponent
            },
            {
                path: 'department/sub-department',
                component: SubDepartmentComponent
            },
            {
                path: 'settings',
                component: SettingsComponent
            },
            {
                path: 'company',
                component: CompanyComponent
            }
        ]
    }

];
