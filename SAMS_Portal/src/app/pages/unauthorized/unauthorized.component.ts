import { Component, inject } from '@angular/core';
import { PermissionService } from '../../core/services/permission/permission.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../shared/widgets/page-header/page-header.component';

@Component({
  selector: 'app-unauthorized',
    standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PageHeaderComponent],
  templateUrl: './unauthorized.component.html',
  styleUrl: './unauthorized.component.scss'
})
export class UnauthorizedComponent {
  private router = inject(Router);                       // ← Angular Router
  private permissionService = inject(PermissionService);
 
  readonly userRoles = this.permissionService.userRoles; // signal — auto-updates
 
  goBack(): void {
    window.history.back();
  }
 
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
