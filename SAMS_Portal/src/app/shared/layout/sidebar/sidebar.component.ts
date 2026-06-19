import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list'
import { MatIconModule } from '@angular/material/icon';
import { MenuItemsComponent } from "../menu-items/menu-items.component";
import { AuthService } from '../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { UserProfileStorageService } from '../../../core/services/localStorage/userProfile/user-profile-storage.service';
import { AccountService } from '../../../core/services/account/account.service';
import { ToastrService } from 'ngx-toastr';
import { ProfileService } from '../../../core/services/account/profile/profile.service';
import { UserProfileData } from '../../../core/models/interfaces/account/userProfile';
import { GlobalService } from '../../../core/services/global/global.service';
import { FileUrlHelper } from '../../../core/helper/get-file-url';
import { ManageRolesService } from '../../../core/services/roles-manager/manage-roles.service';
import { PermissionService } from '../../../core/services/permission/permission.service';
import { Permissions } from '../../../core/models/rbac/permissions.constants';

export type MenuItem = {
  icon: string;
  label: string;
  route: string;
  requiredPermission?: string;   // ← NEW: permission needed to SEE this item
  subItems?: MenuItem[];
};


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MenuItemsComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toster = inject(ToastrService);
  private profileService = inject(ProfileService);
  private globalService = inject(GlobalService);
  private manageRoleService = inject(ManageRolesService);
  readonly permissionService = inject(PermissionService);   // ← inject PermissionService

  FullName: string | null = null;
  RoleName: string | null = null;
  Email: string | null = null;
  userProfileData = signal<UserProfileData | null>(null);

  ngOnInit(): void {
    this.getUserProfile();
  }

  profilePictureUrl = computed(() => {
    const profile = this.userProfileData();
    return FileUrlHelper.getFullUrl(profile?.profilePicture) || '/assets/images/ProfilePic.png';
  });

  getUserProfile() {
    this.profileService.getProfileData().subscribe({
      next: (profile) => {
        this.userProfileData.set(profile);
        this.FullName = profile.firstName + ' ' + profile.lastName;
        if (profile.createdBy !== 'Admin') {
          this.RoleName = profile.email;
          this.getRoleNameById(profile.roleId);
        } else {
          this.RoleName = profile.createdBy;
        }
        this.Email = profile.email;
      },
      error: (err) => {
        console.error('Error fetching user profile:', err);
        this.globalService.showToastr('Failed to load user profile', 'error');
      }
    });
  }

  private getRoleNameById(roleId: number): void {
    this.manageRoleService.getUserRoleById(roleId).subscribe({
      next: (res) => { this.RoleName = res.data?.name; },
      error: () => { }
    });
  }

  openedItem: string | null = null;
  onMenuClicked(label: string | null) { this.openedItem = label; }

  sideNavCollapsed = signal(false);
  @Input() set collapsed(value: boolean) { this.sideNavCollapsed.set(value); }

  profilePicSize = computed(() => this.sideNavCollapsed() ? '32' : '100');

  // ─── All possible menu items with their required permissions ─────────────────
  private allMenuItems: MenuItem[] = [
    {
      icon: 'dashboard',
      label: 'Dashboard',
      route: '/dashboard',
      requiredPermission: Permissions.DASHBOARD
    },
    {
      icon: 'inventory_2',
      label: 'Assets',
      route: '/asset-management',
      requiredPermission: Permissions.ASSET,
      subItems: [
        {
          icon: 'local_shipping',
          label: 'Suppliers',
          route: 'suppliers',
          requiredPermission: Permissions.SUPPLIER
        },
        {
          icon: 'rule',
          label: 'Asset Approve',
          route: 'asset-approve',
          requiredPermission: Permissions.ASSET_APPROVAL
        },
        {
          icon: 'report_problem',
          label: 'Asset Issues',
          route: 'asset-issue',
          requiredPermission: Permissions.ASSET_ISSUE
        },
        {
          icon: 'qr_code_scanner',
          label: 'Asset Qr & Barcode',
          route: 'asset-qr-barcode',
          requiredPermission: Permissions.PRINT_QRCODE
        },
        {
          icon: 'multiple_stop',
          label: 'Bulk Transfer',
          route: 'bulk-transfer',
          requiredPermission: Permissions.ASSET
        }
      ]
    },
    {
      icon: 'category',
      label: 'Asset Category',
      route: '/asset-category',
      requiredPermission: Permissions.ASSET_CATEGORIE,
      subItems: [
        {
          icon: 'subdirectory_arrow_right',
          label: 'Asset Sub Category',
          route: 'asset-sub-category',
          requiredPermission: Permissions.ASSET_SUB_CATEGORIE
        }
      ]
    },
    {
      icon: 'location_city',
      label: 'Sites/Branches',
      route: '/sites-branchs',
      requiredPermission: Permissions.ASSET_SITE,
      subItems: [
        {
          icon: 'edit_location_alt',
          label: 'Cities',
          route: 'cities',
          requiredPermission: Permissions.ASSET_SITE
        },
        {
          icon: 'map',
          label: 'Areas',
          route: 'areas',
          requiredPermission: Permissions.ASSET_LOCATION
        },
      ]
    },
    {
      icon: 'group',
      label: 'Manage Users',
      route: '/manage-users',
      requiredPermission: Permissions.USER_MANAGEMENT,
      subItems: [
        {
          icon: 'lock_open',
          label: 'Login Access',
          route: 'login-access',
          requiredPermission: Permissions.USER_MANAGEMENT
        },
        {
          icon: 'cases',
          label: 'Designations',
          route: 'designations',
          requiredPermission: Permissions.DESIGNATION
        },
      ]
    },
    {
      icon: 'account_tree',
      label: 'Departments',
      route: '/department',
      requiredPermission: Permissions.DEPARTMENT,
      subItems: [
        {
          icon: 'subdirectory_arrow_right',
          label: 'Sub Departments',
          route: 'sub-department',
          requiredPermission: Permissions.SUB_DEPARTMENT
        },
      ]
    },
    {
      icon: 'admin_panel_settings',
      label: 'Manage Roles',
      route: '/manage-roles',
      requiredPermission: Permissions.MANAGE_USER_ROLES
    },
    {
      icon: 'assignment',
      label: 'Reports',
      route: '/reports',
      requiredPermission: Permissions.ASSET_INFO_REPORT,
      subItems: [
        {
          icon: 'assessment',
          label: 'Asset Reports',
          route: 'asset-reports',
          requiredPermission: Permissions.ASSET_INFO_REPORT
        },
        {
          icon: 'receipt_long',
          label: 'Transfer Reports',
          route: 'asset-transfer-reports',
          requiredPermission: Permissions.ASSET_TRANSFER_REPORT
        }
      ]
    },
  ];

  /**
   * Filtered menu — reactively computed from permission signal.
   * Automatically re-runs when PermissionService._userContext changes.
   */
  menuItems = computed<MenuItem[]>(() => this.filterMenuItems(this.allMenuItems));
 
  private filterMenuItems(items: MenuItem[]): MenuItem[] {
    return items
      .filter(item => !item.requiredPermission || this.permissionService.can(item.requiredPermission))
      .map(item => ({
        ...item,
        subItems: item.subItems ? this.filterMenuItems(item.subItems) : undefined,
      }));
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
