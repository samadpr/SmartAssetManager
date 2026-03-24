import { Routes } from "@angular/router";
import { AdminLayoutbodyComponent } from "./shared/layout/admin-layoutbody/admin-layoutbody.component";
import { AdminDashboardComponent } from "./admin-dashboard/admin-dashboard.component";
import { authGuard, portalGuard } from "../core/guards/auth.guard";
import { AdminLoginComponent } from "./admin-login/admin-login.component";
import { CompaniesListComponent } from "./companies/companies-list/companies-list.component";
import { CompanyDetailComponent } from "./companies/company-detail/company-detail.component";

export const ADMIN_ROUTES: Routes = [
    {
        path: 'login',
        component: AdminLoginComponent,
        title: 'Admin Login'
    },
    {
        path: '',
        canActivate: [authGuard, portalGuard],
        data: { portal: 'admin' },
        component: AdminLayoutbodyComponent,
        children: [
            {
                path: 'dashboard',
                component: AdminDashboardComponent,
                title: 'Admin Dashboard'
            },
            {
                path: 'companies-list',
                component: CompaniesListComponent,
                title: 'Companies List'
            },
            {
                path: 'companies/:id',
                component: CompanyDetailComponent,
                title: 'Company Detail'
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    }
]