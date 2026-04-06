import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
 
@Component({
  selector: 'app-developing-process-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './developing-process-page.component.html',
  styleUrl: './developing-process-page.component.scss'
})
export class DevelopingProcessPageComponent {
  steps = [
    { icon: 'design_services', label: 'Design' },
    { icon: 'code', label: 'Develop' },
    { icon: 'bug_report', label: 'Test' },
    { icon: 'rocket_launch', label: 'Deploy' },
  ];
}
