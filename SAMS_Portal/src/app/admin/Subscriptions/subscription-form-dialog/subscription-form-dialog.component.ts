// import { Component, Inject, OnInit, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatSlideToggleModule } from '@angular/material/slide-toggle';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatSelectModule } from '@angular/material/select';
// import { BADGE_OPTIONS, PLAN_COLOR_THEMES, PlanColorTheme, Subscription } from '../../../core/models/admin/subscriptions.interface';
// import { GlobalService } from '../../../core/services/global/global.service';
// import { SubscriptionsService } from '../../../core/services/admin/subscriptions/subscriptions.service';
// import { MatTooltipModule } from '@angular/material/tooltip';

// export interface DialogData {
//   mode: 'create' | 'edit';
//   plan?: Subscription;
//   isCustom?: boolean;
// }

// @Component({
//   selector: 'app-subscription-form-dialog',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     MatDialogModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatButtonModule,
//     MatIconModule,
//     MatSlideToggleModule,
//     MatDividerModule,
//     MatProgressSpinnerModule,
//     MatTooltipModule,
//   ],
//   templateUrl: './subscription-form-dialog.component.html',
//   styleUrl: './subscription-form-dialog.component.scss'
// })
// export class SubscriptionFormDialogComponent implements OnInit {
//   form!: FormGroup;
//   saving = signal(false);

//   colorThemes: PlanColorTheme[] = PLAN_COLOR_THEMES;
//   badgeOptions = BADGE_OPTIONS;

//   selectedThemeId = signal<string>('violet');
//   selectedBadgeIndex = signal<number | null>(null);
//   useCustomColors = signal(false);

//   durationPresets = [
//     { label: '1 Mo',  days: 30  },
//     { label: '3 Mo',  days: 90  },
//     { label: '6 Mo',  days: 180 },
//     { label: '1 Yr',  days: 365 },
//     { label: '2 Yr',  days: 730 },
//   ];

//   get isEdit(): boolean { return this.data.mode === 'edit'; }

//   constructor(
//     private fb: FormBuilder,
//     private dialogRef: MatDialogRef<SubscriptionFormDialogComponent>,
//     @Inject(MAT_DIALOG_DATA) public data: DialogData,
//     private subscriptionsService: SubscriptionsService,
//     private globalService: GlobalService
//   ) {}

//   ngOnInit(): void {
//     const p = this.data.plan;

//     // Pre-select color theme if editing
//     if (p?.cardColor) {
//       const match = this.colorThemes.find(t => t.primary === p.cardColor);
//       if (match) {
//         this.selectedThemeId.set(match.id);
//       } else {
//         this.useCustomColors.set(true);
//       }
//     }

//     // Pre-select badge
//     if (p?.badgeLabel) {
//       const idx = this.badgeOptions.findIndex(b => b.label === p.badgeLabel);
//       this.selectedBadgeIndex.set(idx >= 0 ? idx : null);
//     }

//     this.form = this.fb.group({
//       name:            [p?.name            ?? '', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
//       description:     [p?.description     ?? ''],
//       planAmount:      [p?.planAmount      ?? null, [Validators.required, Validators.min(0)]],
//       durationDays:    [p?.durationDays    ?? 30,  [Validators.required, Validators.min(1)]],
//       assetLimit:      [p?.assetLimit      ?? null, [Validators.required, Validators.min(1)]],
//       systemUserLimit: [p?.systemUserLimit ?? null, [Validators.required, Validators.min(1)]],
//       totalUserLimit:  [p?.totalUserLimit  ?? null, [Validators.required, Validators.min(1)]],
//       isCustom:        [p?.isCustom        ?? (this.data.isCustom ?? false)],
//       cardColor:         [p?.cardColor         ?? '#7c3aed'],
//       cardColorSecondary:[p?.cardColorSecondary ?? '#a855f7'],
//       sortOrder:       [p?.sortOrder       ?? 0],
//     });
//   }

//   // ── Color theme selection ────────────────────────────────
//   selectTheme(theme: PlanColorTheme): void {
//     this.selectedThemeId.set(theme.id);
//     this.form.patchValue({
//       cardColor: theme.primary,
//       cardColorSecondary: theme.secondary
//     });
//   }

//   onCustomColorChange(): void {
//     this.selectedThemeId.set('');
//   }

//   toggleCustomColors(): void {
//     this.useCustomColors.update(v => !v);
//   }

//   // ── Badge selection ──────────────────────────────────────
//   selectBadge(index: number): void {
//     if (this.selectedBadgeIndex() === index) {
//       // deselect
//       this.selectedBadgeIndex.set(null);
//     } else {
//       this.selectedBadgeIndex.set(index);
//     }
//   }

//   getBadgeLabel(): string | undefined {
//     const i = this.selectedBadgeIndex();
//     return i !== null ? this.badgeOptions[i].label : undefined;
//   }

//   getBadgeIcon(): string | undefined {
//     const i = this.selectedBadgeIndex();
//     return i !== null ? this.badgeOptions[i].icon : undefined;
//   }

//   // ── Duration preset ───────────────────────────────────────
//   applyPreset(days: number): void {
//     this.form.patchValue({ durationDays: days });
//   }

//   // ── Submit ────────────────────────────────────────────────
//   onSubmit(): void {
//     if (this.form.invalid) { this.form.markAllAsTouched(); return; }

//     this.saving.set(true);
//     const payload: Subscription = {
//       ...this.form.value,
//       badgeLabel: this.getBadgeLabel(),
//       badgeIcon:  this.getBadgeIcon(),
//     };

//     const call = this.isEdit && this.data.plan?.id
//       ? this.subscriptionsService.updateSubscription({ ...payload, id: this.data.plan.id })
//       : this.subscriptionsService.createSubscription(payload);

//     call.subscribe({
//       next: (res) => {
//         if (res.success) {
//           this.globalService.showToastr(
//             this.isEdit ? 'Plan updated successfully' : 'Plan created successfully', 'success');
//           this.dialogRef.close(true);
//         } else {
//           this.globalService.showToastr(res.message || 'Operation failed', 'error');
//         }
//         this.saving.set(false);
//       },
//       error: () => {
//         this.globalService.showToastr('Something went wrong', 'error');
//         this.saving.set(false);
//       }
//     });
//   }

//   onCancel(): void { this.dialogRef.close(false); }
// }