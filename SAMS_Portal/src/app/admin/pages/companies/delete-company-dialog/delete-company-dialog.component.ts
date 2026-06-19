import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
 
export interface DeleteCompanyDialogData {
  company: { id: number; name?: string; organizationId: string };
}

@Component({
  selector: 'app-delete-company-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
  ],
  templateUrl: './delete-company-dialog.component.html',
  styleUrl: './delete-company-dialog.component.scss'
})
export class DeleteCompanyDialogComponent {
  reason = '';
  confirmed = false;
  saving = false;

  constructor(
    private dialogRef: MatDialogRef<DeleteCompanyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteCompanyDialogData,
  ) { }

  getInitials(name?: string): string {
    if (!name?.trim()) return '?';
    return name.trim().split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }

  onConfirm(): void {
    if (!this.confirmed) return;
    this.dialogRef.close({ confirmed: true, reason: this.reason.trim() });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
