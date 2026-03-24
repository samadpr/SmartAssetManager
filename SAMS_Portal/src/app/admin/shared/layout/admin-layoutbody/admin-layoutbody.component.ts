import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { filter } from 'rxjs/operators';
import { LayoutService } from '../../../../core/services/layout/layout.service';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-admin-layoutbody',
  standalone: true,
  imports: [
    AdminHeaderComponent,
    AdminSidebarComponent,
    RouterOutlet,
    MatSidenavModule,
  ],
  templateUrl: './admin-layoutbody.component.html',
  styleUrl: './admin-layoutbody.component.scss'
})
export class AdminLayoutbodyComponent {
  constructor(public layoutService: LayoutService, router: Router) {
    router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.layoutService.closeOverlay();
      });
  }
}
