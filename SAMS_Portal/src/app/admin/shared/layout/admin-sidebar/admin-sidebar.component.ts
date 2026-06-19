import { Component, computed, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { GlobalService } from '../../../../core/services/global/global.service';
import { MenuItemsComponent } from '../../../../shared/layout/menu-items/menu-items.component';
import { MenuItem } from '../../../../shared/layout/sidebar/sidebar.component';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MenuItemsComponent],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss'
})
export class AdminSidebarComponent implements OnInit {
  adminName: string = 'Super Admin';

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private globalService: GlobalService
  ) {}

  ngOnInit(): void {
    const user = this.auth.getUser();
    if (user) {
      this.adminName = user['name'] || user['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']?.split('@')[0] || 'Super Admin';

      console.log('User Name:', this.adminName);
    }
  }

  sideNavCollapsed = signal(false);

  @Input() set collapsed(value: boolean) {
    this.sideNavCollapsed.set(value);
  }

  openedItem: string | null = null;

  onMenuClicked(label: string | null) {
    this.openedItem = label;
  }

  menuItems = signal<MenuItem[]>([
    {
      icon: 'dashboard',
      label: 'Dashboard',
      route: '/admin/dashboard',
    },
    {
      icon: 'corporate_fare',
      label: 'Companies',
      route: '/admin/companies-list',
      // subItems: [
      //   { icon: 'add_business', label: 'All Companies', route: 'all' },
      //   { icon: 'pending_actions', label: 'Pending Approvals', route: 'pending' },
      // ]
    },
    // {
    //   icon: 'people_alt',
    //   label: 'Users',
    //   route: '/admin/users',
    //   subItems: [
    //     { icon: 'person_search', label: 'All Users', route: 'all' },
    //     { icon: 'admin_panel_settings', label: 'Admin Users', route: 'admins' },
    //   ]
    // },
    // {
    //   icon: 'verified_user',
    //   label: 'Roles & Permissions',
    //   route: '/admin/roles',
    // },
    // {
    //   icon: 'subscriptions',
    //   label: 'Subscriptions',
    //   route: '/admin/subscriptions',
    //   subItems: [
    //     { icon: 'receipt_long', label: 'Billing', route: 'billing' },
    //   ]
    // },
    // {
    //   icon: 'inventory_2',
    //   label: 'Asset Management',
    //   route: '/admin/assets',
    //   subItems: [
    //     { icon: 'category', label: 'Categories', route: 'categories' },
    //     { icon: 'local_shipping', label: 'Suppliers', route: 'suppliers' },
    //   ]
    // },
    // {
    //   icon: 'bar_chart',
    //   label: 'Reports',
    //   route: '/admin/reports',
    //   subItems: [
    //     { icon: 'summarize', label: 'System Reports', route: 'system' },
    //     { icon: 'assessment', label: 'Usage Analytics', route: 'analytics' },
    //   ]
    // },
    // {
    //   icon: 'notifications_active',
    //   label: 'Notifications',
    //   route: '/admin/notifications',
    // },
    // {
    //   icon: 'tune',
    //   label: 'System Settings',
    //   route: '/admin/settings',
    // },
  ]);

  profilePicSize = computed(() => this.sideNavCollapsed() ? '40' : '72');

  logout() {
    this.auth.adminLogout();
    this.globalService.showToastr('Logged out successfully', 'success');
  }
}
