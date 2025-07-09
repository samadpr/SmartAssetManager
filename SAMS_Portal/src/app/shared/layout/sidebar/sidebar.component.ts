import { CommonModule } from '@angular/common';
import { Component, computed, Input, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list'
import { MatIconModule } from '@angular/material/icon';
import { MenuItemsComponent } from "../menu-items/menu-items.component";

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
export class SidebarComponent {

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

  profilePicSize = computed(()=> this.sideNavCollapsed() ? '32' : '100');
}
