// ═══════════════════════════════════════════════════════════════════════════
// UserAndSiteDetailDialogs.component.ts
// Two standalone dialogs: UserDetailDialogComponent + SiteDetailDialogComponent
// ═══════════════════════════════════════════════════════════════════════════

import { Component, Inject } from '@angular/core';
import { CommonModule }      from '@angular/common';
import {
  MAT_DIALOG_DATA, MatDialogModule, MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule }  from '@angular/material/button';
import { MatIconModule }    from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule }   from '@angular/material/chips';
import { environment }      from '../../../../../environments/environment.development';

// ─────────────────────────────────────────────────────────────────────────────
// USER DETAIL DIALOG
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-user-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, MatChipsModule],
  template: `
<div class="ud-dialog">

  <!-- Header -->
  <div class="ud-header">
    <div class="ud-avatar">
      <img *ngIf="getImageUrl(user?.profilePicture)"
           [src]="getImageUrl(user?.profilePicture)"
           (error)="onImageError($event)" />
      <mat-icon *ngIf="!getImageUrl(user?.profilePicture)">person</mat-icon>
    </div>
    <div class="ud-title">
      <div class="ud-name">{{ user?.firstName }} {{ user?.lastName }}</div>
      <div class="ud-designation" *ngIf="user?.designationDisplay || user?.designation">
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

      <div class="ud-info-section">
        <div class="ud-section-title"><mat-icon>contact_mail</mat-icon> Contact</div>

        <div class="ud-info-item" *ngIf="user?.email">
          <div class="ui-icon-wrap"><mat-icon>email</mat-icon></div>
          <div>
            <div class="ui-label">Email</div>
            <div class="ui-val">{{ user?.email }}</div>
          </div>
        </div>

        <div class="ud-info-item" *ngIf="user?.phoneNumber">
          <div class="ui-icon-wrap"><mat-icon>phone</mat-icon></div>
          <div>
            <div class="ui-label">Phone</div>
            <div class="ui-val">{{ user?.phoneNumber }}</div>
          </div>
        </div>

        <div class="ud-info-item" *ngIf="user?.address">
          <div class="ui-icon-wrap"><mat-icon>home</mat-icon></div>
          <div>
            <div class="ui-label">Address</div>
            <div class="ui-val">{{ user?.address }}</div>
          </div>
        </div>

        <div class="ud-info-item" *ngIf="user?.country">
          <div class="ui-icon-wrap"><mat-icon>public</mat-icon></div>
          <div>
            <div class="ui-label">Country</div>
            <div class="ui-val">{{ user?.country }}</div>
          </div>
        </div>
      </div>

      <div class="ud-info-section">
        <div class="ud-section-title"><mat-icon>badge</mat-icon> Work Details</div>

        <div class="ud-info-item" *ngIf="user?.joiningDate">
          <div class="ui-icon-wrap"><mat-icon>calendar_today</mat-icon></div>
          <div>
            <div class="ui-label">Joining Date</div>
            <div class="ui-val">{{ formatDate(user?.joiningDate) }}</div>
          </div>
        </div>

        <div class="ud-info-item" *ngIf="user?.subDepartmentDisplay">
          <div class="ui-icon-wrap"><mat-icon>device_hub</mat-icon></div>
          <div>
            <div class="ui-label">Sub Department</div>
            <div class="ui-val">{{ user?.subDepartmentDisplay }}</div>
          </div>
        </div>

        <div class="ud-info-item" *ngIf="user?.siteDisplay">
          <div class="ui-icon-wrap site-icon"><mat-icon>location_city</mat-icon></div>
          <div>
            <div class="ui-label">Site / Branch</div>
            <div class="ui-val">{{ user?.siteDisplay }}</div>
          </div>
        </div>

        <div class="ud-info-item" *ngIf="user?.areaDisplay">
          <div class="ui-icon-wrap"><mat-icon>place</mat-icon></div>
          <div>
            <div class="ui-label">Area</div>
            <div class="ui-val">{{ user?.areaDisplay }}</div>
          </div>
        </div>

        <div class="ud-info-item" *ngIf="user?.roleIdDisplay">
          <div class="ui-icon-wrap role-icon"><mat-icon>admin_panel_settings</mat-icon></div>
          <div>
            <div class="ui-label">Role</div>
            <div class="ui-val">
              <span class="role-chip">{{ user?.roleIdDisplay }}</span>
            </div>
          </div>
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
.ud-dialog { display:flex; flex-direction:column; min-width:420px; }

.ud-header {
  display:flex; align-items:flex-start; gap:14px; padding:20px;
  background: linear-gradient(135deg,#1565c0 0%,#7b1fa2 100%);
  color:white; position:relative;
}

.ud-avatar {
  width:74px; height:74px; border-radius:50%; overflow:hidden; flex-shrink:0;
  background:rgba(255,255,255,.18); display:flex; align-items:center; justify-content:center;
  border:3px solid rgba(255,255,255,.3);
  img { width:100%; height:100%; object-fit:cover; }
  mat-icon { font-size:36px; width:36px; height:36px; color:rgba(255,255,255,.8); }
}

.ud-title {
  flex:1;
  .ud-name { font-size:1.15rem; font-weight:800; margin-bottom:4px; }
  .ud-designation { font-size:.84rem; opacity:.9; margin-bottom:3px; }
  .ud-dept { display:flex; align-items:center; gap:4px; font-size:.78rem; opacity:.8;
    mat-icon { font-size:13px; width:13px; height:13px; }
  }
}

.ud-close { position:absolute; top:10px; right:10px; color:white !important; }

mat-dialog-content { padding:14px !important; background: var(--mat-sys-surface-container-lowest); }

.ud-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

@media(max-width:520px) { .ud-info-grid { grid-template-columns:1fr; } }

.ud-info-section {
  display:flex; flex-direction:column; gap:8px;
  background: var(--mat-sys-surface-container-low);
  border-radius:10px; padding:12px;
  border:1px solid var(--mat-sys-outline-variant);
}

.ud-section-title {
  display:flex; align-items:center; gap:5px;
  font-size:.68rem; font-weight:800; text-transform:uppercase; letter-spacing:.5px;
  color:var(--mat-sys-primary); margin-bottom:4px;
  mat-icon { font-size:14px; width:14px; height:14px; }
}

.ud-info-item {
  display:flex; align-items:flex-start; gap:9px;
  padding:9px 10px; background:var(--mat-sys-surface); border-radius:8px;
  border:1px solid var(--mat-sys-outline-variant);
}

.ui-icon-wrap {
  width:32px; height:32px; border-radius:8px; flex-shrink:0;
  background: var(--mat-sys-primary-container);
  display:flex; align-items:center; justify-content:center;
  mat-icon { font-size:16px; width:16px; height:16px; color:var(--mat-sys-primary); }
  &.site-icon { background:rgba(123,31,162,.12); mat-icon { color:#7b1fa2; } }
  &.role-icon { background:rgba(56,142,60,.12); mat-icon { color:#2e7d32; } }
}

.ui-label { font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:var(--mat-sys-on-surface-variant); }
.ui-val   { font-size:.85rem; font-weight:500; color:var(--mat-sys-on-surface); margin-top:2px; }

.role-chip {
  display:inline-block; background:var(--mat-sys-secondary-container);
  color:var(--mat-sys-on-secondary-container); padding:2px 9px; border-radius:9px;
  font-size:.75rem; font-weight:700;
}

mat-dialog-actions { padding:12px 16px !important; border-top:1px solid var(--mat-sys-outline-variant); display:flex; justify-content:flex-end; background:var(--mat-sys-surface-container-low); }
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
    return `${environment.assetBaseUrl}/${path.startsWith('/') ? path.substring(1) : path}`;
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

// ─────────────────────────────────────────────────────────────────────────────
// SITE DETAIL DIALOG
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-site-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule],
  template: `
<div class="sd-dialog">

  <!-- Header -->
  <div class="sd-header">
    <div class="sd-icon-wrap">
      <mat-icon>location_city</mat-icon>
    </div>
    <div class="sd-title">
      <div class="sd-name">{{ site?.name || site?.siteName }}</div>
      <div class="sd-type" *ngIf="site?.typeDisplay || site?.siteType || site?.type">
        <mat-icon>business</mat-icon>
        {{ site?.typeDisplay || site?.siteType || (site?.type === 1 ? 'Site' : 'Branch') }}
      </div>
    </div>
    <button mat-icon-button class="sd-close" (click)="close()">
      <mat-icon>close</mat-icon>
    </button>
  </div>

  <mat-divider></mat-divider>

  <mat-dialog-content>
    <div class="sd-body">

      <!-- Main info cards -->
      <div class="sd-info-row">

        <div class="sd-info-item" *ngIf="site?.address || site?.siteAddress">
          <div class="si-icon-wrap"><mat-icon>home</mat-icon></div>
          <div>
            <div class="si-label">Address</div>
            <div class="si-val">{{ site?.address || site?.siteAddress }}</div>
          </div>
        </div>

        <div class="sd-info-item" *ngIf="site?.cityDisplay || site?.city || site?.cityName">
          <div class="si-icon-wrap city-icon"><mat-icon>location_on</mat-icon></div>
          <div>
            <div class="si-label">City</div>
            <div class="si-val">{{ site?.cityDisplay || site?.city || site?.cityName }}</div>
          </div>
        </div>

        <div class="sd-info-item" *ngIf="site?.description || site?.siteDescription">
          <div class="si-icon-wrap desc-icon"><mat-icon>description</mat-icon></div>
          <div>
            <div class="si-label">Description</div>
            <div class="si-val">{{ site?.description || site?.siteDescription }}</div>
          </div>
        </div>

      </div>

      <!-- Area section -->
      <div class="sd-area-section" *ngIf="site?.area">
        <div class="sd-area-header">
          <mat-icon>place</mat-icon> Area
        </div>
        <div class="sd-area-card">
          <div class="area-name">{{ site?.area?.areaName }}</div>
          <div class="area-desc" *ngIf="site?.area?.areaDescription">
            {{ site?.area?.areaDescription }}
          </div>
        </div>
      </div>

      <!-- Stats strip -->
      <div class="sd-stats-strip" *ngIf="site?.assetCount != null || site?.type != null">
        <div class="ss-item" *ngIf="site?.type != null">
          <mat-icon>business</mat-icon>
          <div>
            <div class="ss-val">{{ site?.type === 1 ? 'Site' : 'Branch' }}</div>
            <div class="ss-lbl">Type</div>
          </div>
        </div>
        <div class="ss-item" *ngIf="site?.assetCount != null">
          <mat-icon>inventory_2</mat-icon>
          <div>
            <div class="ss-val">{{ site?.assetCount }}</div>
            <div class="ss-lbl">Assets</div>
          </div>
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
.sd-dialog { display:flex; flex-direction:column; min-width:400px; }

.sd-header {
  display:flex; align-items:flex-start; gap:14px; padding:20px;
  background:linear-gradient(135deg,#6a1b9a 0%,#4527a0 100%);
  color:white; position:relative;
}

.sd-icon-wrap {
  width:60px; height:60px; border-radius:14px; flex-shrink:0;
  background:rgba(255,255,255,.18); display:flex; align-items:center; justify-content:center;
  border:1.5px solid rgba(255,255,255,.28);
  mat-icon { font-size:30px; width:30px; height:30px; }
}

.sd-title {
  flex:1;
  .sd-name { font-size:1.15rem; font-weight:800; margin-bottom:5px; }
  .sd-type { display:flex; align-items:center; gap:4px; font-size:.85rem; opacity:.9;
    mat-icon { font-size:14px; width:14px; height:14px; }
  }
}

.sd-close { position:absolute; top:10px; right:10px; color:white !important; }

mat-dialog-content { padding:14px !important; background:var(--mat-sys-surface-container-lowest); }

.sd-body { display:flex; flex-direction:column; gap:10px; }

.sd-info-row { display:flex; flex-direction:column; gap:8px; }

.sd-info-item {
  display:flex; align-items:flex-start; gap:10px;
  padding:11px 12px; background:var(--mat-sys-surface-container-low);
  border-radius:9px; border:1px solid var(--mat-sys-outline-variant);
}

.si-icon-wrap {
  width:34px; height:34px; border-radius:9px; flex-shrink:0;
  background:rgba(106,27,154,.12); display:flex; align-items:center; justify-content:center;
  mat-icon { font-size:17px; width:17px; height:17px; color:#7b1fa2; }
  &.city-icon { background:rgba(25,118,210,.1); mat-icon { color:#1565c0; } }
  &.desc-icon { background:rgba(56,142,60,.1);  mat-icon { color:#2e7d32; } }
}

.si-label { font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:var(--mat-sys-on-surface-variant); }
.si-val   { font-size:.87rem; font-weight:500; color:var(--mat-sys-on-surface); margin-top:2px; }

/* Area */
.sd-area-section {}
.sd-area-header {
  display:flex; align-items:center; gap:5px; font-size:.7rem; font-weight:800;
  text-transform:uppercase; letter-spacing:.5px; color:#7b1fa2; margin-bottom:7px;
  mat-icon { font-size:14px; width:14px; height:14px; }
}
.sd-area-card {
  background:var(--mat-sys-surface-container-low); border-radius:9px; padding:11px 13px;
  border-left:4px solid #7b1fa2; border:1px solid var(--mat-sys-outline-variant);
  border-left:4px solid #7b1fa2;
  .area-name { font-size:.9rem; font-weight:700; color:var(--mat-sys-on-surface); }
  .area-desc { font-size:.78rem; color:var(--mat-sys-on-surface-variant); margin-top:4px; }
}

/* Stats */
.sd-stats-strip {
  display:flex; gap:10px; padding:10px 12px;
  background:var(--mat-sys-surface-container-low); border-radius:9px;
  border:1px solid var(--mat-sys-outline-variant);
}
.ss-item {
  display:flex; align-items:center; gap:8px;
  mat-icon { font-size:20px; width:20px; height:20px; color:var(--mat-sys-primary); }
  .ss-val  { font-size:.95rem; font-weight:800; color:var(--mat-sys-on-surface); }
  .ss-lbl  { font-size:.62rem; font-weight:600; text-transform:uppercase; color:var(--mat-sys-on-surface-variant); }
}

mat-dialog-actions { padding:12px 16px !important; border-top:1px solid var(--mat-sys-outline-variant); display:flex; justify-content:flex-end; background:var(--mat-sys-surface-container-low); }
  `]
})
export class SiteDetailDialogComponent {
  site: any;

  constructor(
    public dialogRef: MatDialogRef<SiteDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.site = data.site;
  }

  close(): void { this.dialogRef.close(); }
}