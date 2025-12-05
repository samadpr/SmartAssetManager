import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface FilePreviewData {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number; // Optional: file size in bytes
}

@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './file-preview.component.html',
  styleUrl: './file-preview.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class FilePreviewComponent {
  private dialogRef = inject(MatDialogRef<FilePreviewComponent>);
  private sanitizer = inject(DomSanitizer);
  public data: FilePreviewData = inject(MAT_DIALOG_DATA);

  loading = signal(true);
  error = signal(false);
  safeUrl: SafeResourceUrl;

  constructor() {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.fileUrl);
    
    // Auto-hide loading after timeout as fallback
    setTimeout(() => {
      if (this.loading()) {
        console.warn('Loading timeout - auto-completing');
        this.loading.set(false);
      }
    }, 10000); // 10 second timeout
  }

  isPDF(): boolean {
    return this.data.fileType.toLowerCase() === 'pdf';
  }

  isImage(): boolean {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    return imageTypes.includes(this.data.fileType.toLowerCase());
  }

  getFileIcon(): string {
    if (this.isPDF()) return 'picture_as_pdf';
    if (this.isImage()) return 'image';
    return 'description';
  }

  fileSize(): string | null {
    if (!this.data.fileSize) return null;
    
    const bytes = this.data.fileSize;
    const kb = bytes / 1024;
    const mb = kb / 1024;
    
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    } else if (kb >= 1) {
      return `${kb.toFixed(2)} KB`;
    }
    return `${bytes} B`;
  }

  hasError(): boolean {
    return this.error();
  }

  onLoad(): void {
    console.log('File loaded successfully');
    this.loading.set(false);
    this.error.set(false);
  }

  onLoadError(): void {
    console.error('Error loading file');
    this.loading.set(false);
    this.error.set(true);
  }

  onDownload(): void {
    try {
      const link = document.createElement('a');
      link.href = this.data.fileUrl;
      link.download = this.data.fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Download initiated:', this.data.fileName);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
