import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';

@Component({
  selector: 'app-manage-user',
  imports: [
    RouterOutlet,
    PageHeaderComponent
  ],
  templateUrl: './manage-user.component.html',
  styleUrl: './manage-user.component.scss'
})
export class ManageUserComponent {

}
