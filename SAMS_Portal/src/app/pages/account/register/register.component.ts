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
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { DeviceDetectorService } from 'ngx-device-detector';


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
    CommonModule
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

  constructor(
    private builder: FormBuilder,
    private countryService: CountryService,
    private deviceService: DeviceDetectorService,
    // private service: UserService,
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

    this.setDeviceDetails();
    this.setGeolocation();
    this.setPublicIP();

    this.countryService.getUserLocation().subscribe(loc => {
      const countryCode = loc.country_code;
      if (this.countries.some(c => c.code === countryCode)) {
        this.selectedCountry = countryCode;
        this._regform.patchValue({ country: countryCode });
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
    this.countryService.getPublicIP().subscribe((res: any) => {
      this._regform.patchValue({ publicIP: res.ip });
    });
  }
  
  getFlagUrl(code: string): string {
    return this.countryService.getFlagUrl(code);
  }

    filterCountries(value: string) {
    const filterValue = value.toLowerCase();
    this.filteredCountries = this.countries.filter(c =>
      c.name.toLowerCase().includes(filterValue)
    );
  }

  proceedregister() {
    if (this._regform.valid) {
      const _obj = this._regform.value;
      // this.service.userRegistration(_obj).subscribe(res => {
      //   this._resPonse = res;
      //   if (this._resPonse.isSuccess) {
      //     this.toaster.success('Validate OTP & complete the registration: ' + this._resPonse.message, 'Registration Success');
      //     this.router.navigateByUrl('/login');
      //   } else {
      //     this.toaster.error('Failed due to: ' + this._resPonse.message, 'Registration Failed');
      //   }
      // });
    }
  }


  compareCountries(a: string, b: string): boolean {
    return a === b;
  }
  getSelectedCountry(): Country | undefined {
    return this.countries.find(c => c.code === this.selectedCountry);
  }



}
