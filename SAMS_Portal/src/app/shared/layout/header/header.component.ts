import { Component, computed, inject, Input, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LayoutService } from '../../../core/services/layout/layout.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeService } from '../../../core/services/theme/theme.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  protected themeService = inject(ThemeService);

  sideNavCollapsed = signal(false);
  @Input() set collapsed(value: boolean) {
    this.sideNavCollapsed.set(value);
  }

  constructor(
    public layoutService: LayoutService
  ) { }

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

  logoSize = computed(() => this.sideNavCollapsed() ? '32' : '200');

}
