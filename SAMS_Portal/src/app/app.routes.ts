import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ManageAssetsComponent } from './pages/assets/manage-assets/manage-assets.component';
import { ManageUserComponent } from './pages/users/manage-user/manage-user.component';
import { UserProfilesComponent } from './pages/users/user-profiles/user-profiles.component';
import { DesignationComponent } from './pages/employees/designation/designation.component';
import { ProfileComponent } from './pages/account/profile/profile.component';
import { SettingsComponent } from './pages/settings/settings/settings.component';
import { LoginComponent } from './pages/account/login/login.component';
import { RegisterComponent } from './pages/account/register/register.component';
import { LayoutbodyComponent } from './shared/layout/layoutbody/layoutbody.component';
import { ConfirmotpComponent } from './pages/account/confirmotp/confirmotp.component';
import { authGuard } from './core/guards/auth.guard';
import { EmployeesComponent } from './pages/employees/employees/employees.component';
import { ManageRolesComponent } from './pages/roles/manage-roles/manage-roles.component';

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
        path: '',
        canActivate: [authGuard],
        component: LayoutbodyComponent,
        children: [
            {
                path: 'dashboard',
                component: DashboardComponent
            },
            {
                path: 'manage-assets',
                component: ManageAssetsComponent
            },
            {
                path: 'manage-users',
                component: ManageUserComponent,
            },
            {
                path: 'manage-users/user-profile',
                component: UserProfilesComponent,
            },
            {
                path: 'profile',
                component: ProfileComponent
            },
            {
                path: 'employees',
                component: EmployeesComponent
            },
            {
                path: 'manage-roles',
                component: ManageRolesComponent
            },
            {
                path: 'employees/designations',
                component: DesignationComponent,
            },
            {
                path: 'settings',
                component: SettingsComponent
            }
        ]
    }

];
