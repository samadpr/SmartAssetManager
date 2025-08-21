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

  constructor(private auth: AuthService, private router: Router, private userProfileStorage: UserProfileStorageService, private accountService: AccountService, private toster: ToastrService) { }
  ngOnInit(): void {
    // const userProfile = this.userProfileStorage.get();
    // if (userProfile) {
    //   this.FullName = userProfile.fullName;
    //   this.CreatedBy = userProfile.createdBy;
    //   this.Email = userProfile.email;
    // }

    this.getUserProfile();
  }

  getUserProfile(){
    this.accountService.getProfileDetails().subscribe({
      next: (profile) => {
        this.FullName = profile.firstName + ' ' + profile.lastName;
        this.CreatedBy = profile.createdBy;
        this.Email = profile.email;
        this.profilePic = profile.profilePicture || 'assets/images/ProfilePic.png'; 
      },
      error: (err) => {
        console.error('Error fetching user profile:', err);
        this.toster.error('Failed to load user profile', 'Error');
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
      route: '/manage-assets',
    },
    {
      icon: 'group',
      label: 'Manage Users',
      route: '/manage-users',
      subItems: [
        {
          icon: 'assignment_ind',
          label: 'User Profiles',
          route: 'user-profile'
        },
        {
          icon: 'work',
          label: 'Designations',
          route: 'designations'
        },
      ]
    },
    {
      icon: 'account_circle',
      label: 'Profile',
      route: '/profile'
    },
    // {
    //   icon: 'assignment',
    //   label: 'Reports',
    //   route: '/reports'
    // },
    {
      icon: 'settings',
      label: 'Settings',
      route: '/settings'
    }
  ])

  profilePicSize = computed(() => this.sideNavCollapsed() ? '32' : '100');

  logout() {
    this.auth.logout(); // clear token/localStorage/session
    this.router.navigate(['/login']);
  }
}
