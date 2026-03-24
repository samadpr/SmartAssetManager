// import { Component, OnInit, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { MatIconModule } from '@angular/material/icon';
// import { MatButtonModule } from '@angular/material/button';
// import { MatDialogModule, MatDialog } from '@angular/material/dialog';
// import { MatTooltipModule } from '@angular/material/tooltip';
// import { MatChipsModule } from '@angular/material/chips';
// import { MatMenuModule } from '@angular/material/menu';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatSlideToggleModule } from '@angular/material/slide-toggle';
// import { MatBadgeModule } from '@angular/material/badge';
// import { AdminPageHeaderComponent } from '../../shared/widgets/admin-page-header/admin-page-header.component';
// import { GlobalService } from '../../../core/services/global/global.service';
// import { Subscription } from '../../../core/models/admin/subscriptions.interface';
// import { SubscriptionsService } from '../../../core/services/admin/subscriptions/subscriptions.service';
// import { SubscriptionFormDialogComponent } from '../subscription-form-dialog/subscription-form-dialog.component';
// import { SubscriptionDeleteDialogComponent } from '../subscription-delete-dialog/subscription-delete-dialog.component';
// import { MatRippleModule } from '@angular/material/core';

// @Component({
//   selector: 'app-subscriptions',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatIconModule,
//     MatButtonModule,
//     MatDialogModule,
//     MatTooltipModule,
//     MatMenuModule,
//     MatProgressSpinnerModule,
//     MatRippleModule,
//     AdminPageHeaderComponent,
//   ],
//   templateUrl: './subscriptions.component.html',
//   styleUrl: './subscriptions.component.scss'
// })
// export class SubscriptionsComponent implements OnInit {
//   plans   = signal<Subscription[]>([]);
//   loading = signal(false);
//   filterType = signal<'all' | 'standard' | 'custom'>('all');

//   breadcrumbs = [{ label: 'Subscriptions', url: '/admin/subscriptions' }];

//   filteredPlans = computed(() => {
//     const f = this.filterType();
//     const p = this.plans();
//     const filtered =
//       f === 'standard' ? p.filter(x => !x.isCustom) :
//       f === 'custom'   ? p.filter(x =>  x.isCustom) :
//       [...p];
//     // Sort by sortOrder ascending; plans without sortOrder go to the end
//     return filtered.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
//   });

//   standardCount = computed(() => this.plans().filter(p => !p.isCustom).length);
//   customCount   = computed(() => this.plans().filter(p =>  p.isCustom).length);

//   constructor(
//     private subscriptionsService: SubscriptionsService,
//     private dialog: MatDialog,
//     private globalService: GlobalService
//   ) {}

//   ngOnInit(): void { this.loadPlans(); }

//   loadPlans(): void {
//     this.loading.set(true);
//     this.subscriptionsService.getAllSubscriptions().subscribe({
//       next: (res) => {
//         if (res.success) this.plans.set(res.data || []);
//         this.loading.set(false);
//       },
//       error: () => {
//         this.globalService.showToastr('Failed to load subscription plans', 'error');
//         this.loading.set(false);
//       }
//     });
//   }

//   // ── Helpers ────────────────────────────────────────
//   /** Lighten a hex color for glass tint backgrounds */
//   hexToRgba(hex: string, alpha: number): string {
//     const r = parseInt(hex.slice(1, 3), 16);
//     const g = parseInt(hex.slice(3, 5), 16);
//     const b = parseInt(hex.slice(5, 7), 16);
//     return `rgba(${r},${g},${b},${alpha})`;
//   }

//   formatCurrency(amount: number): string {
//     return new Intl.NumberFormat('en-AE', {
//       style: 'currency', currency: 'AED', maximumFractionDigits: 2
//     }).format(amount);
//   }

//   formatDuration(days: number): string {
//     if (days >= 365) return `${Math.round(days / 365)}yr`;
//     if (days >= 30)  return `${Math.round(days / 30)}mo`;
//     return `${days}d`;
//   }

//   getDurationLabel(days: number): string {
//     if (days >= 365) { const y = Math.round(days/365); return `${y} Year${y>1?'s':''}`; }
//     if (days >= 30)  { const m = Math.round(days/30);  return `${m} Month${m>1?'s':''}`; }
//     return `${days} Day${days>1?'s':''}`;
//   }

//   // ── Dialog openers ──────────────────────────────────
//   openCreateDialog(isCustom = false): void {
//     const ref = this.dialog.open(SubscriptionFormDialogComponent, {
//       width: '600px', maxWidth: '96vw',
//       panelClass: 'subscription-dialog-panel',
//       data: { mode: 'create', isCustom }
//     });
//     ref.afterClosed().subscribe(r => { if (r) this.loadPlans(); });
//   }

//   openEditDialog(plan: Subscription): void {
//     const ref = this.dialog.open(SubscriptionFormDialogComponent, {
//       width: '600px', maxWidth: '96vw',
//       panelClass: 'subscription-dialog-panel',
//       data: { mode: 'edit', plan }
//     });
//     ref.afterClosed().subscribe(r => { if (r) this.loadPlans(); });
//   }

//   openDeleteDialog(plan: Subscription): void {
//     const ref = this.dialog.open(SubscriptionDeleteDialogComponent, {
//       width: '440px', maxWidth: '96vw',
//       panelClass: 'subscription-dialog-panel',
//       data: { plan }
//     });
//     ref.afterClosed().subscribe(r => { if (r) this.loadPlans(); });
//   }
// }
