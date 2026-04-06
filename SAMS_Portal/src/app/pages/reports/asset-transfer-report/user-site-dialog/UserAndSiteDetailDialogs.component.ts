// ═══════════════════════════════════════════════════════════════════════════
// user-detail-dialog.component.ts
// ═══════════════════════════════════════════════════════════════════════════
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '../../../../../environments/environment.development';

@Component({
  selector: 'app-user-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatCardModule, MatDividerModule],
  template: `
<div class="user-dialog">

  <div class="ud-header">
    <div class="ud-avatar">
      <img *ngIf="getImageUrl(user?.profilePicture || user?.profilePicture)"
        [src]="getImageUrl(user?.profilePicture || user?.profilePicture)"
        (error)="onImageError($event)" />
      <mat-icon *ngIf="!getImageUrl(user?.profilePicture || user?.profilePicture)">person</mat-icon>
    </div>
    <div class="ud-title">
      <div class="ud-name">{{ user?.firstName }} {{ user?.lastName }}</div>
      <div class="ud-role" *ngIf="user?.designationDisplay || user?.designation">
        {{ user?.designationDisplay || user?.designation }}
      </div>
      <div class="ud-dept" *ngIf="user?.departmentDisplay || user?.department">
        <mat-icon>account_tree</mat-icon>
        {{ user?.departmentDisplay || user?.department }}
      </div>
    </div>
    <button mat-icon-button class="ud-close" (click)="close()">
      <mat-icon>close</mat-icon>
    </button>
  </div>

  <mat-divider></mat-divider>

  <mat-dialog-content>
    <div class="ud-info-grid">

      <div class="ud-info-item" *ngIf="user?.email">
        <mat-icon>email</mat-icon>
        <div>
          <div class="uid-label">Email</div>
          <div class="uid-val">{{ user?.email }}</div>
        </div>
      </div>

      <div class="ud-info-item" *ngIf="user?.phoneNumber">
        <mat-icon>phone</mat-icon>
        <div>
          <div class="uid-label">Phone</div>
          <div class="uid-val">{{ user?.phoneNumber }}</div>
        </div>
      </div>

      <div class="ud-info-item" *ngIf="user?.address">
        <mat-icon>home</mat-icon>
        <div>
          <div class="uid-label">Address</div>
          <div class="uid-val">{{ user?.address }}</div>
        </div>
      </div>

      <div class="ud-info-item" *ngIf="user?.country">
        <mat-icon>public</mat-icon>
        <div>
          <div class="uid-label">Country</div>
          <div class="uid-val">{{ user?.country }}</div>
        </div>
      </div>

      <div class="ud-info-item" *ngIf="user?.joiningDate">
        <mat-icon>calendar_today</mat-icon>
        <div>
          <div class="uid-label">Joining Date</div>
          <div class="uid-val">{{ formatDate(user?.joiningDate) }}</div>
        </div>
      </div>

      <div class="ud-info-item" *ngIf="user?.siteDisplay">
        <mat-icon>location_city</mat-icon>
        <div>
          <div class="uid-label">Site</div>
          <div class="uid-val">{{ user?.siteDisplay }}</div>
        </div>
      </div>

      <div class="ud-info-item" *ngIf="user?.areaDisplay">
        <mat-icon>place</mat-icon>
        <div>
          <div class="uid-label">Area</div>
          <div class="uid-val">{{ user?.areaDisplay }}</div>
        </div>
      </div>

    </div>
  </mat-dialog-content>

  <mat-dialog-actions>
    <button mat-raised-button color="primary" (click)="close()">Close</button>
  </mat-dialog-actions>

</div>
  `,
  styles: [`
.user-dialog { display:flex; flex-direction:column; }

.ud-header {
  display:flex; align-items:flex-start; gap:14px;
  padding:20px 20px 16px;
  background: linear-gradient(135deg, #1565c0 0%, #7b1fa2 100%);
  color:white; position:relative;
}

.ud-avatar {
  width:72px; height:72px; border-radius:50%; overflow:hidden;
  background:rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center;
  border:3px solid rgba(255,255,255,0.3); flex-shrink:0;
  img { width:100%; height:100%; object-fit:cover; }
  mat-icon { font-size:34px; width:34px; height:34px; color:rgba(255,255,255,0.8); }
}

.ud-title {
  flex:1;
  .ud-name { font-size:1.2rem; font-weight:700; margin-bottom:4px; }
  .ud-role { font-size:0.85rem; opacity:0.9; margin-bottom:3px; }
  .ud-dept { display:flex; align-items:center; gap:5px; font-size:0.8rem; opacity:0.8;
    mat-icon { font-size:14px; width:14px; height:14px; } }
}

.ud-close { position:absolute; top:10px; right:10px; color:white; }

mat-dialog-content { padding:16px !important; }

.ud-info-grid { display:flex; flex-direction:column; gap:12px; }

.ud-info-item {
  display:flex; align-items:flex-start; gap:12px;
  padding:12px; background:var(--mat-sys-surface-container); border-radius:10px;
  mat-icon { color:var(--mat-sys-primary); margin-top:2px; flex-shrink:0; }
  .uid-label { font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--mat-sys-on-surface-variant); }
  .uid-val { font-size:0.9rem; font-weight:500; color:var(--mat-sys-on-surface); margin-top:2px; }
}

mat-dialog-actions { padding:14px !important; display:flex; justify-content:flex-end; border-top:1px solid var(--mat-sys-outline-variant); }
  `]
})
export class UserDetailDialogComponent {
  user: any;

  constructor(
    public dialogRef: MatDialogRef<UserDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.user = data.user;
  }

  getImageUrl(path: string | null | undefined): string {
    if (!path || path.trim() === '') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const clean = path.startsWith('/') ? path.substring(1) : path;
    return `${environment.assetBaseUrl}/${clean}`;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  formatDate(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  close(): void { this.dialogRef.close(); }
}


// ═══════════════════════════════════════════════════════════════════════════
// site-detail-dialog.component.ts
// ═══════════════════════════════════════════════════════════════════════════
import { Component as Comp2, Inject as Inj2 } from '@angular/core';
import { CommonModule as CM2 } from '@angular/common';
import { MAT_DIALOG_DATA as MDD2, MatDialogModule as MDM2, MatDialogRef as MDR2 } from '@angular/material/dialog';
import { MatButtonModule as MBM2 } from '@angular/material/button';
import { MatIconModule as MIM2 } from '@angular/material/icon';
import { MatDividerModule as MDVM2 } from '@angular/material/divider';

@Comp2({
  selector: 'app-site-detail-dialog',
  standalone: true,
  imports: [CM2, MDM2, MBM2, MIM2, MDVM2],
  template: `
<div class="site-dialog">

  <div class="sd-header">
    <div class="sd-icon-wrap">
      <mat-icon>location_city</mat-icon>
    </div>
    <div class="sd-title">
      <div class="sd-name">{{ site?.name || site?.siteName }}</div>
      <div class="sd-type">
        <mat-icon>business</mat-icon>
        {{ site?.typeDisplay || site?.siteType || 'Site' }}
      </div>
    </div>
    <button mat-icon-button class="sd-close" (click)="close()">
      <mat-icon>close</mat-icon>
    </button>
  </div>

  <mat-divider></mat-divider>

  <mat-dialog-content>
    <div class="sd-info-grid">

      <div class="sd-info-item" *ngIf="site?.address || site?.siteAddress">
        <mat-icon>home</mat-icon>
        <div>
          <div class="si-label">Address</div>
          <div class="si-val">{{ site?.address || site?.siteAddress }}</div>
        </div>
      </div>

      <div class="sd-info-item" *ngIf="site?.cityDisplay || site?.city || site?.cityName">
        <mat-icon>location_on</mat-icon>
        <div>
          <div class="si-label">City</div>
          <div class="si-val">{{ site?.cityDisplay || site?.city || site?.cityName }}</div>
        </div>
      </div>

      <div class="sd-info-item" *ngIf="site?.description || site?.siteDescription">
        <mat-icon>description</mat-icon>
        <div>
          <div class="si-label">Description</div>
          <div class="si-val">{{ site?.description || site?.siteDescription }}</div>
        </div>
      </div>

    </div>

    <!-- Area info if available -->
    <div class="sd-area-section" *ngIf="site?.area">
      <h4 class="sd-area-title">
        <mat-icon>place</mat-icon> Area
      </h4>
      <div class="sd-area-card">
        <div class="sac-name">{{ site?.area?.areaName }}</div>
        <div class="sac-desc" *ngIf="site?.area?.areaDescription">
          {{ site?.area?.areaDescription }}
        </div>
      </div>
    </div>

  </mat-dialog-content>

  <mat-dialog-actions>
    <button mat-raised-button color="primary" (click)="close()">Close</button>
  </mat-dialog-actions>

</div>
  `,
  styles: [`
.site-dialog { display:flex; flex-direction:column; }

.sd-header {
  display:flex; align-items:flex-start; gap:14px; padding:20px;
  background:linear-gradient(135deg, #6a1b9a 0%, #4527a0 100%);
  color:white; position:relative;
}

.sd-icon-wrap {
  width:60px; height:60px; border-radius:14px; background:rgba(255,255,255,0.18);
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
  mat-icon { font-size:30px; width:30px; height:30px; }
}

.sd-title {
  flex:1;
  .sd-name { font-size:1.2rem; font-weight:700; margin-bottom:5px; }
  .sd-type { display:flex; align-items:center; gap:5px; font-size:0.85rem; opacity:0.9;
    mat-icon { font-size:15px; width:15px; height:15px; } }
}

.sd-close { position:absolute; top:10px; right:10px; color:white; }

mat-dialog-content { padding:16px !important; }

.sd-info-grid { display:flex; flex-direction:column; gap:10px; margin-bottom:16px; }

.sd-info-item {
  display:flex; align-items:flex-start; gap:12px;
  padding:12px; background:var(--mat-sys-surface-container); border-radius:10px;
  mat-icon { color:#7b1fa2; margin-top:2px; flex-shrink:0; }
  .si-label { font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--mat-sys-on-surface-variant); }
  .si-val { font-size:0.9rem; font-weight:500; color:var(--mat-sys-on-surface); margin-top:2px; }
}

.sd-area-section {
  .sd-area-title {
    display:flex; align-items:center; gap:6px; font-size:0.85rem; font-weight:700;
    color:#7b1fa2; margin:0 0 10px; text-transform:uppercase; letter-spacing:0.5px;
    mat-icon { font-size:16px; width:16px; height:16px; }
  }
  .sd-area-card {
    background:var(--mat-sys-surface-container); border-radius:10px; padding:12px;
    border-left:4px solid #7b1fa2;
    .sac-name { font-size:0.95rem; font-weight:700; color:var(--mat-sys-on-surface); }
    .sac-desc { font-size:0.82rem; color:var(--mat-sys-on-surface-variant); margin-top:4px; }
  }
}

mat-dialog-actions { padding:14px !important; display:flex; justify-content:flex-end; border-top:1px solid var(--mat-sys-outline-variant); }
  `]
})
export class SiteDetailDialogComponent {
  site: any;

  constructor(
    public dialogRef: MDR2<SiteDetailDialogComponent>,
    @Inj2(MDD2) public data: any
  ) {
    this.site = data.site;
  }

  close(): void { this.dialogRef.close(); }
}