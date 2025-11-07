import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LayoutService } from '../../../core/services/layout/layout.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeService } from '../../../core/services/theme/theme.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { CompanyService } from '../../../core/services/company/company.service';
import { AccountService } from '../../../core/services/account/account.service';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    RouterModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  protected themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private companyService = inject(CompanyService);
  private globalService = inject(GlobalService);
  private accountService = inject(AccountService);

  sideNavCollapsed = signal(false);
  companyLogo = signal<string>('assets/images/logos/company_logo.png');
  companyName = signal<string>('Company');
  companyEmail = signal<string>('');

  @Input() set collapsed(value: boolean) {
    this.sideNavCollapsed.set(value);
  }

  constructor(
    public layoutService: LayoutService
  ) { }

   ngOnInit(): void {
    this.loadCompanyData();
  }

  private loadCompanyData(): void {
    this.companyService.getCurrentUserCompany().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.companyName.set(response.data.name || 'Company');
          this.companyEmail.set(response.data.email || '');
          if (response.data.logo) {
            this.companyLogo.set(response.data.logo);
          }
        }
      },
      error: (err) => {
        console.error('Error loading company data:', err);
        // Keep default values on error
      }
    });
  }

  setThemeFromName(name: string) {
    const lowered = name.toLowerCase();
    if (lowered === 'light' || lowered === 'dark' || lowered === 'system') {
      this.themeService.setTheme(lowered);
    } else {
      console.warn('Invalid theme name:', name);
    }
  }

  toggleSidebar() {
    this.layoutService.toggleCollapse();
    // this.layoutService.headerMenuClick();
  }

  navigateToCompany(): void {
    this.router.navigate(['/company']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.authService.logout();
    this.globalService.showToastr('Logged out successfully', 'success');
  }

  logoSize = computed(() => this.sideNavCollapsed() ? '32' : '200');

}
