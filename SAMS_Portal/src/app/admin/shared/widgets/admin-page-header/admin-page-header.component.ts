import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';

export interface Breadcrumb {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-admin-page-header',
  imports: [
    MatIconModule,
    MatToolbarModule,
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './admin-page-header.component.html',
  styleUrl: './admin-page-header.component.scss'
})
export class AdminPageHeaderComponent {
  @Input() title: string = '';
  @Input() breadcrumbs: Breadcrumb[] = [];
}
