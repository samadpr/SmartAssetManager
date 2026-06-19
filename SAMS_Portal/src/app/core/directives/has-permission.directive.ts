import {
  Directive,
  Input,
  OnInit,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect,
} from '@angular/core';
import { PermissionService } from '../services/permission/permission.service';
import { Permission } from '../models/rbac/permissions.constants';
 
/**
 * HasPermissionDirective — structural directive
 *
 * Conditionally renders DOM elements based on user permissions.
 * Completely REMOVES the element from the DOM when permission is absent
 * (unlike [disableIfNoPermission] which keeps it visible but disabled).
 *
 * SELECTOR FIX: '[hasPermission]' matches Angular's *hasPermission microsyntax.
 * The microsyntax *hasPermission="X" desugars to [hasPermission]="X", so the
 * selector must be '[hasPermission]' — NOT '[appHasPermission]'.
 *
 * Usage:
 * ```html
 * <!-- Single permission -->
 * <button *hasPermission="Permissions.ASSET">Add Asset</button>
 *
 * <!-- With else template -->
 * <div *hasPermission="Permissions.ASSET; else noAccess">Edit</div>
 * <ng-template #noAccess>View Only</ng-template>
 *
 * <!-- Any of multiple permissions -->
 * <div *hasPermission="[Permissions.ASSET, Permissions.ASSET_APPROVAL]; mode: 'any'">
 *
 * <!-- All of multiple permissions -->
 * <div *hasPermission="[Permissions.ASSET, Permissions.PRINT_QRCODE]; mode: 'all'">
 * ```
 */
@Directive({
  // ← MUST be '[hasPermission]' (no 'app' prefix) for *hasPermission microsyntax to work
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);
 
  private _permission: Permission | string | (Permission | string)[] = '';
  private _mode: 'single' | 'any' | 'all' = 'single';
  private _else: TemplateRef<any> | null = null;
  private _hasView = false;
 
  // Input name must match selector attribute name exactly
  @Input() set hasPermission(value: Permission | string | (Permission | string)[]) {
    this._permission = value;
    this.updateView();
  }
 
  @Input() set hasPermissionMode(mode: 'any' | 'all') {
    this._mode = mode;
    this.updateView();
  }
 
  @Input() set hasPermissionElse(template: TemplateRef<any>) {
    this._else = template;
    this.updateView();
  }
 
  ngOnInit(): void {
    this.updateView();
  }
 
  ngOnDestroy(): void {
    this.viewContainer.clear();
  }
 
  private checkPermission(): boolean {
    const perm = this._permission;
 
    if (Array.isArray(perm)) {
      return this._mode === 'all'
        ? this.permissionService.hasAll(...perm)
        : this.permissionService.hasAny(...perm);
    }
 
    return this.permissionService.hasPermission(perm as Permission | string);
  }
 
  private updateView(): void {
    const hasAccess = this.checkPermission();
 
    if (hasAccess) {
      if (!this._hasView) {
        this.viewContainer.clear();
        this.viewContainer.createEmbeddedView(this.templateRef);
        this._hasView = true;
      }
    } else {
      this.viewContainer.clear();
      if (this._else) {
        this.viewContainer.createEmbeddedView(this._else);
      }
      this._hasView = false;
    }
  }
}