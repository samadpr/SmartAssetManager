import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { LayoutService } from '../../../../core/services/layout/layout.service';
import { ThemeService } from '../../../../core/services/theme/theme.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { GlobalService } from '../../../../core/services/global/global.service';


@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TitleCasePipe,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatBadgeModule,
  ],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.scss'
})
export class AdminHeaderComponent implements OnInit {
  protected themeService = inject(ThemeService);
  public layoutService = inject(LayoutService);
  private authService = inject(AuthService);
  private globalService = inject(GlobalService);
  private router = inject(Router);

  adminName = signal<string>('Super Admin');
  adminEmail = signal<string>('');
  notificationCount = signal<number>(0); // Wire to a notifications service if needed

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.adminName.set(user.name || user.email?.split('@')[0] || 'Super Admin');
      this.adminEmail.set(user.email || '');
    }
  }

  toggleSidebar(): void {
    this.layoutService.toggleCollapse();
  }

  setThemeFromName(name: string): void {
    const lower = name.toLowerCase() as 'light' | 'dark' | 'system';
    this.themeService.setTheme(lower);
  }

  logout(): void {
    this.authService.adminLogout();
    this.globalService.showToastr('Logged out successfully', 'success');
  }
}
