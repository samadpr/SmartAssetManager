import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export interface AppTheme {
  name: string;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  appTheme = signal<'light' | 'dark' | 'system'>('system');

  modeTheme: AppTheme[] = [
    {
      name: 'Light',
      icon: 'light_mode'
    },
    {
      name: 'Dark',
      icon: 'dark_mode'
    },
    {
      name: 'System',
      icon: 'desktop_windows'
    }
  ]

    constructor() {
    if (this.isBrowser) {
      const savedTheme = localStorage.getItem('user-theme') as 'light' | 'dark' | 'system';
      if (savedTheme) {
        this.appTheme.set(savedTheme);
      }
    }
  }

  selectedTheme = computed(() => {
    return this.modeTheme.find((theme) => theme.name.toLowerCase() === this.appTheme());
  })

  getAppTheme() {
    return this.modeTheme;
    
  }

  setTheme(name: 'light' | 'dark' | 'system') {
    this.appTheme.set(name);
    if (this.isBrowser) {
      localStorage.setItem('user-theme', name);
    }
  }


  setSystemTheme = effect(() => {
    if (this.isBrowser) {
      const appTheme = this.appTheme();
      const colorScheme = appTheme === 'system' ? 'light dark' : appTheme;
      document.body.style.colorScheme = colorScheme;

      // // Optionally, toggle CSS classes
      // document.body.classList.remove('theme-light', 'theme-dark');
      // document.body.classList.add(`theme-${appTheme}`);
    }
  })
}
