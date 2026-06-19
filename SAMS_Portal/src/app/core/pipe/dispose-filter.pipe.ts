import { Pipe, PipeTransform } from '@angular/core';
import { BatchUnitRowDto } from '../models/interfaces/asset-report/asset-batch-report.interface';

@Pipe({
  name: 'disposeFilter',
  standalone: true,
  pure: true   // pure = recalculate only when reference changes (fast)
})
export class DisposeFilterPipe implements PipeTransform {

  transform(units: BatchUnitRowDto[] | null | undefined): BatchUnitRowDto[] {
    if (!units) return [];
    return units.filter(u => u.assignTo === 3); // 3 = Disposed
  }

}
