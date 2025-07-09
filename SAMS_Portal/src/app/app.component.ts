import { Component, inject } from '@angular/core';
import { LayoutbodyComponent } from "./shared/layout/layoutbody/layoutbody.component";
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'SAMS_Portal';
  protected themeService = inject(ThemeService);
}
