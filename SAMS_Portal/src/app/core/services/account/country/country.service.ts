import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface Country {
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  constructor(private http: HttpClient) { }

  getAllCountries(): Country[] {
  return [
    // GCC
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'AE', name: 'UAE' },
    { code: 'QA', name: 'Qatar' },
    { code: 'OM', name: 'Oman' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'BH', name: 'Bahrain' },

    // Major European countries
    { code: 'GB', name: 'United Kingdom' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },

    // Others
    { code: 'IN', name: 'India' },
    { code: 'US', name: 'United States' },
    { code: 'BR', name: 'Brazil' },
    { code: 'AU', name: 'Australia' },
    { code: 'CN', name: 'China' },
    { code: 'JP', name: 'Japan' }
  ];
}

  getFlagUrl(code: string): string {
    return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  }
}
