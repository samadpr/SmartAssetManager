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

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
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
        path: '',
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
                children: [
                    {
                        path: 'user-profile',
                        component: UserProfilesComponent,
                    },
                    {
                        path: 'designations',
                        component: DesignationComponent,
                    },
                ]
            },
            {
                path: 'profile',
                component: ProfileComponent
            },
            {
                path: 'settings',
                component: SettingsComponent
            }
        ]
    }

];
