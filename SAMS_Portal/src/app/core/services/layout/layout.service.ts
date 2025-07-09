import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private _collapsed = signal(false);

  collapsed = computed(() => this._collapsed());

  sidenavWidth = computed(() => this._collapsed() ? '65px' : '250px');

  toggleCollapse() {
    this._collapsed.update(v => !v);
  }

  setCollapse(value: boolean) {
    this._collapsed.set(value);
  }
}
