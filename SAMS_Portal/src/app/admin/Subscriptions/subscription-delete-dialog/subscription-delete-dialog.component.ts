// import { Component, Inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { Subscription } from '../../../core/models/admin/subscriptions.interface';
// import { SubscriptionsService } from '../../../core/services/admin/subscriptions/subscriptions.service';
// import { GlobalService } from '../../../core/services/global/global.service';

// @Component({
//   selector: 'app-subscription-delete-dialog',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatDialogModule,
//     MatButtonModule,
//     MatIconModule,
//     MatProgressSpinnerModule,
//   ],
//   templateUrl: './subscription-delete-dialog.component.html',
//   styleUrl: './subscription-delete-dialog.component.scss'
// })
// export class SubscriptionDeleteDialogComponent {
//   deleting = signal(false);

//   constructor(
//     private dialogRef: MatDialogRef<SubscriptionDeleteDialogComponent>,
//     @Inject(MAT_DIALOG_DATA) public data: { plan: Subscription },
//     private subscriptionsService: SubscriptionsService,
//     private globalService: GlobalService
//   ) {}

//   onDelete(): void {
//     if (!this.data.plan.id) return;
//     this.deleting.set(true);
//     this.subscriptionsService.deleteSubscription(this.data.plan.id).subscribe({
//       next: (res) => {
//         if (res.success) {
//           this.globalService.showToastr('Plan deleted successfully', 'success');
//           this.dialogRef.close(true);
//         } else {
//           this.globalService.showToastr(res.message || 'Delete failed', 'error');
//         }
//         this.deleting.set(false);
//       },
//       error: () => {
//         this.globalService.showToastr('Something went wrong', 'error');
//         this.deleting.set(false);
//       }
//     });
//   }

//   onCancel(): void { this.dialogRef.close(false); }
// }
