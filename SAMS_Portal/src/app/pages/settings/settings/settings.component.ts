import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { DevelopingProcessPageComponent } from '../../../shared/widgets/common/developing-process-page/developing-process-page.component';

@Component({
  selector: 'app-settings',
  imports: [
    PageHeaderComponent,
    DevelopingProcessPageComponent
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {

}
