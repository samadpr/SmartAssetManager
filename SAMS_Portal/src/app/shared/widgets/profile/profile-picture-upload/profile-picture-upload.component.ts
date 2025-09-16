import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfileService } from '../../../../core/services/account/profile/profile.service';

interface DialogData {
  currentPicture: string;
}

@Component({
  selector: 'app-profile-picture-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './profile-picture-upload.component.html',
  styleUrl: './profile-picture-upload.component.scss'
})
export class ProfilePictureUploadComponent {
  previewUrl = signal<string | null>(null);
  isUploading = signal(false);
  errorMessage = signal<string | null>(null);
  selectedFile: File | null = null;

  constructor(
    public dialogRef: MatDialogRef<ProfilePictureUploadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    @Inject(MatSnackBar) private snackBar: MatSnackBar,
    private profileService: ProfileService
  ) { }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    // Reset previous errors
    this.errorMessage.set(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please select a valid image file');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.errorMessage.set('File size must be less than 5MB');
      return;
    }

    this.selectedFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  onSave() {
    if (!this.selectedFile) return;

    this.isUploading.set(true);

    this.profileService.uploadProfilePicture(this.selectedFile).subscribe({
    next: (response) => {
      this.isUploading.set(false);
      this.dialogRef.close(response.url); // return uploaded image URL
    },
    error: (err) => {
      this.isUploading.set(false);
      this.errorMessage.set('Upload failed. Please try again.');
    }
  });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
