import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CompanyWithUserInfo } from '../../../core/models/interfaces/company/company.interface';
import { GlobalService } from '../../../core/services/global/global.service';
import { CompanyDetailService } from '../../../core/services/admin/company/company-detail.service';

export interface ToggleActiveDialogData {
  company: CompanyWithUserInfo;
  activate: boolean;  // true = activate, false = suspend
}

@Component({
  selector: 'app-toggle-active-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './toggle-active-dialog.component.html',
  styleUrl: './toggle-active-dialog.component.scss'
})
export class ToggleActiveDialogComponent {
  saving = false;
 
  constructor(
    private dialogRef: MatDialogRef<ToggleActiveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ToggleActiveDialogData,
    private globalService: GlobalService,
    private companyDetailService: CompanyDetailService,
  ) {}
 
  getInitials(name?: string): string {
    if (!name?.trim()) return '?';
    return name.trim().split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }
 
  onConfirm(): void {
    this.saving = true;
    const orgId = this.data.company.organizationId ?? '';
 
    this.companyDetailService.toggleCompanyActive(
      this.data.company.id,
      orgId,
      this.data.activate
    ).subscribe({
      next: (res) => {
        this.saving = false;
        if (res?.success) {
          this.dialogRef.close(true);
        } else {
          this.globalService.showToastr(res?.message ?? 'Operation failed', 'error');
          this.dialogRef.close(false);
        }
      },
      error: () => {
        this.saving = false;
        this.globalService.showToastr('Failed to update company status', 'error');
        this.dialogRef.close(false);
      }
    });
  }
 
  onCancel(): void { this.dialogRef.close(false); }
}
