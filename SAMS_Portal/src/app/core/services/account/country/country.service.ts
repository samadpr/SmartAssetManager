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
      { code: 'IN', name: 'India' },
      { code: 'AE', name: 'United Arab Emirates' },
      { code: 'SA', name: 'Saudi Arabia' },
      { code: 'QA', name: 'Qatar' },
      { code: 'OM', name: 'Oman' },
      { code: 'KW', name: 'Kuwait' },
      { code: 'BH', name: 'Bahrain' },
      { code: 'US', name: 'United States' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'FR', name: 'France' },
      { code: 'DE', name: 'Germany' },
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
