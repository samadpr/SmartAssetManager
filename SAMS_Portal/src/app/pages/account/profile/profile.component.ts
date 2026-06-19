import { Component, computed, DestroyRef, Inject, inject, OnInit, signal } from '@angular/core';
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
import { MatNativeDateModule, MatOptionModule, MatRippleModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { DesignationService } from '../../../core/services/Designation/designation.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FileUrlHelper } from '../../../core/helper/get-file-url';
import { DepartmentService } from '../../../core/services/department/department.service';
import { SubDepartmentService } from '../../../core/services/department/sub-department/sub-department.service';
import { CompanyService } from '../../../core/services/company/company.service';
import { IndustriesService } from '../../../core/services/Industries/industries.service';
import { Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatBadgeModule } from '@angular/material/badge';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const profileAnimations = [
  trigger('pageEnter', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(10px)' }),
      animate('350ms ease-out', style({ opacity: 1, transform: 'none' }))
    ])
  ]),
  trigger('slideUp', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(18px)' }),
      animate('400ms ease-out', style({ opacity: 1, transform: 'none' }))
    ])
  ]),
  trigger('fadeSlide', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(-6px)' }),
      animate('250ms ease-out', style({ opacity: 1, transform: 'none' }))
    ]),
    transition(':leave', [
      animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-6px)' }))
    ])
  ])
];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatOptionModule,
    MatChipsModule,
    MatTooltipModule,
    MatRippleModule,
    MatBadgeModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  animations: profileAnimations
})
export class ProfileComponent implements OnInit {
   
  private fb                   = inject(FormBuilder);
  private router               = inject(Router);
  private destroyRef           = inject(DestroyRef);
  private profileService       = inject(ProfileService);
  private dialog               = inject(MatDialog);
  private countryService       = inject(CountryService);
  private designationService   = inject(DesignationService);
  private departmentService    = inject(DepartmentService);
  private subDepartmentService = inject(SubDepartmentService);
  private companyService       = inject(CompanyService);
  private industriesService    = inject(IndustriesService);
  private globalService        = inject(GlobalService);
 
  // ── State ───────────────────────────────────────────────────────
  isLoading      = signal(false);
  isEditing      = signal(false);
  isSaving       = signal(false);
  profileDetails = signal<UserProfileDetails | null>(null);
  companyData    = signal<any | null>(null);
  industries     = signal<any[]>([]);
 
  /**
   * Reactive signal that mirrors the form's current serialised value.
   * Updated via valueChanges subscription so computed() can track it.
   */
  private _formValueSignal = signal<string>('{}');
 
  /**
   * Serialised snapshot taken when edit mode opens.
   * Stored as a signal so computed() re-evaluates when it changes.
   */
  private _snapshotSignal = signal<string>('');
 
  /**
   * Signal set to true when the profile picture is changed via the dialog
   * but before the form is saved. Cleared on cancel or after save.
   */
  pictureDirty = signal(false);
 
  /** Pending picture URL while in edit mode (not yet persisted). */
  pendingPictureUrl = signal<string | null>(null);
 
  // ── Form data ───────────────────────────────────────────────────
  profileForm!: FormGroup;
  countries: Country[]           = [];
  filteredCountries: Country[]   = [];
  designations: any[]            = [];
  departments: any[]             = [];
  subDepartments: any[]          = [];
  filteredSubDepartments: any[]  = [];
 
  // ── Computed ────────────────────────────────────────────────────
  fullName = computed(() => {
    const p = this.profileDetails();
    if (!p) return 'My Profile';
    return `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'My Profile';
  });
 
  /** Shows pending picture when in edit mode, otherwise the saved one. */
  profilePictureUrl = computed(() => {
    if (this.isEditing() && this.pendingPictureUrl()) {
      return this.pendingPictureUrl()!;
    }
    const p = this.profileDetails();
    return FileUrlHelper.getFullUrl(p?.profilePicture) || '/assets/images/ProfilePic.png';
  });
 
  companyLogoUrl = computed(() => {
    const c = this.companyData();
    if (!c?.logo) return '/assets/images/logos/company_logo.png';
    return FileUrlHelper.getFullUrl(c.logo);
  });
 
  industryName = computed(() => {
    const id = this.companyData()?.industriesId;
    if (!id) return '';
    return this.industries().find((i: any) => i.id === id)?.name || '';
  });
 
  /**
   * True when either:
   *  (a) any form field value differs from the snapshot, OR
   *  (b) the profile picture was changed via the dialog.
   *
   * Both dependencies are signals so Angular's computed() tracks them
   * correctly — no manual change-detection needed.
   */
  hasChanges = computed(() => {
    if (this.pictureDirty()) return true;
    const snapshot = this._snapshotSignal();
    if (!snapshot) return false;
    return this._formValueSignal() !== snapshot;
  });
 
  // ── Lifecycle ───────────────────────────────────────────────────
  constructor() {
    this._buildForm();
  }
 
  ngOnInit(): void {
    this.countries         = this.countryService.getAllCountries();
    this.filteredCountries = [...this.countries];
    this.loadProfileDetails();
    this.loadDropdownData();
    this.loadCompanyData();
  }
 
  // ── Form builder ────────────────────────────────────────────────
  private _buildForm(): void {
    this.profileForm = this.fb.group({
      firstName:     ['', [Validators.required, Validators.minLength(2)]],
      lastName:      ['', [Validators.required, Validators.minLength(2)]],
      email:         ['', [Validators.required, Validators.email]],
      phoneNumber:   ['', [Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
      address:       [''],
      country:       [''],
      dateOfBirth:   [null],
      joiningDate:   [null],
      leavingDate:   [null],
      designation:   [null],
      department:    [null],
      subDepartment: [null]
    });
 
    // Mirror every form change into the signal so computed() can react.
    this.profileForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this._formValueSignal.set(JSON.stringify(v)));
 
    // Cascade sub-departments when department changes.
    this.profileForm.get('department')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(deptId => {
        this.filteredSubDepartments = deptId
          ? this.subDepartments.filter(sd => sd.departmentId === deptId)
          : [...this.subDepartments];
        // Only clear if not initial patch
        if (this._snapshotSignal()) {
          this.profileForm.get('subDepartment')?.setValue(null, { emitEvent: true });
        }
      });
  }
 
  // ── Data loading ────────────────────────────────────────────────
  loadProfileDetails(): void {
    this.isLoading.set(true);
    this.profileService.getProfileDetails().subscribe({
      next: (profile: UserProfileDetails) => {
        this.profileDetails.set(profile);
        this._patchForm(profile);
        this.isLoading.set(false);
      },
      error: () => {
        this.globalService.showToastr('Failed to load profile', 'error');
        this.isLoading.set(false);
      }
    });
  }
 
  private loadDropdownData(): void {
    this.designationService.getDesignations().subscribe({
      next: res => { this.designations = res.data || []; },
      error: () => {}
    });
 
    this.departmentService.getMyDepartments().subscribe({
      next: res => { this.departments = res.data || []; },
      error: () => {}
    });
 
    this.subDepartmentService.getSubDepartments().subscribe({
      next: res => {
        this.subDepartments          = res.data || [];
        this.filteredSubDepartments  = [...this.subDepartments];
      },
      error: () => {}
    });
  }
 
  private loadCompanyData(): void {
    this.companyService.getCurrentUserCompany().subscribe({
      next: res => { if (res.success && res.data) this.companyData.set(res.data); },
      error: () => {}
    });
 
    this.industriesService.getAllIndustries().subscribe({
      next: res => { if (res.success) this.industries.set(res.data || []); },
      error: () => {}
    });
  }
 
  // ── Form population ─────────────────────────────────────────────
  private _patchForm(profile: UserProfileDetails): void {
    // Temporarily suppress the snapshot comparison while patching
    this._snapshotSignal.set('');
 
    this.profileForm.patchValue({
      firstName:     profile.firstName     || '',
      lastName:      profile.lastName      || '',
      email:         profile.email         || '',
      phoneNumber:   profile.phoneNumber   || '',
      address:       profile.address       || '',
      country:       profile.country       || '',
      designation:   profile.designation   || null,
      department:    profile.department    || null,
      subDepartment: profile.subDepartment || null,
      dateOfBirth:   profile.dateOfBirth  ? new Date(profile.dateOfBirth)  : null,
      joiningDate:   profile.joiningDate  ? new Date(profile.joiningDate)  : null,
      leavingDate:   profile.leavingDate  ? new Date(profile.leavingDate)  : null
    }, { emitEvent: true });
  }
 
  // ── Edit flow ───────────────────────────────────────────────────
  toggleEdit(): void {
    this.isEditing.set(true);
    this.pictureDirty.set(false);
    this.pendingPictureUrl.set(null);
 
    // Snapshot must be taken after patchValue has propagated through valueChanges.
    // A microtask (Promise.resolve) is enough — no need for a full setTimeout.
    Promise.resolve().then(() => {
      this._snapshotSignal.set(JSON.stringify(this.profileForm.value));
    });
  }
 
  cancelEdit(): void {
    this.isEditing.set(false);
    this._snapshotSignal.set('');
    this.pictureDirty.set(false);
    this.pendingPictureUrl.set(null);
    const p = this.profileDetails();
    if (p) this._patchForm(p);
  }
 
  saveProfile(): void {
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(k =>
        this.profileForm.get(k)?.markAsTouched()
      );
      this.globalService.showToastr('Please fill in all required fields', 'error');
      return;
    }
 
    this.isSaving.set(true);
 
    const current = this.profileDetails()!;
    const fv      = this.profileForm.value;
 
    // Use the pending picture URL (already uploaded) or fall back to the saved one.
    const finalPicture = this.pendingPictureUrl() ?? current.profilePicture;
 
    const request: UserProfileRequest = {
      userProfileId:  current.userProfileId,
      firstName:      fv.firstName,
      lastName:       fv.lastName,
      email:          fv.email,
      phoneNumber:    fv.phoneNumber,
      address:        fv.address,
      country:        fv.country,
      dateOfBirth:    fv.dateOfBirth,
      joiningDate:    fv.joiningDate,
      leavingDate:    fv.leavingDate,
      profilePicture: finalPicture,
      designation:    fv.designation,
      department:     fv.department    || (current.department    || 0),
      subDepartment:  fv.subDepartment || (current.subDepartment || 0)
    };
 
    this.profileService.updateProfileData(request).subscribe({
      next: () => {
        this.globalService.showToastr('Profile updated successfully', 'success');
        this.isEditing.set(false);
        this._snapshotSignal.set('');
        this.pictureDirty.set(false);
        this.pendingPictureUrl.set(null);
        this.loadProfileDetails();
        this.isSaving.set(false);
        setTimeout(() => window.location.reload(), 500);
      },
      error: () => {
        this.globalService.showToastr('Failed to update profile', 'error');
        this.isSaving.set(false);
      }
    });
  }
 
  // ── Profile picture dialog ───────────────────────────────────────
  openProfilePictureDialog(): void {
    const ref = this.dialog.open(ProfilePictureUploadComponent, {
      width: '500px',
      data:  { currentPicture: this.profilePictureUrl() }
    });
 
    ref.afterClosed().subscribe((uploadedUrl: string | undefined) => {
      if (!uploadedUrl) return;
 
      // Store the new URL as pending — not written to profileDetails yet.
      this.pendingPictureUrl.set(uploadedUrl);
      this.pictureDirty.set(true);
 
      // If not in edit mode (user opened dialog from view), switch to edit
      // so they can confirm with Save Changes.
      if (!this.isEditing()) {
        this.toggleEdit();
      }
    });
  }
 
  // ── Navigation ──────────────────────────────────────────────────
  navigateToCompany(): void {
    this.router.navigateByUrl('/company');
  }
 
  // ── Logo error ──────────────────────────────────────────────────
  onCompanyLogoError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/images/logos/company_logo.png';
  }
 
  // ── Country helpers ─────────────────────────────────────────────
  getSelectedCountry(): Country | undefined {
    const name = this.profileForm.get('country')?.value as string;
    return this.countries.find(c => c.name === name);
  }
 
  getFlagUrl(code?: string | null): string {
    return code ? this.countryService.getFlagUrl(code) : '';
  }
 
  getCountryCode(countryName: string): string {
    const found = this.countries.find(c => c.name === countryName);
    return found?.code || '';
  }
}
