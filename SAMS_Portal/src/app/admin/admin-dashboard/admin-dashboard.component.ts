import { Component } from '@angular/core';
import { AdminPageHeaderComponent } from '../shared/widgets/admin-page-header/admin-page-header.component';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    AdminPageHeaderComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {

}
