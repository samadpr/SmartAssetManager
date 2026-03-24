import { Pipe, PipeTransform } from '@angular/core';

/**
 * Joins an array of string|null|undefined values, skipping nulls/undefineds/empty strings.
 * Usage: {{ [city, country] | joinNonNull }}
 * Usage: {{ [city, country] | joinNonNull:' · ' }}
 */

@Pipe({
  name: 'joinNonNull',
  standalone: true,
})
export class JoinNonNullPipe implements PipeTransform {

  transform(values: (string | null | undefined)[], separator: string = ', '): string {
    if (!values) return '';
    return values.filter(v => v !== null && v !== undefined && v !== '').join(separator);
  }

}
