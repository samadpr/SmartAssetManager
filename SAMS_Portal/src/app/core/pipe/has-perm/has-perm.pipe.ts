import { inject, Pipe, PipeTransform } from '@angular/core';
import { PermissionService } from '../../services/permission/permission.service';
import { Permission } from '../../models/rbac/permissions.constants';

@Pipe({
  name: 'hasPerm',
  standalone: true,
  pure: false,   // impure so it reacts to permission context changes
})
export class HasPermPipe implements PipeTransform {
  private permissionService = inject(PermissionService);
 
  transform(
    permission: Permission | string | (Permission | string)[],
    mode: 'single' | 'any' | 'all' = 'single'
  ): boolean {
    if (Array.isArray(permission)) {
      if (mode === 'all') return this.permissionService.hasAll(...permission);
      return this.permissionService.hasAny(...permission);
    }
    return this.permissionService.hasPermission(permission as Permission | string);
  }
}
