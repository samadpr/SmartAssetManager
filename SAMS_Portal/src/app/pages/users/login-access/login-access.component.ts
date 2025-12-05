import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { GlobalService } from '../../../core/services/global/global.service';
import { UserProfileService } from '../../../core/services/users/user-profile.service';
import { PopupWidgetService } from '../../../core/services/popup-widget/popup-widget.service';
import { ManageRolesService } from '../../../core/services/roles-manager/manage-roles.service';
import { PopupField } from '../../../core/models/interfaces/popup-widget.interface';
import { Validators } from '@angular/forms';
import { LoginAccessRequest } from '../../../core/models/interfaces/account/userProfile';

interface UserCard {
  userProfileId: number;
  fullName: string;
  email: string;
  designation?: string;
  department?: string;
  profilePicture?: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  hasLoginAccess: boolean;
  roleId?: number;
  roleName?: string;
}

@Component({
  selector: 'app-login-access',
  imports: [
    CommonModule,
    PageHeaderComponent,
    MatCardModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatBadgeModule,
    MatRippleModule
  ],
  templateUrl: './login-access.component.html',
  styleUrl: './login-access.component.scss'
})
export class LoginAccessComponent implements OnInit {
  private userService = inject(UserProfileService);
  private globalService = inject(GlobalService);
  private popupService = inject(PopupWidgetService);
  private rolesService = inject(ManageRolesService);

  // Signals
  users = signal<UserCard[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  availableRoles = signal<any[]>([]);

  // Computed
  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.users();

    return this.users().filter(user =>
      user.fullName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.designation?.toLowerCase().includes(term) ||
      user.department?.toLowerCase().includes(term)
    );
  });

  verifiedUsersCount = computed(() =>
    this.users().filter(u => u.isEmailVerified).length
  );

  activeAccessCount = computed(() =>
    this.users().filter(u => u.hasLoginAccess).length
  );

  ngOnInit() {
    this.loadRoles();
    this.loadUsers();
  }

  private loadRoles() {
    this.rolesService.getUserRoles().subscribe({
      next: (response) => {
        if (response.success) {
          this.availableRoles.set(response.data || []);
        }
      },
      error: (err) => console.error('Error loading roles:', err)
    });
  }

  loadUsers() {
    this.loading.set(true);
    this.userService.getCreatedUsersProfilesDetails().subscribe({
      next: (response) => {
        if (response.success) {
          const verifiedUsers = response.data
            .filter((u: any) => u.isEmailVerified)
            .map((u: any) => ({
              userProfileId: u.userProfileId,
              fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
              email: u.email,
              designation: u.designationDisplay,
              department: u.departmentDisplay,
              profilePicture: u.profilePicture,
              phoneNumber: u.phoneNumber,
              isEmailVerified: u.isEmailVerified,
              hasLoginAccess: u.isAllowLoginAccess || false,
              roleId: u.roleId,
              roleName: u.roleIdDisplay
            }));

          this.users.set(verifiedUsers);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.globalService.showToastr('Failed to load users', 'error');
        this.loading.set(false);
      }
    });
  }

  onToggleAccess(user: UserCard, checked: boolean) {
    if (checked) {
      // Grant access
      this.showPasswordDialog(user);
    } else {
      // Revoke access
      this.revokeAccess(user);
    }
  }

  private showPasswordDialog(user: UserCard) {
    const roles = this.availableRoles();

    const fields: PopupField[] = [
      {
        key: 'userInfo',
        label: 'User Information',
        type: 'info',
        value: `Granting login access to ${user.fullName} (${user.email})`,
        colSpan: 2,
        icon: 'info',
        color: 'primary',
        helperText: 'Configure login credentials and permissions for this user'
      },
      {
        key: 'roleId',
        label: 'Assign Role',
        type: 'select',
        required: true,
        colSpan: 2,
        icon: 'admin_panel_settings',
        value: user.roleId ?? null,
        options: roles.map(r => ({ value: r.id, label: r.name })),
        validators: [Validators.required]
      },
      {
        key: 'createPassword',
        label: 'Create Password Now',
        type: 'toggle',
        value: false,
        colSpan: 2,
        color: 'primary',
        helperText: 'Enable this to create a password now, or send email to let user create their own password'
      },
      {
        key: 'password',
        label: 'Password',
        type: 'password',
        required: false,
        placeholder: 'Enter password',
        colSpan: 1,
        icon: 'lock',
        validators: [Validators.minLength(3)],
        showIf: { field: 'createPassword', value: true }
      },
      {
        key: 'confirmPassword',
        label: 'Confirm Password',
        type: 'password',
        required: false,
        placeholder: 'Re-enter password',
        colSpan: 1,
        icon: 'lock_outline',
        showIf: { field: 'createPassword', value: true }
      },
      {
        key: 'sendPasswordEmail',
        label: 'Send Password via Email',
        type: 'toggle',
        value: true,
        colSpan: 2,
        color: 'primary',
        showIf: { field: 'createPassword', value: true },
        helperText: '⚠️ IMPORTANT: When enabled, the password will be sent to the user via email. Otherwise, only login access notification will be sent.'
      },
      {
        key: 'sendSetupEmail',
        label: 'Send Password Setup Email',
        type: 'toggle',
        value: true,
        colSpan: 2,
        color: 'primary',
        showIf: { field: 'createPassword', value: false },
        helperText: '📧 User will receive an email with a link to create their own password'
      },
      {
        key: 'customMessage',
        label: 'Custom Message (Optional)',
        type: 'textarea',
        placeholder: 'Add a personal message to the email...',
        colSpan: 2,
        rows: 3,
        icon: 'message'
      }
    ];

    this.popupService.openAddPopup('Grant Login Access', fields, {
      subtitle: 'Configure login credentials and permissions',
      icon: 'vpn_key',
      columns: 2,
      maxWidth: '700px',
      submitButtonText: 'Grant Access',
      submitButtonIcon: 'check_circle'
    }).subscribe(result => {
      if (result && result.action === 'submit') {
        this.handleGrantAccess(user, result.data);
      }
    });
  }

  private handleGrantAccess(user: UserCard, formData: any) {
    if (formData.createPassword && formData.password !== formData.confirmPassword) {
      this.globalService.showToastr('Passwords do not match', 'error');
      return;
    }

    this.loading.set(true);

    const request: LoginAccessRequest = {
      userProfileId: user.userProfileId,
      email: user.email,
      isAllowLoginAccess: true,
      isPasswordCreated: formData.createPassword || false,
      password: formData.createPassword ? formData.password : '',
      confirmPassword: formData.createPassword ? formData.confirmPassword : '',
      roleId: formData.roleId,
      isPasswordSendInMail: formData.createPassword ? formData.sendPasswordEmail === true : false,
      sendMessage: formData.customMessage || ''
    };

    this.userService.allowLoginAccessForCreatedUser(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.globalService.showSnackbar('Login access granted successfully', 'success');

          this.users.update(users =>
            users.map(u =>
              u.userProfileId === user.userProfileId
                ? { ...u, hasLoginAccess: true, roleId: formData.roleId }
                : u
            )
          );

          if (formData.createPassword && formData.sendPasswordEmail) {
            this.globalService.showSnackbar('Password has been sent to user via email', 'info');
          } else if (!formData.createPassword) {
            this.globalService.showSnackbar('Password setup email has been sent to user', 'info');
          }
        } else {
          this.globalService.showToastr(response.message || 'Failed to grant access', 'error');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error granting access:', error);
        this.globalService.showToastr('Failed to grant login access', 'error');
        this.loading.set(false);
      }
    });
  }


  public revokeAccess(user: UserCard) {

    const fields: PopupField[] = [
      {
        key: 'sendEmail',
        label: 'Send Email Notification',
        type: 'toggle',
        value: true,
        colSpan: 2,
        helperText: 'Notify the user that their login access has been revoked.'
      },
      {
        key: 'message',
        label: 'Custom Message (Optional)',
        type: 'textarea',
        placeholder: 'Add a message...',
        rows: 3,
        colSpan: 2,
        showIf: { field: 'sendEmail', value: true }
      }
    ];

    this.popupService.openAddPopup(
      `Revoke Login Access for ${user.fullName}`,
      fields,
      {
        subtitle: 'This will remove login access permanently.',
        icon: 'lock',
        columns: 2,
        maxWidth: '600px',
        submitButtonText: 'Revoke Access',
        submitButtonIcon: 'block'
      }
    ).subscribe(result => {
      if (result && result.action === 'submit') {
        this.handleRevokeAccess(user, result.data);
      }
    });
  }

  // public revokeAccess(user: UserCard) {
  //   this.popupService.openRevokeConfirmation(
  //     `Revoke login access for ${user.fullName}?`,
  //     'The user will no longer be able to log in to the system. This action can be reversed later.'
  //   ).subscribe(result => {
  //     if (result && result.action === 'confirm') {
  //       this.handleRevokeAccess(user);
  //     }
  //   });
  // }

 private handleRevokeAccess(user: UserCard, formData: any) {
  this.loading.set(true);

  const params = {
    id: user.userProfileId,
    sendEmail: formData.sendEmail,
    message: formData.message || ''
  };

  this.userService.revokeLoginAccessForCreatedUserProfile(params).subscribe({
    next: (response) => {
      if (response.success) {
        this.globalService.showSnackbar('Login access revoked successfully', 'success');

        this.users.update(users =>
          users.map(u => u.userProfileId === user.userProfileId
            ? { ...u, hasLoginAccess: false }
            : u
          )
        );
      } else {
        this.globalService.showToastr(response.message || 'Failed to revoke access', 'error');
      }

      this.loading.set(false);
    },
    error: (error) => {
      console.error('Error revoking access:', error);
      this.globalService.showToastr('Failed to revoke login access', 'error');
      this.loading.set(false);
    }
  });
}


  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  clearSearch() {
    this.searchTerm.set('');
  }

  onRefresh() {
    this.loadUsers();
  }

  viewUserDetails(user: UserCard) {
    console.log('View user details:', user);
  }

  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  trackByUserId(index: number, user: UserCard): number {
    return user.userProfileId;
  }
}
