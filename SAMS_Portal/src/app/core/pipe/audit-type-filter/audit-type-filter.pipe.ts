import { Pipe, PipeTransform } from '@angular/core';
import { CompanyAuditLog } from '../../models/admin/companies-details.interface';

@Pipe({
  name: 'auditTypeFilter', standalone: true, pure: false
})
export class AuditTypeFilterPipe implements PipeTransform {
  transform(logs: CompanyAuditLog[], type: string): CompanyAuditLog[] {
    if (!logs?.length || !type || type.toLowerCase() === 'all') {
      return logs;
    }

    const filter = type.trim().toLowerCase();

    return logs.filter(
      l => (l.type ?? '').trim().toLowerCase() === filter
    );
  }
}
