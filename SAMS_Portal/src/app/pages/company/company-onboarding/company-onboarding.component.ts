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

@Component({
  selector: 'app-company-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatStepperModule,
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
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateX(-100%)', opacity: 0 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class CompanyOnboardingComponent implements OnInit {
  currentStep = signal(0);
  isLoading = signal(false);
  isSubmitting = signal(false);
  industries = signal<Industry[]>([]);
  countries = signal<any[]>([]);
  companyId: number | null = null;

  industryForm!: FormGroup;
  basicInfoForm!: FormGroup;
  addressForm!: FormGroup;
  websiteForm!: FormGroup;

  progressPercentage = computed(() => {
    return ((this.currentStep() + 1) / 4) * 100;
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private globelService: GlobalService,
    private industriesService: IndustriesService,
    private companyService: CompanyService,
    private countryService: CountryService
  ) { }

  ngOnInit(): void {
    this.initializeForms();
    this.loadIndustries();
    this.loadCountries();
    this.loadCompanyData();
  }

  initializeForms(): void {
    this.industryForm = this.fb.group({
      industriesId: [null, Validators.required]
    });

    this.basicInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]]
    });

    this.addressForm = this.fb.group({
      address: [''],
      city: [''],
      country: ['']
    });

    this.websiteForm = this.fb.group({
      website: ['', Validators.pattern(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)]
    });
  }

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

    if (this.currentStep() < 3) {
      this.currentStep.update(v => v + 1);
    }
  }

  private loadCompanyData(): void {
    this.companyService.getCurrentUserCompany().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const company = response.data;
          this.companyId = company.id;

          // 🟢 Pre-fill all forms with existing data
          this.industryForm.patchValue({ industriesId: company.industriesId });
          this.basicInfoForm.patchValue({
            name: company.name,
            email: company.email,
            phone: company.phone
          });
          this.addressForm.patchValue({
            address: company.address,
            city: company.city,
            country: company.country
          });
          this.websiteForm.patchValue({
            website: company.website
          });
        }
      },
      error: (error) => {
        console.warn('No existing company found or failed to load:', error);
      }
    });
  }

  previousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(v => v - 1);
    }
  }

  skipStep(): void {
    if (this.currentStep() === 2) {
      // Skip address step
      this.currentStep.update(v => v + 1);
    } else if (this.currentStep() === 3) {
      // Skip website and submit
      this.submitCompany();
    }
  }

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
      website: this.websiteForm.value.website || null
    };

    // 🟢 Check if updating or creating
    const apiCall = this.companyId
      ? this.companyService.updateCompany({ ...companyRequest, id: this.companyId })
      : this.companyService.createCompany(companyRequest);

    apiCall.subscribe({
      next: (response) => {
        if (response.success) {
          const message = this.companyId
            ? 'Company updated successfully!'
            : 'Company setup completed successfully!';
          this.globelService.showToastr(message, 'success');

          setTimeout(() => {
            this.router.navigateByUrl('/dashboard');
          }, 1500);
        } else {
          this.globelService.showToastr(response.message || 'Operation failed', 'error');
        }
        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.error('Error creating company:', error);
        this.globelService.showToastr('Failed to create company. Please try again.', 'error');
        this.isSubmitting.set(false);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  getFlagUrl(code: string): string {
    return this.countryService.getFlagUrl(code);
  }
}
