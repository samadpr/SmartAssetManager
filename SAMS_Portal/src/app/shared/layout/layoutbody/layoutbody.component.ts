import { Component, computed, signal } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { SidebarComponent } from "../sidebar/sidebar.component";
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { LayoutService } from '../../../core/services/layout/layout.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layoutbody',
  imports: [HeaderComponent, SidebarComponent, RouterOutlet, MatSidenavModule],
  templateUrl: './layoutbody.component.html',
  styleUrl: './layoutbody.component.scss'
})
export class LayoutbodyComponent {
  constructor(public layoutService: LayoutService, router: Router) {
    router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.layoutService.closeOverlay();
      });
  }
}
