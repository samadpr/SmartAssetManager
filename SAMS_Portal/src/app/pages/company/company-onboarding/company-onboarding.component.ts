import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { animate, style, transition, trigger } from '@angular/animations';
import { Industry } from '../../../core/models/interfaces/company/Industries.interface';
import { GlobalService } from '../../../core/services/global/global.service';
import { Router } from '@angular/router';
import { IndustriesService } from '../../../core/services/Industries/industries.service';
import { CompanyService } from '../../../core/services/company/company.service';
import { CountryService } from '../../../core/services/account/country/country.service';
import { CompanyRequest } from '../../../core/models/interfaces/company/company.interface';
import { DeviceInfoService } from '../../../core/services/account/device/device-info.service';
import { AccountService } from '../../../core/services/account/account.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StepMeta {
  index: number;
  label: string;
}

export interface CurrencyInfo {
  code: string;   // e.g. "USD"
  symbol: string; // e.g. "$"
  name: string;   // e.g. "US Dollar"
}

type CurrencyDetectionStatus = 'idle' | 'detecting' | 'detected' | 'manual';

// ─── Country → Currency map (ISO 3166-1 alpha-2 → ISO 4217) ──────────────────
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  US: 'USD', GB: 'GBP', EU: 'EUR', IN: 'INR', JP: 'JPY', CN: 'CNY',
  AU: 'AUD', CA: 'CAD', CH: 'CHF', AE: 'AED', SA: 'SAR', SG: 'SGD',
  HK: 'HKD', NZ: 'NZD', SE: 'SEK', NO: 'NOK', DK: 'DKK', ZA: 'ZAR',
  MX: 'MXN', BR: 'BRL', KR: 'KRW', TH: 'THB', MY: 'MYR', ID: 'IDR',
  PH: 'PHP', VN: 'VND', BD: 'BDT', PK: 'PKR', EG: 'EGP', NG: 'NGN',
  KE: 'KES', GH: 'GHS', TR: 'TRY', RU: 'RUB', UA: 'UAH', PL: 'PLN',
  CZ: 'CZK', HU: 'HUF', RO: 'RON', AT: 'EUR', BE: 'EUR', NL: 'EUR',
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', PT: 'EUR', FI: 'EUR',
  GR: 'EUR', IE: 'EUR', LU: 'EUR', SK: 'EUR', SI: 'EUR', EE: 'EUR',
  LV: 'EUR', LT: 'EUR', MT: 'EUR', CY: 'EUR', HR: 'EUR', AR: 'ARS',
  CL: 'CLP', CO: 'COP', PE: 'PEN', IL: 'ILS', QA: 'QAR', KW: 'KWD',
  BH: 'BHD', OM: 'OMR', JO: 'JOD', LK: 'LKR', NP: 'NPR', MM: 'MMK',
  KH: 'KHR', LA: 'LAK', MN: 'MNT', KZ: 'KZT', UZ: 'UZS', GE: 'GEL',
  AM: 'AMD', AZ: 'AZN', TZ: 'TZS', UG: 'UGX', ET: 'ETB', ZM: 'ZMW',
  ZW: 'ZWL', MZ: 'MZN', MG: 'MGA', MU: 'MUR', TN: 'TND', MA: 'MAD',
  DZ: 'DZD', LY: 'LYD', SD: 'SDG', SO: 'SOS', CM: 'XAF', CI: 'XOF',
  SN: 'XOF', ML: 'XOF', BF: 'XOF', NE: 'XOF', TG: 'XOF', BJ: 'XOF'
};

@Component({
  selector: 'app-company-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './company-onboarding.component.html',
  styleUrl: './company-onboarding.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class CompanyOnboardingComponent implements OnInit {

  // ─── Signals ──────────────────────────────────────────────────
  currentStep = signal(0);
  slideDir = signal<'forward' | 'back'>('forward');
  isLoading = signal(false);
  isSubmitting = signal(false);
  industries = signal<Industry[]>([]);
  countries = signal<any[]>([]);
  currencyDetectionStatus = signal<CurrencyDetectionStatus>('idle');

  // ─── State ────────────────────────────────────────────────────
  companyId: number | null = null;
  readonly totalSteps = 5;

  readonly stepsMeta: StepMeta[] = [
    { index: 0, label: 'Industry' },
    { index: 1, label: 'Company' },
    { index: 2, label: 'Capacity' },
    { index: 3, label: 'Location' },
    { index: 4, label: 'Website' }
  ];

  /** Full list of currencies shown in the select dropdown */
  readonly currencyList: CurrencyInfo[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    { code: 'LKR', symbol: '₨', name: 'Sri Lankan Rupee' },
    { code: 'NPR', symbol: '₨', name: 'Nepalese Rupee' },
    { code: 'EGP', symbol: '£', name: 'Egyptian Pound' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
    { code: 'PLN', symbol: 'zł', name: 'Polish Złoty' },
    { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
    { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal' },
    { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
    { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar' },
    { code: 'OMR', symbol: '﷼', name: 'Omani Rial' },
    { code: 'JOD', symbol: 'JD', name: 'Jordanian Dinar' },
    { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham' },
    { code: 'TND', symbol: 'DT', name: 'Tunisian Dinar' },
    { code: 'DZD', symbol: 'DA', name: 'Algerian Dinar' },
    { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
    { code: 'XAF', symbol: 'CFA', name: 'Central African CFA' },
    { code: 'XOF', symbol: 'CFA', name: 'West African CFA' },
    { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
    { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
    { code: 'COP', symbol: '$', name: 'Colombian Peso' },
    { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol' },
  ];

  // ─── Forms ────────────────────────────────────────────────────
  industryForm!: FormGroup;
  basicInfoForm!: FormGroup;
  subscriptionForm!: FormGroup;
  addressForm!: FormGroup;
  websiteForm!: FormGroup;

  // ─── Computed ─────────────────────────────────────────────────
  progressPercentage = computed(() =>
    ((this.currentStep() + 1) / this.totalSteps) * 100
  );

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private globelService: GlobalService,
    private industriesService: IndustriesService,
    private companyService: CompanyService,
    private countryService: CountryService,
    private deviceInfoService: DeviceInfoService,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.initializeForms();
    this.loadIndustries();
    this.loadCountries();
    this.loadCompanyData();
    this.detectCurrencyFromIP();
  }

  // ─── Form Init ────────────────────────────────────────────────
  initializeForms(): void {
    this.industryForm = this.fb.group({
      industriesId: [null, Validators.required]
    });

    this.basicInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]]
    });

    this.subscriptionForm = this.fb.group({
      assetCount: [null, [Validators.required, Validators.min(1)]],
      systemUserCount: [null, [Validators.required, Validators.min(1)]],
      totalUserCount: [null, [Validators.required, Validators.min(1)]]
    });

    this.addressForm = this.fb.group({
      address: [''],
      city: [''],
      country: [''],
      currency: ['']
    });

    this.websiteForm = this.fb.group({
      website: ['', Validators.pattern(
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
      )]
    });

    // When user manually changes currency → mark as manual
    this.addressForm.get('currency')!.valueChanges.subscribe(() => {
      if (this.currencyDetectionStatus() === 'detected') return; // skip reactive patch
      this.currencyDetectionStatus.set('manual');
    });
  }

  // ─── Data Loaders ─────────────────────────────────────────────
  loadIndustries(): void {
    this.isLoading.set(true);
    this.industriesService.getAllIndustries().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.industries.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading industries:', error);
        this.globelService.showToastr('Failed to load industries', 'error');
        this.isLoading.set(false);
      }
    });
  }

  loadCountries(): void {
    this.countries.set(this.countryService.getAllCountries());
  }

  private loadCompanyData(): void {
    this.companyService.getCurrentUserCompany().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const company = response.data;
          this.companyId = company.id;

          this.industryForm.patchValue({ industriesId: company.industriesId });
          this.basicInfoForm.patchValue({
            name: company.name,
            email: company.email,
            phone: company.phone
          });
          this.addressForm.patchValue({
            address: company.address,
            city: company.city,
            country: company.country,
            currency: company.currency
          });
          this.websiteForm.patchValue({ website: company.website });

          // If company already has a currency, show as detected
          if (company.currency) {
            this.currencyDetectionStatus.set('detected');
          }
        }
      },
      error: (error) => {
        console.warn('No existing company found or failed to load:', error);
      }
    });
  }

  // ─── Currency Detection ───────────────────────────────────────

  /**
   * Step 1: Try to detect currency from IP geolocation on init.
   * Only sets value if no currency is already set.
   */
  private detectCurrencyFromIP(): void {
    // Only attempt if currency not already prefilled
    if (this.addressForm?.get('currency')?.value) return;

    this.currencyDetectionStatus.set('detecting');

    this.accountService.getUserLocation().subscribe({
      next: (loc) => {
        const countryCode = loc?.country_code?.toUpperCase();
        const currency = countryCode ? COUNTRY_CURRENCY_MAP[countryCode] : null;

        if (currency) {
          // Silently patch — don't trigger the manual-detection listener
          this.currencyDetectionStatus.set('detected');
          this.addressForm.patchValue({ currency }, { emitEvent: false });

          // Also pre-fill country name if not already set
          if (!this.addressForm.get('country')?.value) {
            const matched = this.countries().find(c => c.code === countryCode);
            if (matched) {
              this.addressForm.patchValue({ country: matched.name }, { emitEvent: false });
            }
          }
        } else {
          this.currencyDetectionStatus.set('idle');
        }
      },
      error: () => {
        this.currencyDetectionStatus.set('idle');
      }
    });
  }

  /**
   * Step 2: When user picks a country from the dropdown,
   * immediately update currency from the map (overrides IP detection).
   */
  onCountryChange(countryName: string): void {
    const matched = this.countries().find(c => c.name === countryName);
    if (!matched) return;

    const currency = COUNTRY_CURRENCY_MAP[matched.code?.toUpperCase()];
    if (currency) {
      this.currencyDetectionStatus.set('detected');
      this.addressForm.patchValue({ currency }, { emitEvent: false });
    }
  }

  // ─── Navigation ───────────────────────────────────────────────
  nextStep(): void {
    const step = this.currentStep();

    if (step === 0 && this.industryForm.invalid) {
      this.globelService.showToastr('Please select an industry', 'Required');
      return;
    }

    if (step === 1 && this.basicInfoForm.invalid) {
      this.markFormGroupTouched(this.basicInfoForm);
      this.globelService.showToastr('Please fill in all required fields', 'Required');
      return;
    }

    if (step === 2 && this.subscriptionForm.invalid) {
      this.markFormGroupTouched(this.subscriptionForm);
      this.globelService.showToastr('Please fill in all capacity fields', 'Required');
      return;
    }

    if (step < this.totalSteps - 1) {
      this.slideDir.set('forward');
      this.currentStep.update(v => v + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 0) {
      this.slideDir.set('back');
      this.currentStep.update(v => v - 1);
    }
  }

  skipStep(): void {
    const step = this.currentStep();
    if (step === 3) {
      this.slideDir.set('forward');
      this.currentStep.update(v => v + 1);
    } else if (step === 4) {
      this.submitCompany();
    }
  }

  goToStep(index: number): void {
    if (index < this.currentStep()) {
      this.slideDir.set('back');
      this.currentStep.set(index);
    }
  }

  // ─── Submit ───────────────────────────────────────────────────
  submitCompany(): void {
    this.isSubmitting.set(true);

    const companyRequest: CompanyRequest = {
      industriesId: this.industryForm.value.industriesId,
      name: this.basicInfoForm.value.name,
      email: this.basicInfoForm.value.email,
      phone: this.basicInfoForm.value.phone,
      address: this.addressForm.value.address || null,
      city: this.addressForm.value.city || null,
      country: this.addressForm.value.country || null,
      currency: this.addressForm.value.currency || null,
      website: this.websiteForm.value.website || null,
      subscription: {
        assetCount: this.subscriptionForm.value.assetCount,
        systemUserCount: this.subscriptionForm.value.systemUserCount,
        totalUserCount: this.subscriptionForm.value.totalUserCount
      }
    };

    const apiCall = this.companyId
      ? this.companyService.updateCompanyWithSubscription({ ...companyRequest, id: this.companyId })
      : this.companyService.createCompany(companyRequest);

    apiCall.subscribe({
      next: (response) => {
        if (response.success) {
          const message = this.companyId
            ? 'Company updated successfully!'
            : 'Company setup completed successfully!';
          this.globelService.showToastr(message, 'success');

          setTimeout(() => {
            // ── CHANGED: always go to pending-activation after onboarding ──
            // The activation guard on /dashboard will also redirect here
            // if the admin hasn't activated yet, but routing directly is cleaner UX.
            this.router.navigateByUrl('/pending-activation');
          }, 1500);
        } else {
          this.globelService.showToastr(response.message || 'Operation failed', 'error');
          this.isSubmitting.set(false);
        }
      },
      error: (error) => {
        console.error('Error creating company:', error);
        this.globelService.showToastr('Failed to create company. Please try again.', 'error');
        this.isSubmitting.set(false);
      }
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  getFlagUrl(code: string): string {
    return this.countryService.getFlagUrl(code);
  }

  /** Returns true when at least one capacity value has been filled */
  hasCapacityValues(): boolean {
    const { assetCount, systemUserCount, totalUserCount } = this.subscriptionForm.value;
    return assetCount > 0 || systemUserCount > 0 || totalUserCount > 0;
  }

  /** Maps an industry name to an appropriate Material icon */
  getIndustryIcon(name: string): string {
    const map: Record<string, string> = {
      'Technology': 'computer',
      'Healthcare': 'local_hospital',
      'Finance': 'account_balance',
      'Education': 'school',
      'Manufacturing': 'factory',
      'Retail': 'storefront',
      'Construction': 'construction',
      'Transportation': 'local_shipping',
      'Hospitality': 'hotel',
      'Agriculture': 'agriculture',
      'Energy': 'bolt',
      'Government': 'account_balance',
      'Non-Profit': 'volunteer_activism',
      'Real Estate': 'apartment',
      'Media': 'movie',
      'Telecommunications': 'cell_tower',
      'Consulting': 'work',
      'Legal': 'gavel',
      'Food & Beverage': 'restaurant',
      'Automotive': 'directions_car'
    };
    const key = Object.keys(map).find(k =>
      name?.toLowerCase().includes(k.toLowerCase())
    );
    return key ? map[key] : 'business';
  }
}
