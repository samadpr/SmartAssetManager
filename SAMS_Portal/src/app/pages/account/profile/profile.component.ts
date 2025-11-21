import { Component, computed, Inject, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Country, CountryService } from '../../../core/services/account/country/country.service';
import { ProfileService } from '../../../core/services/account/profile/profile.service';
import { MatDialog } from '@angular/material/dialog';
import { UserProfileDetails, UserProfileRequest } from '../../../core/models/interfaces/account/userProfile';
import { ProfilePictureUploadComponent } from '../../../shared/widgets/profile/profile-picture-upload/profile-picture-upload.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { profileAnimations } from '../../../shared/animations/profile.animations';
import { DesignationService } from '../../../core/services/Designation/designation.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatOptionModule,
    MatChipsModule,
    MatTooltipModule,
    PageHeaderComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  animations: profileAnimations
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private dialog = inject(MatDialog);
  private countryService = inject(CountryService);
  private designationService = inject(DesignationService);
  private globalService = inject(GlobalService);

  isLoading = signal(false);
  isEditing = signal(false);
  isSaving = signal(false);
  profileDetails = signal<UserProfileDetails | null>(null);

  profileForm: FormGroup;
  countries: Country[] = [];
  filteredCountries: Country[] = [];
  designations: any[] = [];

  fullName = computed(() => {
    const profile = this.profileDetails();
    if (!profile) return 'User Profile';
    return `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User Profile';
  });

  profilePictureUrl = computed(() => {
    const profile = this.profileDetails();
    return profile?.profilePicture || '/assets/images/ProfilePic.png';
  });

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
      address: [''],
      country: [''],
      dateOfBirth: [''],
      joiningDate: [''],
      leavingDate: [''],
      designation: ['']
    });
  }

  ngOnInit(): void {
    this.countries = this.countryService.getAllCountries();
    this.filteredCountries = [...this.countries];
    this.loadProfileDetails();
    this.loadDesignations();
  }

  loadProfileDetails(): void {
    this.isLoading.set(true);
    this.profileService.getProfileDetails().subscribe({
      next: (profile: UserProfileDetails) => {
        this.profileDetails.set(profile);
        this.populateForm(profile);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading profile details:', error);
        this.globalService.showToastr('Failed to load profile details', 'error');
        this.isLoading.set(false);
      }
    });
  }

  private populateForm(profile: UserProfileDetails): void {
    this.profileForm.patchValue({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phoneNumber: profile.phoneNumber || '',
      address: profile.address || '',
      country: profile.country || '',
      designation: profile.designation || null,
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
      joiningDate: profile.joiningDate ? new Date(profile.joiningDate) : null,
      leavingDate: profile.leavingDate ? new Date(profile.leavingDate) : null
    });
  }

  loadDesignations(): void {
    this.designationService.getDesignations().subscribe({
      next: (res) => {
        this.designations = res.data || [];
      },
      error: (err) => {
        console.error('Failed to load designations', err);
        this.globalService.showToastr('Failed to load designations', 'error');
      }
    });
  }

  toggleEdit(): void {
    if (this.isEditing()) {
      this.cancelEdit();
    } else {
      this.isEditing.set(true);
    }
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    const profile = this.profileDetails();
    if (profile) {
      this.populateForm(profile);
    }
  }

  openProfilePictureDialog(): void {
    const dialogRef = this.dialog.open(ProfilePictureUploadComponent, {
      width: '500px',
      data: { currentPicture: this.profilePictureUrl() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const currentProfile = this.profileDetails();
        if (currentProfile) {
          this.profileDetails.set({
            ...currentProfile,
            profilePicture: result
          });
          this.globalService.showToastr('Profile picture updated successfully', 'success');
        }
      }
    });
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched();
      this.globalService.showToastr('Please fill in all required fields', 'error');
      return;
    }

    this.isSaving.set(true);

    try {
      const currentProfile = this.profileDetails();
      if (!currentProfile) {
        this.globalService.showToastr('Profile data not found', 'error');
        this.isSaving.set(false);
        return;
      }

      const formValue = this.profileForm.value;
      const profileRequest: UserProfileRequest = {
        userProfileId: currentProfile.userProfileId,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phoneNumber: formValue.phoneNumber,
        address: formValue.address,
        country: formValue.country,
        dateOfBirth: formValue.dateOfBirth,
        joiningDate: formValue.joiningDate,
        leavingDate: formValue.leavingDate,
        profilePicture: currentProfile.profilePicture,
        designation: formValue.designation,
        department: currentProfile.department || 0,
        subDepartment: currentProfile.subDepartment || 0,
        // site: currentProfile.site || 0,
        // location: currentProfile.location || 0,
      };

      this.profileService.updateProfileData(profileRequest).subscribe({
        next: () => {
          this.globalService.showToastr('Profile updated successfully', 'success');
          this.isEditing.set(false);
          this.loadProfileDetails();
          this.isSaving.set(false);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.globalService.showToastr('Failed to update profile', 'error');
          this.isSaving.set(false);
        }
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      this.globalService.showToastr('Failed to save profile', 'error');
      this.isSaving.set(false);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.profileForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `${this.getFieldDisplayName(fieldName)} must be at least ${minLength} characters`;
    }
    if (control?.hasError('pattern')) {
      return 'Please enter a valid phone number';
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phoneNumber: 'Phone Number',
      address: 'Address',
      country: 'Country'
    };
    return displayNames[fieldName] || fieldName;
  }

  getSelectedCountry(): Country | undefined {
    const name = this.profileForm.get('country')?.value as string;
    return this.countries.find(c => c.name === name);
  }

  getFlagUrl(code?: string | null): string {
    return code ? this.countryService.getFlagUrl(code) : '';
  }

  filterCountries(value: string): void {
    const v = (value || '').toLowerCase();
    this.filteredCountries = this.countries.filter(c => c.name.toLowerCase().includes(v));
  }
}
