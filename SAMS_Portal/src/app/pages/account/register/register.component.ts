import { Component, ElementRef, HostListener, Inject, NgZone, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormControl, FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Country, CountryService } from '../../../core/services/account/country/country.service';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { DeviceDetectorService } from 'ngx-device-detector';
import { AccountService } from '../../../core/services/account/account.service';
import { DeviceInfoService } from '../../../core/services/account/device/device-info.service';
import { GlobalService } from '../../../core/services/global/global.service';


// ── Dial code country interface ─────────────────────────────
export interface DialCountry {
  code: string;
  name: string;
  dial: string;
}
 
// ── Custom validator: password strength ─────────────────────
function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    if (!value) return null;
    const hasMin     = value.length >= 8;
    const hasUpper   = /[A-Z]/.test(value);
    const hasNumber  = /[0-9]/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);
    if (hasMin && hasUpper && hasNumber && hasSpecial) return null;
    return { pattern: true };
  };
}
 
// ── Custom validator: passwords must match ───────────────────
function passwordMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pw  = group.get('password')?.value ?? '';
    const cpw = group.get('confirmPassword')?.value ?? '';
    return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
  };
}
 
// ── Full dial code list ──────────────────────────────────────
const DIAL_COUNTRIES: DialCountry[] = [
  { code: 'AF', name: 'Afghanistan',           dial: '+93'   },
  { code: 'AL', name: 'Albania',               dial: '+355'  },
  { code: 'DZ', name: 'Algeria',               dial: '+213'  },
  { code: 'AR', name: 'Argentina',             dial: '+54'   },
  { code: 'AM', name: 'Armenia',               dial: '+374'  },
  { code: 'AU', name: 'Australia',             dial: '+61'   },
  { code: 'AT', name: 'Austria',               dial: '+43'   },
  { code: 'AZ', name: 'Azerbaijan',            dial: '+994'  },
  { code: 'BH', name: 'Bahrain',               dial: '+973'  },
  { code: 'BD', name: 'Bangladesh',            dial: '+880'  },
  { code: 'BY', name: 'Belarus',               dial: '+375'  },
  { code: 'BE', name: 'Belgium',               dial: '+32'   },
  { code: 'BZ', name: 'Belize',                dial: '+501'  },
  { code: 'BO', name: 'Bolivia',               dial: '+591'  },
  { code: 'BA', name: 'Bosnia & Herzegovina',  dial: '+387'  },
  { code: 'BR', name: 'Brazil',                dial: '+55'   },
  { code: 'BG', name: 'Bulgaria',              dial: '+359'  },
  { code: 'CA', name: 'Canada',                dial: '+1'    },
  { code: 'CL', name: 'Chile',                 dial: '+56'   },
  { code: 'CN', name: 'China',                 dial: '+86'   },
  { code: 'CO', name: 'Colombia',              dial: '+57'   },
  { code: 'HR', name: 'Croatia',               dial: '+385'  },
  { code: 'CY', name: 'Cyprus',                dial: '+357'  },
  { code: 'CZ', name: 'Czech Republic',        dial: '+420'  },
  { code: 'DK', name: 'Denmark',               dial: '+45'   },
  { code: 'EC', name: 'Ecuador',               dial: '+593'  },
  { code: 'EG', name: 'Egypt',                 dial: '+20'   },
  { code: 'EE', name: 'Estonia',               dial: '+372'  },
  { code: 'ET', name: 'Ethiopia',              dial: '+251'  },
  { code: 'FI', name: 'Finland',               dial: '+358'  },
  { code: 'FR', name: 'France',                dial: '+33'   },
  { code: 'GE', name: 'Georgia',               dial: '+995'  },
  { code: 'DE', name: 'Germany',               dial: '+49'   },
  { code: 'GH', name: 'Ghana',                 dial: '+233'  },
  { code: 'GR', name: 'Greece',                dial: '+30'   },
  { code: 'GT', name: 'Guatemala',             dial: '+502'  },
  { code: 'HK', name: 'Hong Kong',             dial: '+852'  },
  { code: 'HU', name: 'Hungary',               dial: '+36'   },
  { code: 'IS', name: 'Iceland',               dial: '+354'  },
  { code: 'IN', name: 'India',                 dial: '+91'   },
  { code: 'ID', name: 'Indonesia',             dial: '+62'   },
  { code: 'IR', name: 'Iran',                  dial: '+98'   },
  { code: 'IQ', name: 'Iraq',                  dial: '+964'  },
  { code: 'IE', name: 'Ireland',               dial: '+353'  },
  { code: 'IL', name: 'Israel',                dial: '+972'  },
  { code: 'IT', name: 'Italy',                 dial: '+39'   },
  { code: 'JP', name: 'Japan',                 dial: '+81'   },
  { code: 'JO', name: 'Jordan',                dial: '+962'  },
  { code: 'KZ', name: 'Kazakhstan',            dial: '+7'    },
  { code: 'KE', name: 'Kenya',                 dial: '+254'  },
  { code: 'KW', name: 'Kuwait',                dial: '+965'  },
  { code: 'KG', name: 'Kyrgyzstan',            dial: '+996'  },
  { code: 'LB', name: 'Lebanon',               dial: '+961'  },
  { code: 'LY', name: 'Libya',                 dial: '+218'  },
  { code: 'LT', name: 'Lithuania',             dial: '+370'  },
  { code: 'LU', name: 'Luxembourg',            dial: '+352'  },
  { code: 'MY', name: 'Malaysia',              dial: '+60'   },
  { code: 'MV', name: 'Maldives',              dial: '+960'  },
  { code: 'MX', name: 'Mexico',                dial: '+52'   },
  { code: 'MD', name: 'Moldova',               dial: '+373'  },
  { code: 'MA', name: 'Morocco',               dial: '+212'  },
  { code: 'NP', name: 'Nepal',                 dial: '+977'  },
  { code: 'NL', name: 'Netherlands',           dial: '+31'   },
  { code: 'NZ', name: 'New Zealand',           dial: '+64'   },
  { code: 'NG', name: 'Nigeria',               dial: '+234'  },
  { code: 'NO', name: 'Norway',                dial: '+47'   },
  { code: 'OM', name: 'Oman',                  dial: '+968'  },
  { code: 'PK', name: 'Pakistan',              dial: '+92'   },
  { code: 'PA', name: 'Panama',                dial: '+507'  },
  { code: 'PH', name: 'Philippines',           dial: '+63'   },
  { code: 'PL', name: 'Poland',                dial: '+48'   },
  { code: 'PT', name: 'Portugal',              dial: '+351'  },
  { code: 'QA', name: 'Qatar',                 dial: '+974'  },
  { code: 'RO', name: 'Romania',               dial: '+40'   },
  { code: 'RU', name: 'Russia',                dial: '+7'    },
  { code: 'SA', name: 'Saudi Arabia',          dial: '+966'  },
  { code: 'RS', name: 'Serbia',                dial: '+381'  },
  { code: 'SG', name: 'Singapore',             dial: '+65'   },
  { code: 'SK', name: 'Slovakia',              dial: '+421'  },
  { code: 'ZA', name: 'South Africa',          dial: '+27'   },
  { code: 'KR', name: 'South Korea',           dial: '+82'   },
  { code: 'ES', name: 'Spain',                 dial: '+34'   },
  { code: 'LK', name: 'Sri Lanka',             dial: '+94'   },
  { code: 'SE', name: 'Sweden',                dial: '+46'   },
  { code: 'CH', name: 'Switzerland',           dial: '+41'   },
  { code: 'TW', name: 'Taiwan',                dial: '+886'  },
  { code: 'TZ', name: 'Tanzania',              dial: '+255'  },
  { code: 'TH', name: 'Thailand',              dial: '+66'   },
  { code: 'TN', name: 'Tunisia',               dial: '+216'  },
  { code: 'TR', name: 'Turkey',                dial: '+90'   },
  { code: 'UG', name: 'Uganda',                dial: '+256'  },
  { code: 'UA', name: 'Ukraine',               dial: '+380'  },
  { code: 'AE', name: 'UAE',                   dial: '+971'  },
  { code: 'GB', name: 'United Kingdom',        dial: '+44'   },
  { code: 'US', name: 'United States',         dial: '+1'    },
  { code: 'UZ', name: 'Uzbekistan',            dial: '+998'  },
  { code: 'VE', name: 'Venezuela',             dial: '+58'   },
  { code: 'VN', name: 'Vietnam',               dial: '+84'   },
  { code: 'YE', name: 'Yemen',                 dial: '+967'  },
  { code: 'ZM', name: 'Zambia',                dial: '+260'  },
  { code: 'ZW', name: 'Zimbabwe',              dial: '+263'  },
];

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit, OnDestroy  {

  // ─── Form ───────────────────────────────────────────────
  _regform!: FormGroup;
  _resPonse: any;
  isSubmitting        = false;
  hidePassword        = true;
  hideConfirmPassword = true;
  deviceInfoLoaded    = false;
 
  // ─── Country data ────────────────────────────────────────
  countries:         Country[] = [];
  filteredCountries: Country[] = [];
  selectedCountry    = '';
  searchText         = '';
 
  // ─── Phone dial code ─────────────────────────────────────
  allDialCountries:      DialCountry[] = DIAL_COUNTRIES;
  filteredDialCountries: DialCountry[] = DIAL_COUNTRIES;
  selectedDialCode       = '+91';
  selectedDialCountryCode = 'IN';
  phoneDropdownOpen      = false;
  phoneSearchText        = '';
 
  // ─── Field focus flags ───────────────────────────────────
  firstFocused    = false;
  lastFocused     = false;
  emailFocused    = false;
  passwordFocused = false;
  confirmFocused  = false;
  phoneFocused    = false;
  countryFocused  = false;
 
  // ─── Password strength ───────────────────────────────────
  pwStrength      = 0;
  pwStrengthLabel = '';
  pwRules = { length: false, upper: false, number: false, special: false };
 
  // ─── Form progress ───────────────────────────────────────
  formProgress = 0;
 
  // ─── Avatar ──────────────────────────────────────────────
  pupilX         = 0;
  pupilY         = 0;
  eyeBlink       = false;
  avatarHappy    = false;
  avatarThinking = false;
  bubbleText     = '';
 
  private blinkTimer: any;
  private bubbleTimer: any;
 
  // ─── Legal modal ─────────────────────────────────────────
  legalModalOpen  = false;
  legalModalType: 'terms' | 'privacy' = 'terms';
 
  // ─── Left-panel data ─────────────────────────────────────
  steps = [
    { title: 'Create your account',      desc: 'Fill in your personal details securely' },
    { title: 'Verify your email',         desc: 'Confirm via the OTP we send you' },
    { title: 'Set up your organisation',  desc: 'Tell us about your company' },
    { title: 'Start managing assets',     desc: 'You\'re ready to go!' },
  ];
 
  badges = [
    { icon: '🔒', label: 'SSL Secured' },
    { icon: '⚡', label: 'Instant Setup' },
    { icon: '🛡️', label: 'GDPR Ready' },
  ];
 
  particles = Array.from({ length: 20 }, () => ({
    x:        Math.random() * 100,
    y:        Math.random() * 100,
    delay:    +(Math.random() * 6).toFixed(1),
    duration: +(6 + Math.random() * 10).toFixed(1),
  }));
 
  // ─────────────────────────────────────────────────────────
  constructor(
    private builder: FormBuilder,
    private accountService: AccountService,
    private countryService: CountryService,
    private deviceService: DeviceDetectorService,
    private deviceInfoService: DeviceInfoService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private toaster: ToastrService,
    private globalService: GlobalService,
    private router: Router,
    private ngZone: NgZone,
    private elRef: ElementRef,
  ) {}
 
  // ─── Lifecycle ───────────────────────────────────────────
  ngOnInit(): void {
    this._regform = this.builder.group(
      {
        email:           ['', [Validators.required, Validators.email]],
        password:        ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator()]],
        confirmPassword: ['', Validators.required],
        firstName:       ['', Validators.required],
        lastName:        ['', Validators.required],
        phoneNumber:     ['', [Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
        address:         [''],
        country:         [''],
        agreeTerms:      [false, Validators.requiredTrue],
        browser:         [''],
        operatingSystem: [''],
        device:          [''],
        publicIP:        [''],
        latitude:        [''],
        longitude:       [''],
      },
      { validators: passwordMatchValidator() }
    );
 
    this.countries         = this.countryService.getAllCountries();
    this.filteredCountries = [...this.countries];
 
    this._regform.valueChanges.subscribe(() => this._calcProgress());
 
    this.deviceInfoService.patchFormWithDeviceInfo(this._regform).subscribe({
      next:  () => { this.deviceInfoLoaded = true; },
      error: () => { this.deviceInfoLoaded = true; },
    });
 
    this.accountService.getUserLocation().subscribe((loc) => {
      const matchedCountry = this.countries.find((c) => c.code === loc.country_code);
      if (matchedCountry) {
        this.selectedCountry = matchedCountry.code;
        this._regform.patchValue({ country: matchedCountry.name });
      }
      // Auto-set dial code from detected country
      const dialMatch = this.allDialCountries.find(
        (d) => d.code === loc.country_code
      );
      if (dialMatch) {
        this.selectedDialCode        = dialMatch.dial;
        this.selectedDialCountryCode = dialMatch.code;
      }
    });
 
    if (isPlatformBrowser(this.platformId)) {
      this._startBlinking();
      this._showBubble('👋 Let\'s get started!');
    }
  }
 
  ngOnDestroy(): void {
    clearTimeout(this.blinkTimer);
    clearTimeout(this.bubbleTimer);
  }
 
  // ─── Mouse tracking ──────────────────────────────────────
  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = this.elRef.nativeElement.querySelector('.avatar-body');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = e.clientX - cx;
    const dy   = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.ngZone.run(() => {
      this.pupilX = dist > 0 ? (dx / dist) * Math.min(dist / 80, 3) : 0;
      this.pupilY = dist > 0 ? (dy / dist) * Math.min(dist / 80, 3) : 0;
    });
  }
 
  // ─── Click outside phone dropdown ────────────────────────
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (this.phoneDropdownOpen && !target.closest('.phone-wrap')) {
      this.closePhoneDropdown();
    }
  }
 
  // ─── Avatar blinking ─────────────────────────────────────
  private _startBlinking(): void {
    const next = () => {
      this.blinkTimer = setTimeout(() => {
        this.ngZone.run(() => {
          this.eyeBlink = true;
          setTimeout(() => { this.eyeBlink = false; next(); }, 130);
        });
      }, 2000 + Math.random() * 3500);
    };
    next();
  }
 
  private _showBubble(text: string, duration = 2800): void {
    clearTimeout(this.bubbleTimer);
    this.bubbleText = text;
    this.bubbleTimer = setTimeout(() => {
      this.ngZone.run(() => { this.bubbleText = ''; });
    }, duration);
  }
 
  // ─── Form progress ───────────────────────────────────────
  private _calcProgress(): void {
    const ctrls = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phoneNumber'];
    const filled = ctrls.filter((k) => {
      const c = this._regform.get(k);
      return c?.value && c?.valid;
    }).length;
    const terms   = this._regform.get('agreeTerms')?.value ? 1 : 0;
    const country = this._regform.get('country')?.value ? 0.5 : 0;
    this.formProgress = Math.round(((filled + terms + country) / (ctrls.length + 1.5)) * 100);
  }
 
  // ─── Field focus handlers ────────────────────────────────
  onFieldFocus(field: string): void {
    this.emailFocused    = field === 'email';
    this.passwordFocused = field === 'password';
    this.confirmFocused  = field === 'confirm';
    this.firstFocused    = field === 'first';
    this.lastFocused     = field === 'last';
    this.phoneFocused    = field === 'phone';
    this.countryFocused  = field === 'country';
 
    const messages: Record<string, string> = {
      first:    '😊 What\'s your name?',
      last:     '✍️ Last name please',
      email:    '📧 Your work email',
      password: '🔒 I won\'t peek!',
      confirm:  '🔐 One more time',
      phone:    '📱 Stay connected',
      country:  '🌍 Where are you from?',
    };
 
    if (messages[field]) this._showBubble(messages[field]);
  }
 
  onFieldBlur(field: string): void {
    this.emailFocused    = false;
    this.passwordFocused = false;
    this.confirmFocused  = false;
    this.firstFocused    = false;
    this.lastFocused     = false;
    this.phoneFocused    = false;
    this.countryFocused  = false;
  }
 
  // ─── Email input handler ─────────────────────────────────
  onEmailInput(): void {
    const val: string = this._regform.get('email')?.value ?? '';
    if (val.includes('@') && val.includes('.')) {
      this.avatarHappy = true;
      this._showBubble('✅ Great email!', 1500);
      setTimeout(() => { this.ngZone.run(() => { this.avatarHappy = false; }); }, 600);
    }
  }
 
  // ─── Password input handler ──────────────────────────────
  onPasswordInput(): void {
    const val: string = this._regform.get('password')?.value ?? '';
    this.pwRules = {
      length:  val.length >= 8,
      upper:   /[A-Z]/.test(val),
      number:  /[0-9]/.test(val),
      special: /[^A-Za-z0-9]/.test(val),
    };
    const score = Object.values(this.pwRules).filter(Boolean).length;
    this.pwStrength      = score;
    this.pwStrengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][score] ?? '';
 
    if (score === 4) {
      this.avatarHappy = true;
      this._showBubble('💪 Strong password!', 1800);
      setTimeout(() => { this.ngZone.run(() => { this.avatarHappy = false; }); }, 700);
    } else if (score === 1) {
      this.avatarThinking = true;
      this._showBubble('🤔 Make it stronger', 2000);
      setTimeout(() => { this.ngZone.run(() => { this.avatarThinking = false; }); }, 500);
    }
  }
 
  // ─── Country change — sync dial code ─────────────────────
  onCountryChange(): void {
    const name = this._regform.get('country')?.value;
    if (!name) return;
    const country = this.countries.find((c) => c.name === name);
    if (!country) return;
    const dialMatch = this.allDialCountries.find((d) => d.code === country.code);
    if (dialMatch) {
      this.selectedDialCode        = dialMatch.dial;
      this.selectedDialCountryCode = dialMatch.code;
    }
  }
 
  // ─── Phone dial code helpers ─────────────────────────────
  togglePhoneDropdown(): void {
    this.phoneDropdownOpen = !this.phoneDropdownOpen;
    if (this.phoneDropdownOpen) {
      this.phoneSearchText        = '';
      this.filteredDialCountries  = [...this.allDialCountries];
      this._showBubble('🌍 Your country code', 2000);
      // this._showBubble('🌍 Select your country code', 2000);
    }
  }
 
  closePhoneDropdown(): void {
    this.phoneDropdownOpen = false;
    this.phoneSearchText        = '';
    this.filteredDialCountries  = [...this.allDialCountries];
  }
 
  filterPhoneCountries(): void {
    const q = this.phoneSearchText.toLowerCase().trim();
    this.filteredDialCountries = q
      ? this.allDialCountries.filter(
          (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q)
        )
      : [...this.allDialCountries];
  }
 
  selectDialCode(c: DialCountry): void {
    this.selectedDialCode        = c.dial;
    this.selectedDialCountryCode = c.code;
    this.closePhoneDropdown();
 
    // Also sync country dropdown if possible
    const country = this.countries.find((ct) => ct.code === c.code);
    if (country) {
      this._regform.patchValue({ country: country.name });
    }
  }
 
  getDialCodeFlag(): string {
    return `https://flagcdn.com/w40/${this.selectedDialCountryCode.toLowerCase()}.png`;
  }
 
  // ─── Computed helpers ────────────────────────────────────
  get confirmPasswordError(): boolean {
    const cpw = this._regform.get('confirmPassword');
    return !!(
      (cpw?.invalid && cpw?.touched) ||
      (this._regform.hasError('passwordMismatch') && cpw?.touched && cpw?.value)
    );
  }
 
  get passwordsMatch(): boolean {
    const pw  = this._regform.get('password')?.value;
    const cpw = this._regform.get('confirmPassword')?.value;
    return !!(pw && cpw && pw === cpw && this._regform.get('confirmPassword')?.touched);
  }
 
  // ─── Country helpers ─────────────────────────────────────
  getFlagUrl(code: string | undefined | null): string {
    return code ? this.countryService.getFlagUrl(code) : '';
  }
 
  filterCountries(value: string): void {
    const f = value.toLowerCase();
    this.filteredCountries = this.countries.filter((c) => c.name.toLowerCase().includes(f));
  }
 
  getSelectedCountry(): Country | null {
    const name = this._regform.get('country')?.value;
    return this.countries.find((c) => c.name === name) || null;
  }
 
  // ─── Legal modal ─────────────────────────────────────────
  openLegalModal(type: 'terms' | 'privacy'): void {
    this.legalModalType = type;
    this.legalModalOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }
 
  closeLegalModal(): void {
    this.legalModalOpen = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }
 
  acceptAndClose(): void {
    this._regform.patchValue({ agreeTerms: true });
    this.closeLegalModal();
    this._showBubble('✅ Terms accepted!', 1800);
  }
 
  // ─── Submit ──────────────────────────────────────────────
  proceedregister(): void {
    if (this._regform.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const _obj = {
        ...this._regform.value,
        // Prepend dial code to phone number if not already there
        phoneNumber: this._regform.value.phoneNumber
          ? `${this.selectedDialCode}${this._regform.value.phoneNumber}`.replace(/\++/, '+')
          : '',
      };
 
      this.accountService.userRegistration(_obj).subscribe({
        next: (res: any) => {
          this._resPonse = res;
          if (this._resPonse.isSuccess) {
            this.accountService._registerresp.set({
              email:   _obj.email,
              otpText: '',
            });
            this.avatarHappy = true;
            this._showBubble('🎉 Account created!', 2000);
            this.globalService.showSnackbar('Validate OTP & complete the registration' + 'Registration Success' , 'success');
            this.router.navigateByUrl('/confirmotp');
          } else {
            this._showBubble('❌ Please try again', 2000);
            this.globalService.showSnackbar('Failed due to: ' + this._resPonse.message + 'Registration Failed', 'error');
            this.isSubmitting = false;
          }
        },
        error: (error) => {
          console.error('Registration error:', error);
          this._showBubble('😕 Something went wrong', 2000);
          this.toaster.error('Registration failed. Please try again.', 'Network Error');
          this.isSubmitting = false;
        },
      });
    } else {
      Object.keys(this._regform.controls).forEach((key) =>
        this._regform.get(key)?.markAsTouched()
      );
      this._showBubble('⚠️ Fill all required fields', 2200);
      this.toaster.warning('Please fill in all required fields correctly', 'Form Validation');
    }
  }
}
