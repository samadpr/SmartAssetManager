import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { Country, CountryService } from '../../../core/services/account/country/country.service';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { DeviceDetectorService } from 'ngx-device-detector';
import { AccountService } from '../../../core/services/account/account.service';
import { DeviceInfoService } from '../../../core/services/account/device/device-info.service';


@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    CommonModule,
    RouterLink
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  _regform!: FormGroup;
  countries: Country[] = [];
  filteredCountries: Country[] = [];
  selectedCountry: string = '';
  searchText = '';
  hidePassword = true;
  hideConfirmPassword = true;
  _resPonse: any;
  isSubmitting = false;

  constructor(
    private builder: FormBuilder,
    private accountService: AccountService,
    private countryService: CountryService,
    private deviceService: DeviceDetectorService,
    private deviceInfoService: DeviceInfoService,
    private toaster: ToastrService,
    private router: Router
  ) { }


  ngOnInit(): void {
    this._regform = this.builder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      address: [''],
      country: [''],
      browser: [''],
      operatingSystem: [''],
      device: [''],
      publicIP: [''],
      latitude: [''],
      longitude: ['']
    });

    this.countries = this.countryService.getAllCountries();
    this.filteredCountries = [...this.countries];


    this.deviceInfoService.patchFormWithDeviceInfo(this._regform).subscribe();

    this.accountService.getUserLocation().subscribe(loc => {
      const countryCode = loc.country_code;
      const matchedCountry = this.countries.find(c => c.code === countryCode);
      if (matchedCountry) {
        this.selectedCountry = matchedCountry.code;
        this._regform.patchValue({ country: matchedCountry.name });
      }
    });

  }

  setDeviceDetails() {
    const deviceInfo = this.deviceService.getDeviceInfo();
    const userAgent = navigator.userAgent;

    let deviceType = 'Unknown';
    if (/mobile/i.test(userAgent)) {
      deviceType = 'Mobile';
    } else if (/tablet/i.test(userAgent)) {
      deviceType = 'Tablet';
    } else if (/iPad|Android|Touch/.test(userAgent)) {
      deviceType = 'Tablet';
    } else if (/Windows|Mac|Linux/.test(userAgent)) {
      deviceType = 'Desktop';
    }

    this._regform.patchValue({
      browser: deviceInfo.browser,
      operatingSystem: deviceInfo.os,
      device: deviceType
    });
  }

  setGeolocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          this._regform.patchValue({
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          });
        },
        error => {
          console.warn('Geolocation error:', error.message);
          this._regform.patchValue({
            latitude: 'Not Available',
            longitude: 'Not Available'
          });
        }
      );
    } else {
      this._regform.patchValue({
        latitude: 'Not Supported',
        longitude: 'Not Supported'
      });
    }
  }

  setPublicIP() {
    this.accountService.getPublicIP().subscribe((res: any) => {
      this._regform.patchValue({ publicIP: res.ip });
    });
  }

  getFlagUrl(code: string | undefined | null): string {
    return code ? this.countryService.getFlagUrl(code) : '';
  }



  filterCountries(value: string) {
    const filterValue = value.toLowerCase();
    this.filteredCountries = this.countries.filter(c =>
      c.name.toLowerCase().includes(filterValue)
    );
  }

  // Add this updated method to your RegisterComponent

  proceedregister() {
    if (this._regform.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const _obj = this._regform.value;
      this.accountService.userRegistration(_obj).subscribe({
        next: (res) => {
          this._resPonse = res;
          debugger
          if (this._resPonse.isSuccess) {
            // Store email for OTP verification
            this.accountService._registerresp.set({
              email: _obj.email,
              otpText: ''
            });
            this.toaster.success('Validate OTP & complete the registration', 'Registration Success');
            this.router.navigateByUrl('/confirmotp');
          } else {
            this.toaster.error('Failed due to: ' + this._resPonse.message, 'Registration Failed');
            this.isSubmitting = false;
          }
        },
        error: (error) => {
          console.error('Registration error:', error);
          this.toaster.error('Registration failed. Please try again.', 'Network Error');
          this.isSubmitting = false;
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this._regform.controls).forEach(key => {
        this._regform.get(key)?.markAsTouched();
      });
      this.toaster.warning('Please fill in all required fields correctly', 'Form Validation');
    }
  }


  compareCountries(a: Country, b: Country): boolean {
    return a && b && a.code === b.code;
  }

  getSelectedCountry(): Country | null {
    const name = this._regform.get('country')?.value;
    return this.countries.find(c => c.name === name) || null;
  }

}
