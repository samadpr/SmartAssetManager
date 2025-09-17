import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { ListWidgetComponent } from '../../../shared/widgets/common/list-widget/list-widget.component';

@Component({
  selector: 'app-employees',
  imports: [
    PageHeaderComponent,
    CommonModule
  ],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent {

}
