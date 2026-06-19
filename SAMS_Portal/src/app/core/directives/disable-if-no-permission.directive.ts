import {
  Directive,
  Input,
  OnInit,
  ElementRef,
  Renderer2,
  inject,
} from '@angular/core';
import { PermissionService } from '../services/permission/permission.service';
import { Permission } from '../models/rbac/permissions.constants';
 
/**
 * DisableIfNoPermissionDirective — attribute directive
 *
 * Disables (but keeps visible) a button/input when the user lacks permission.
 * Adds greyed-out appearance + tooltip explaining why.
 *
 * SELECTOR FIX: selector '[disableIfNoPermission]' must match BOTH the template
 * attribute name AND the @Input() property name exactly.
 * Previous version had selector '[appDisableIfNoPermission]' which would NOT match
 * template usage of [disableIfNoPermission]="..." — causing the directive to silently
 * never activate.
 *
 * Usage:
 * ```html
 * <button [disableIfNoPermission]="Permissions.ASSET"
 *         disabledTooltip="You need Asset permission to add assets">
 *   Add Asset
 * </button>
 *
 * <!-- Without custom tooltip — uses default message -->
 * <button [disableIfNoPermission]="Permissions.ASSET_APPROVAL">
 *   Approve
 * </button>
 * ```
 */
@Directive({
  // ← MUST match exactly what templates use: [disableIfNoPermission]
  selector: '[disableIfNoPermission]',
  standalone: true,
})
export class DisableIfNoPermissionDirective implements OnInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private permissionService = inject(PermissionService);
 
  // ← @Input name must match selector attribute name
  @Input() disableIfNoPermission: Permission | string = '';
  @Input() disabledTooltip: string = 'You do not have permission to perform this action';
 
  ngOnInit(): void {
    this.applyPermission();
  }
 
  private applyPermission(): void {
    const hasAccess = this.permissionService.hasPermission(this.disableIfNoPermission);
    const el = this.el.nativeElement;
 
    if (!hasAccess) {
      this.renderer.setAttribute(el, 'disabled', 'true');
      this.renderer.setAttribute(el, 'title', this.disabledTooltip);
      this.renderer.addClass(el, 'permission-disabled');
      this.renderer.setAttribute(el, 'aria-disabled', 'true');
    } else {
      this.renderer.removeAttribute(el, 'disabled');
      this.renderer.removeAttribute(el, 'title');
      this.renderer.removeClass(el, 'permission-disabled');
      this.renderer.removeAttribute(el, 'aria-disabled');
    }
  }
}
 