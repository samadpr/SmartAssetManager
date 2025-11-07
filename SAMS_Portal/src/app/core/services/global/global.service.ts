import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IndividualConfig, ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  private snackBar = inject(MatSnackBar)
  private toastr = inject(ToastrService)


  constructor() { }

  public showSnackbar(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [type === 'success' ? 'snackbar-success' : 'snackbar-error'],
    });
  }

  public showToastr(message: string, type: 'success' | 'error' | 'info' | 'Required'): void {
    const options: Partial<IndividualConfig> = {
      timeOut: 3000,
      closeButton: true,
      progressBar: true,
      progressAnimation: 'decreasing',
      tapToDismiss: true,
      positionClass: 'toast-top-right',
    };

    if (type === 'success') {
      this.toastr.success(message, 'Success', options);
    } else {
      this.toastr.error(message, 'Error', options);
    }
  }

}
