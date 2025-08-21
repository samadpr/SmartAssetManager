import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private bo = inject(BreakpointObserver);
  // Custom breakpoints (exactly as per your requirement)
  private desktop$ = this.bo.observe('(min-width: 1025px)');
  private tablet$ = this.bo.observe('(min-width: 768px) and (max-width: 1024.98px)');
  private mobile$ = this.bo.observe('(max-width: 767.98px)');

  // Convert to signals (initial guesses are fine; they’ll sync immediately)
  isDesktop = toSignal(this.desktop$, { initialValue: { matches: false, breakpoints: { '(min-width: 1025px)': false } } });
  isTablet = toSignal(this.tablet$, { initialValue: { matches: false, breakpoints: { '(min-width: 768px) and (max-width: 1024.98px)': false } } });
  isMobile = toSignal(this.mobile$, { initialValue: { matches: true, breakpoints: { '(max-width: 767.98px)': true } } });

  // Current screen kind
  screen = computed<'desktop' | 'tablet' | 'mobile'>(() =>
    this.isDesktop().matches ? 'desktop' : this.isTablet().matches ? 'tablet' : 'mobile'
  );

  // Collapsed state for docked sidebar
  private _collapsed = signal(false);
  collapsed = computed(() => this._collapsed());

  // Widths (string with px to match your current template bindings)
  private _expandedWidth = '250px';
  private _collapsedWidth = '65px';
  sidenavWidth = computed(() => (this._collapsed() ? this._collapsedWidth : this._expandedWidth));

  // Sidenav mode & open state
  private _mode = signal<'over' | 'side'>('side');
  private _opened = signal<boolean>(true);

  // Keep your existing method shape so templates don’t break
  mode() { return this._mode(); }
  opened() { return this._opened(); }

  // Derived layout helpers
  private _contentMargin = computed(() => (this._mode() === 'over' ? 'auto' : this.sidenavWidth()));
  contentMargin() { return this._contentMargin(); }

  private _headerSidenavWidth = computed(() => (this._mode() === 'side' ? this.sidenavWidth() : 'auto'));
  headerSidenavWidth() { return this._headerSidenavWidth(); }

  constructor() {
    // Set defaults whenever screen size changes
    effect(() => {
      const s = this.screen();
      if (s === 'desktop') {
        this._mode.set('side');
        this._collapsed.set(false);  // full
        this._opened.set(true);      // docked & visible
      } else if (s === 'tablet') {
        this._mode.set('side');
        this._collapsed.set(true);   // mini dock
        this._opened.set(true);      // docked & visible
      } else { // mobile
        this._mode.set('over');      // overlay
        this._collapsed.set(true);   // irrelevant when overlay, but keep for consistency
        this._opened.set(false);     // hidden by default
      }
    });
  }

  // For your old API compatibility (header still calls this)
  toggleCollapse() {
    // Only meaningful on desktop; on tablet it toggles mini/full in docked mode.
    if (this.screen() === 'desktop') {
      this._collapsed.update(v => !v);
    } else if (this.screen() === 'tablet') {
      // Let’s allow expanding/collapsing docked tablet too if someone clicks it
      this._collapsed.update(v => !v);
    } else if (this.screen() === 'mobile') {
      // Mobile: open overlay full
      if (!this._collapsed()) {
        this.closeOverlay();
      } else {
        this._mode.set('over');
        this._collapsed.set(false);
        this._opened.set(true);
      }

    }
  }

  setCollapse(value: boolean) {
    this._collapsed.set(value);
  }

  // Header menu click should “do the right thing” per breakpoint
  headerMenuClick() {
    const s = this.screen();
    if (s === 'desktop') {
      this.toggleCollapse();
    } else if (s === 'tablet') {
      // Peek full overlay; keep dock mini when closed
      this._mode.set('over');
      this._collapsed.set(false);
      this._opened.set(true);
    } else {
      // Mobile: open overlay full
      this._mode.set('over');
      this._collapsed.set(false);
      this._opened.set(true);
    }
  }

  // Called when overlay backdrop clicked or close anim starts
  closeOverlay() {
    if (this._mode() === 'over') {
      this._opened.set(false);
      const s = this.screen();
      if (s === 'tablet') {
        // Restore mini dock
        this._mode.set('side');
        this._collapsed.set(true);
        this._opened.set(true);
      } else if (s === 'mobile') {
        // Stay hidden
        this._collapsed.set(true);
      }
    }
  }

  onBackdrop() {
    this.closeOverlay();
  }

  afterSidenavClosed() {

    this.closeOverlay();
  }
}
