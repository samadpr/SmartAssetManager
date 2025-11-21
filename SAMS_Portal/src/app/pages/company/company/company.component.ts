import { Component, computed, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { animate, style, transition, trigger } from '@angular/animations';
import { Company, CompanyRequest } from '../../../core/models/interfaces/company/company.interface';
import { Industry } from '../../../core/models/interfaces/company/Industries.interface';
import { CountryService } from '../../../core/services/account/country/country.service';
import { IndustriesService } from '../../../core/services/Industries/industries.service';
import { CompanyService } from '../../../core/services/company/company.service';
import { GlobalService } from '../../../core/services/global/global.service';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './company.component.html',
  styleUrl: './company.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class CompanyComponent implements OnInit {
  isEditMode = signal(false);
  isLoading = signal(true);
  isSaving = signal(false);
  companyData = signal<Company | null>(null);
  industries = signal<Industry[]>([]);
  countries = signal<any[]>([]);
  
  companyForm!: FormGroup;

  // Computed values
  companyLogo = computed(() => 
    this.companyData()?.logo || 'assets/images/logos/company_logo.png'
  );

  industryName = computed(() => {
    const company = this.companyData();
    const industryId = company?.industriesId;
    if (!industryId) return 'Not specified';
    
    const industry = this.industries().find(i => i.id === industryId);
    return industry?.name || 'Not specified';
  });

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private industriesService: IndustriesService,
    private countryService: CountryService,
    private globalService: GlobalService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
  }

  private initializeForm(): void {
    this.companyForm = this.fb.group({
      id: [null],
      industriesId: [null, Validators.required],
      name: ['', [Validators.required, Validators.minLength(2)]],
      logo: [''],
      currency: [''],
      address: [''],
      city: [''],
      country: [''],
      phone: ['', Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)],
      email: ['', [Validators.required, Validators.email]],
      fax: [''],
      website: ['', Validators.pattern(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)]
    });
  }

  private loadData(): void {
    this.isLoading.set(true);
    
    // Load industries
    this.industriesService.getAllIndustries().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.industries.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading industries:', error);
      }
    });

    // Load countries
    this.countries.set(this.countryService.getAllCountries());

    // Load company data
    this.companyService.getCurrentUserCompany().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.companyData.set(response.data);
          this.companyForm.patchValue(response.data);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading company data:', error);
        this.globalService.showToastr('Failed to load company data', 'error');
        this.isLoading.set(false);
      }
    });
  }

  toggleEditMode(): void {
    if (this.isEditMode()) {
      // Cancel edit - reset form
      if (this.companyData()) {
        this.companyForm.patchValue(this.companyData()!);
      }
      this.isEditMode.set(false);
    } else {
      this.isEditMode.set(true);
    }
  }

  saveCompany(): void {
    if (this.companyForm.invalid) {
      this.markFormGroupTouched(this.companyForm);
      this.globalService.showToastr('Please fill in all required fields', 'error');
      return;
    }

    this.isSaving.set(true);
    const companyRequest: CompanyRequest = this.companyForm.value;

    this.companyService.updateCompany(companyRequest).subscribe({
      next: (response) => {
        if (response.success) {
          this.globalService.showToastr('Company updated successfully', 'success');
          this.loadData();
          this.isEditMode.set(false);
        } else {
          this.globalService.showToastr(response.message || 'Update failed', 'error');
        }
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Error updating company:', error);
        this.globalService.showToastr('Failed to update company', 'error');
        this.isSaving.set(false);
      }
    });
  }

  onLogoError(event: any): void {
    event.target.src = 'assets/images/logos/company_logo.png';
  }

  getFlagUrl(code: string): string {
    return this.countryService.getFlagUrl(code);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }
}
