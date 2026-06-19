import { Routes } from "@angular/router";
import { AdminLayoutbodyComponent } from "./shared/layout/admin-layoutbody/admin-layoutbody.component";
import { AdminDashboardComponent } from "./pages/admin-dashboard/admin-dashboard.component";
import { authGuard, portalGuard } from "../core/guards/auth/auth.guard";
import { AdminLoginComponent } from "./pages/admin-login/admin-login.component";
import { CompaniesListComponent } from "./pages/companies/companies-list/companies-list.component";
import { CompanyDetailComponent } from "./pages/companies/company-detail/company-detail.component";

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