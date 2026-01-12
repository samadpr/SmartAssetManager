import { CommonModule } from '@angular/common';
import { Component, computed, Input, OnInit, signal } from '@angular/core';
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

export type MenuItem = {
  icon: string;
  label: string;
  route: string;
  subItems?: MenuItem[];
}


@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, MatListModule, MatIconModule, MenuItemsComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  FullName: string | null = null;
  CreatedBy: string | null = null;
  Email: string | null = null;
  profilePic: string = '';
  userProfileData = signal<UserProfileData | null>(null);

  constructor(
    private auth: AuthService,
    private router: Router,
    private toster: ToastrService,
    private profileService: ProfileService,
    private globalService: GlobalService
  ) { }
  ngOnInit(): void {
    // const userProfile = this.userProfileStorage.get();
    // if (userProfile) {
    //   this.FullName = userProfile.fullName;
    //   this.CreatedBy = userProfile.createdBy;
    //   this.Email = userProfile.email;
    // }

    this.getUserProfile();
    this.profilePictureUrl();
  }

  profilePictureUrl = computed(() => {
    const profile = this.userProfileData();
    return profile?.profilePicture || '/assets/images/ProfilePic.png';
  })

  getUserProfile() {
    this.profileService.getProfileData().subscribe({
      next: (profile) => {
        this.userProfileData.set(profile);
        this.FullName = profile.firstName + ' ' + profile.lastName;
        this.CreatedBy = profile.createdBy;
        this.Email = profile.email;
        // this.profilePic = profile.profilePicture;
      },
      error: (err) => {
        console.error('Error fetching user profile:', err);
        this.globalService.showToastr('Failed to load user profile', 'error');
      }
    });
  }

  openedItem: string | null = null;

  onMenuClicked(label: string | null) {
    this.openedItem = label;
  }

  sideNavCollapsed = signal(false);
  @Input() set collapsed(value: boolean) {
    this.sideNavCollapsed.set(value);
  }

  menuItems = signal<MenuItem[]>([
    {
      icon: 'dashboard',
      label: 'Dashboard',
      route: '/dashboard'
    },
    {
      icon: 'inventory_2',
      label: 'Assets',
      route: '/assets',
      subItems: [
        {
          icon: 'local_shipping',
          label: 'Suppliers',
          route: 'suppliers'
        },
        {
          icon: 'rule',
          label: 'Asset Approve',
          route: 'asset-approve'
        }
      ]
    },
    {
      icon: 'category',
      label: 'Asset Category',
      route: '/asset-category',
      subItems: [
        {
          icon: 'subdirectory_arrow_right',
          label: 'Asset Sub Category',
          route: 'asset-sub-category'
        }
      ]
    },
    {
      icon: 'location_city',
      label: 'Sites/Branchs',
      route: '/sites-branchs',
      subItems: [
        {
          icon: 'edit_location_alt',
          label: 'Cities',
          route: 'cities'
        },
        {
          icon: 'map',
          label: 'Areas',
          route: 'areas',
        },
      ]
    },
    {
      icon: 'group',
      label: 'Manage Users',
      route: '/manage-users',
      subItems: [
        {
          icon: 'lock_open',
          label: 'Login Access',
          route: 'login-access'
        },
        {
          icon: 'assignment_ind',
          label: 'User Profiles',
          route: 'user-profile'
        },
        {
          icon: 'cases',
          label: 'Designations',
          route: 'designations'
        },
      ]
    },
    {
      icon: 'account_tree',
      label: 'Departments',
      route: '/department',
      subItems: [
        {
          icon: 'subdirectory_arrow_right',
          label: 'Sub Departments',
          route: 'sub-department'
        },
      ]
    },
    // {
    //   icon: 'group',
    //   label: 'Manage Users',
    //   route: '/manage-users',
    //   subItems: [
    //     {
    //       icon: 'assignment_ind',
    //       label: 'User Profiles',
    //       route: 'user-profile'
    //     },
    //     {
    //       icon: 'work',
    //       label: 'Designations',
    //       route: 'designations'
    //     },
    //   ]
    // },
    {
      icon: 'admin_panel_settings',
      label: 'Manage Roles',
      route: '/manage-roles'
    },
    // {
    //   icon: 'account_circle',
    //   label: 'Profile',
    //   route: '/profile'
    // },
    {
      icon: 'assignment',
      label: 'Reports',
      route: '/reports'
    },
    // {
    //   icon: 'settings',
    //   label: 'Settings',
    //   route: '/settings'
    // }
  ])

  profilePicSize = computed(() => this.sideNavCollapsed() ? '32' : '100');

  logout() {
    this.auth.logout(); // clear token/localStorage/session
    this.router.navigate(['/login']);
  }
}
