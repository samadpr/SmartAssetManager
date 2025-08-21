import { Component, EventEmitter, Input, input, Output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { MenuItem } from '../sidebar/sidebar.component';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-menu-items',
  standalone: true,
  animations: [
    trigger('expandContractMenu', [
      transition(':enter', [
        style({ opacity: 0, height: '0px' }),
        animate('500ms ease-in-out', style({ opacity: 1, height: '*' }))
      ]),
      transition(':leave', [
        animate('500ms ease-in-out', style({ opacity: 0, height: '0px' }))
      ])
    ])
  ],
  imports: [MatListModule, RouterModule, MatIconModule],
  templateUrl: './menu-items.component.html',
  styleUrl: './menu-items.component.scss'
})
export class MenuItemsComponent {
  @Input() openedItemLabel: string | null = null;

  @Output() menuClicked = new EventEmitter<string | null>();
  
  item = input.required<MenuItem>();

  collapsed = input(false);

  // nestedMenuOpen = signal(false);

  toggleNestedMenu() {
    if (!this.item().subItems) {
      this.menuClicked.emit(null); // Close any open submenu
      return;
    }

    const isOpen = this.isSubMenuOpen();
    this.menuClicked.emit(isOpen ? null : this.item().label);
  }

  isSubMenuOpen(): boolean {
    return this.openedItemLabel === this.item().label;
  }

}
