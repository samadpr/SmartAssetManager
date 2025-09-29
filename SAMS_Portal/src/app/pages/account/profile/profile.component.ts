import { Component, computed, Inject, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Country, CountryService } from '../../../core/services/account/country/country.service';
import { ProfileService } from '../../../core/services/account/profile/profile.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { UserProfileDetails, UserProfileRequest } from '../../../core/models/account/userProfile';
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
import { ToastrService } from 'ngx-toastr';
import { GlobalService } from '../../../core/services/global/global.service';


@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    MatProgressBar,
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
  private designationServiece = inject(DesignationService);
  private globalService = inject(GlobalService);


  isLoading = signal(false);
  isEditing = signal(false);
  isSaving = signal(false);
  profileDetails = signal<UserProfileDetails | null>(null);
  selectedImage = signal<File | null>(null);
  imagePreview = signal<string | null>(null);

  profileForm: FormGroup;
  countries: Country[] = [];
  filteredCountries: Country[] = [];
  designations: any[] = [];

  fullName = computed(() => {
    const profile = this.profileDetails();
    if (!profile) return 'User Profiles';
    return `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User Profile';
  });

  profilePictureUrl = computed(() => {
    const profile = this.profileDetails();
    return profile?.profilePicture || '/assets/images/ProfilePic.png';
  })

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
      designation: ['', Validators.required] 
    })
  }

  ngOnInit(): void {
    // 1) Load countries first so trigger can resolve immediately
    this.countries = this.countryService.getAllCountries();
    this.filteredCountries = [...this.countries];


    this.loadProfileDetails();
    this.loadDesignations();
  }

  private async loadProfileDetails(): Promise<void> {
    this.isLoading.set(true);

    try {
      this.profileService.getProfileDetails().subscribe({
        next: (profile: UserProfileDetails) => {
          this.profileDetails.set(profile);
          this.populateForm(profile);
          console.log('Profile details loaded:', profile);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading profile details:', error);
          this.globalService.showSnackbar('Failed to load profile details', 'error');
          this.isLoading.set(false);
        }
      });
    }
    catch (error) {
      console.error('Unexpected error loading profile details:', error);
      this.globalService.showToastr('Failed to load profile details', 'error');
      this.isLoading.set(false);
    }
  }

  private populateForm(profile: UserProfileDetails): void {
    this.profileForm.patchValue({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phoneNumber: profile.phoneNumber || '',
      address: profile.address || '',
      country: profile.country || '',
      profilePicture: profile.profilePicture || '',
      designation: profile.designation || '',
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
      joiningDate: profile.joiningDate ? new Date(profile.joiningDate) : null,
      leavingDate: profile.leavingDate ? new Date(profile.leavingDate) : null
    });
  }

  loadDesignations() {
  this.designationServiece.getDesignations().subscribe({
    next: (res) => {
      this.designations = res;
    },
    error: (err) => {
      console.log('Failed to load designations', err);
      this.globalService.showToastr('Failed to load designations. Please try again later.', 'error');
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
    const porfile = this.profileDetails();
    if (porfile) {
      this.populateForm(porfile);
    }
  }

  openProfilePictureDialog() {
    const dialogRef = this.dialog.open(ProfilePictureUploadComponent, {
      width: '500px',
      data: { currentPicture: this.profilePictureUrl() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        debugger;
        const currentProfile = this.profileDetails();
        if (currentProfile) {
          this.profileDetails.set({
            ...currentProfile,
            profilePicture: result
          });

          this.globalService.showSnackbar('Profile picture updated successfully', 'success');
        }
      }
    });
  }

  // triggerFileInput(): void {
  //   const fileInput = document.getElementById('file-input') as HTMLInputElement;
  //   fileInput.click();
  // }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSaving.set(true);

    try {
      const currentProfile = this.profileDetails();
      if (!currentProfile) {
        this.globalService.showSnackbar('Profile data not found', 'error');
        this.isSaving.set(false);
        return;
      }

      // Prepare profile data
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
        designation: formValue.designation,  // These should come from dropdowns in a real app
        department: 0,
        subDepartment: 0,
        site: 0,
        location: 0,
      };

      // Update profile
      this.profileService.updateProfileData(profileRequest).subscribe({
        next: (response) => {
          // if(!response.Success){
          //   this.showSnackbar(response.message || 'Failed to update profile', 'error');
          //   this.isSaving.set(false);
          //   return;
          // }
          this.globalService.showSnackbar('Profile updated successfully', 'success');
          this.isEditing.set(false);
          this.selectedImage.set(null);
          this.imagePreview.set(null);
          this.loadProfileDetails(); // Reload to get updated data
          this.isSaving.set(false);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.globalService.showSnackbar('Failed to update profile', 'error');
          this.isSaving.set(false);
        }
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      this.globalService.showSnackbar('Failed to save profile', 'error');
      this.isSaving.set(false);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods for template
  getErrorMessage(fieldName: string): string {
    const control = this.profileForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    if (control?.hasError('email')) {
      return `Please enter a valid email address`;
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


  // --- helpers for the template ---

  getSelectedCountry(): Country | undefined {
    const name = this.profileForm.get('country')?.value as string;
    return this.countries.find(c => c.name === name);
  }

  getFlagUrl(code?: string | null): string {
    return code ? this.countryService.getFlagUrl(code) : '';
  }

  // If you add a text filter UI later, this is ready to use
  filterCountries(value: string) {
    const v = (value || '').toLowerCase();
    this.filteredCountries = this.countries.filter(c => c.name.toLowerCase().includes(v));
  }
}
