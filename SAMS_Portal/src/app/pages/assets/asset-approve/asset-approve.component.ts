import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { ListWidgetComponent } from '../../../shared/widgets/common/list-widget/list-widget.component';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { ManageAssetsService } from '../../../core/services/asset/manage-assets.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { PopupWidgetService } from '../../../core/services/popup-widget/popup-widget.service';
import { AssetApprovalListItem } from '../../../core/models/interfaces/asset-manage/assets.interface';
import { AssetType, AssignToType } from '../../../core/enum/asset.enums';
import { PopupField } from '../../../core/models/interfaces/popup-widget.interface';
import { FileUrlHelper } from '../../../core/helper/get-file-url';

@Component({
  selector: 'app-asset-approve',
  imports: [
    CommonModule,
    PageHeaderComponent,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatRippleModule
  ],
  templateUrl: './asset-approve.component.html',
  styleUrl: './asset-approve.component.scss',
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class AssetApproveComponent implements OnInit {
  private assetService = inject(ManageAssetsService);
  private globalService = inject(GlobalService);
  private popupService = inject(PopupWidgetService);

  // State Management
  loading = signal(false);
  allApprovals = signal<AssetApprovalListItem[]>([]);
  selectedItems = signal<Set<number>>(new Set());
  selectedTabIndex = signal(0);

  // Computed Properties
  transferRequests = computed(() =>
    this.allApprovals().filter(a => a.assetType === AssetType.Transferred)
  );

  disposalRequests = computed(() =>
    this.allApprovals().filter(a => a.assetType === AssetType.Disposed)
  );

  selectedCount = computed(() => this.selectedItems().size);

  hasSelection = computed(() => this.selectedCount() > 0);

  selectedApprovals = computed(() => {
    const selected = this.selectedItems();
    return this.allApprovals().filter(a => selected.has(a.assignmentId));
  });

  // Enum Helpers
  readonly AssetType = AssetType;
  readonly AssignToType = AssignToType;

  ngOnInit(): void {
    this.loadApprovals();
  }

  private loadApprovals(): void {
    this.loading.set(true);
    this.assetService.getApprovalPendingList().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allApprovals.set(response.data);
        } else {
          this.globalService.showToastr('Failed to load approvals', 'error');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading approvals:', error);
        this.globalService.showToastr('Failed to load approvals', 'error');
        this.loading.set(false);
      }
    });
  }

  // Selection Management
  toggleSelection(assignmentId: number): void {
    const selected = new Set(this.selectedItems());

    if (selected.has(assignmentId)) {
      selected.delete(assignmentId);
    } else {
      selected.add(assignmentId);
    }

    this.selectedItems.set(selected);
  }

  isSelected(assignmentId: number): boolean {
    return this.selectedItems().has(assignmentId);
  }

  selectAll(items: AssetApprovalListItem[]): void {
    const selected = new Set(this.selectedItems());
    items.forEach(item => selected.add(item.assignmentId));
    this.selectedItems.set(selected);
  }

  clearSelection(): void {
    this.selectedItems.set(new Set());
  }

  // Card Click Handler
  onCardClick(item: AssetApprovalListItem, event: MouseEvent): void {
    // Prevent selection toggle when clicking action buttons
    if ((event.target as HTMLElement).closest('.card-actions')) {
      return;
    }
    this.viewDetails(item);
  }

  // View Asset Details
  viewDetails(item: AssetApprovalListItem): void {
    this.loading.set(true);
    this.assetService.getById(item.assetRowId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const fields = this.buildViewFields(item, response.data);

          this.popupService.openViewPopup2(
            'Asset Approval Details',
            fields,
            response.data,
            {
              subtitle: `${item.assetId} - ${this.getApprovalTypeLabel(item)}`,
              icon: item.assetType === AssetType.Disposed ? 'delete_forever' : 'swap_horiz',
              columns: 2,
              maxWidth: '1000px',
              maxHeight: '90vh',
              showEditButton: false
            }
          );
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading asset details:', error);
        this.globalService.showToastr('Failed to load asset details', 'error');
        this.loading.set(false);
      }
    });
  }

  private buildViewFields(item: AssetApprovalListItem, assetData: any): PopupField[] {
    const fields: PopupField[] = [
      // Request Information
      { key: 'divider_request', label: 'Request Information', type: 'divider', colSpan: 2 },
      {
        key: 'requestedBy',
        label: 'Requested By',
        type: 'info',
        value: item.requestedByName || item.requestedByEmail,
        icon: 'person',
        colSpan: 1
      },
      {
        key: 'requestedDate',
        label: 'Requested Date',
        type: 'info',
        value: new Date(item.requestedDate).toLocaleString(),
        icon: 'schedule',
        colSpan: 1
      },

      // Asset Basic Info
      { key: 'divider_asset', label: 'Asset Information', type: 'divider', colSpan: 2 },
      {
        key: 'assetId',
        label: 'Asset ID',
        type: 'info',
        value: item.assetId,
        icon: 'qr_code',
        colSpan: 1
      },
      {
        key: 'assetName',
        label: 'Asset Name',
        type: 'info',
        value: assetData.name,
        icon: 'inventory',
        colSpan: 1
      }
    ];

    // Transfer-specific fields
    if (item.assetType === AssetType.Transferred) {
      fields.push(
        { key: 'divider_transfer', label: 'Transfer Details', type: 'divider', colSpan: 2 },
        {
          key: 'assignType',
          label: 'Assign To Type',
          type: 'info',
          value: this.getAssignToLabel(item.assignTo),
          icon: 'category',
          colSpan: 2
        }
      );

      if (item.assignTo === AssignToType.User && item.assignUserName) {
        fields.push({
          key: 'assignUser',
          label: 'Assigned User',
          type: 'info',
          value: item.assignUserName,
          icon: 'person',
          colSpan: 2
        });
      }

      if (item.assignTo === AssignToType.Site) {
        if (item.siteName) {
          fields.push({
            key: 'site',
            label: 'Site',
            type: 'info',
            value: item.siteName,
            icon: 'location_city',
            colSpan: 1
          });
        }
        if (item.areaName) {
          fields.push({
            key: 'area',
            label: 'Area',
            type: 'info',
            value: item.areaName,
            icon: 'map',
            colSpan: 1
          });
        }
      }
    }

    // Disposal-specific fields
    if (item.assetType === AssetType.Disposed) {
      fields.push(
        { key: 'divider_disposal', label: 'Disposal Information', type: 'divider', colSpan: 2 },
        {
          key: 'disposalReason',
          label: 'Disposal Reason',
          type: 'info',
          value: 'Asset marked for disposal',
          icon: 'info',
          colSpan: 2
        }
      );
    }

    // Asset Image
    if (item.assetImageUrl) {
      fields.push(
        { key: 'divider_image', label: 'Asset Image', type: 'divider', colSpan: 2 },
        {
          key: 'assetImage',
          label: 'Asset Image',
          type: 'file',
          value: FileUrlHelper.getFullUrl(item.assetImageUrl),
          colSpan: 2,
          // filePreviewEnabled: true,
          downloadEnabled: true
        }
      );
    }

    return fields;
  }

  // Bulk Actions
  approveBulk(): void {
    const selected = this.selectedApprovals();

    if (selected.length === 0) {
      this.globalService.showToastr('No items selected', 'warning');
      return;
    }

    const message = selected.length === 1
      ? `Approve request for asset ${selected[0].assetId}?`
      : `Approve ${selected.length} asset requests?`;

    this.popupService.openGenericConfirmation(
      'Approve Requests',
      message,
      {
        confirmButtonText: 'Approve',
        confirmButtonColor: 'primary',
        confirmButtonIcon: 'check_circle',
        icon: 'check_circle',
        iconColor: 'primary'
      }
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.processBulkApproval(selected);
      }
    });
  }

  rejectBulk(): void {
    const selected = this.selectedApprovals();

    if (selected.length === 0) {
      this.globalService.showToastr('No items selected', 'warning');
      return;
    }

    const message = selected.length === 1
      ? `Reject request for asset ${selected[0].assetId}?`
      : `Reject ${selected.length} asset requests?`;

    this.popupService.openGenericConfirmation(
      'Reject Requests',
      message,
      {
        confirmButtonText: 'Reject',
        confirmButtonColor: 'warn',
        confirmButtonIcon: 'cancel',
        icon: 'cancel',
        iconColor: 'warn'
      }
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.processBulkRejection(selected);
      }
    });
  }

  private processBulkApproval(items: AssetApprovalListItem[]): void {
    this.loading.set(true);
    let completed = 0;
    let failed = 0;

    items.forEach(item => {
      this.assetService.approveAsset({
        assetId: item.assetRowId,
        assignmentId: item.assignmentId
      }).subscribe({
        next: (response) => {
          if (response.success) {
            completed++;
          } else {
            failed++;
          }

          if (completed + failed === items.length) {
            this.handleBulkActionComplete(completed, failed, 'approved');
          }
        },
        error: () => {
          failed++;
          if (completed + failed === items.length) {
            this.handleBulkActionComplete(completed, failed, 'approved');
          }
        }
      });
    });
  }

  private processBulkRejection(items: AssetApprovalListItem[]): void {
    this.loading.set(true);
    let completed = 0;
    let failed = 0;

    items.forEach(item => {
      this.assetService.rejectAsset({
        assetId: item.assetRowId,
        assignmentId: item.assignmentId
      }).subscribe({
        next: (response) => {
          if (response.success) {
            completed++;
          } else {
            failed++;
          }

          if (completed + failed === items.length) {
            this.handleBulkActionComplete(completed, failed, 'rejected');
          }
        },
        error: () => {
          failed++;
          if (completed + failed === items.length) {
            this.handleBulkActionComplete(completed, failed, 'rejected');
          }
        }
      });
    });
  }

  private handleBulkActionComplete(completed: number, failed: number, action: string): void {
    this.loading.set(false);
    this.clearSelection();
    this.loadApprovals();

    if (failed === 0) {
      this.globalService.showSnackbar(
        `Successfully ${action} ${completed} request${completed > 1 ? 's' : ''}`,
        'success'
      );
    } else {
      this.globalService.showToastr(
        `${completed} ${action}, ${failed} failed`,
        completed > failed ? 'warning' : 'error'
      );
    }
  }

  // Single Item Actions
  approveSingle(item: AssetApprovalListItem, event: MouseEvent): void {
    event.stopPropagation();

    this.popupService.openGenericConfirmation(
      'Approve Request',
      `Approve ${this.getApprovalTypeLabel(item).toLowerCase()} request for asset ${item.assetId}?`,
      {
        confirmButtonText: 'Approve',
        confirmButtonColor: 'primary',
        confirmButtonIcon: 'check_circle',
        icon: 'check_circle',
        iconColor: 'primary'
      }
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.processSingleApproval(item);
      }
    });
  }

  rejectSingle(item: AssetApprovalListItem, event: MouseEvent): void {
    event.stopPropagation();

    this.popupService.openGenericConfirmation(
      'Reject Request',
      `Reject ${this.getApprovalTypeLabel(item).toLowerCase()} request for asset ${item.assetId}?`,
      {
        confirmButtonText: 'Reject',
        confirmButtonColor: 'warn',
        confirmButtonIcon: 'cancel',
        icon: 'cancel',
        iconColor: 'warn'
      }
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.processSingleRejection(item);
      }
    });
  }

  private processSingleApproval(item: AssetApprovalListItem): void {
    this.loading.set(true);
    this.assetService.approveAsset({
      assetId: item.assetRowId,
      assignmentId: item.assignmentId
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.globalService.showSnackbar('Request approved successfully', 'success');
          this.loadApprovals();
        } else {
          this.globalService.showToastr('Failed to approve request', 'error');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error approving request:', error);
        this.globalService.showToastr('Failed to approve request', 'error');
        this.loading.set(false);
      }
    });
  }

  private processSingleRejection(item: AssetApprovalListItem): void {
    this.loading.set(true);
    this.assetService.rejectAsset({
      assetId: item.assetRowId,
      assignmentId: item.assignmentId
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.globalService.showSnackbar('Request rejected successfully', 'success');
          this.loadApprovals();
        } else {
          this.globalService.showToastr('Failed to reject request', 'error');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error rejecting request:', error);
        this.globalService.showToastr('Failed to reject request', 'error');
        this.loading.set(false);
      }
    });
  }

  // UI Helpers
  getApprovalTypeLabel(item: AssetApprovalListItem): string {
    return item.assetType === AssetType.Transferred ? 'Transfer' : 'Disposal';
  }

  getAssignToLabel(assignTo: AssignToType): string {
    switch (assignTo) {
      case AssignToType.User: return 'User';
      case AssignToType.Site: return 'Site';
      case AssignToType.Disposed: return 'Disposed';
      default: return 'Not Assigned';
    }
  }

  getProfileImage(item: AssetApprovalListItem, type: 'requester' | 'assignee'): string {
    if (type === 'requester') {
      return item.requestedByProfilePicture || '/assets/images/ProfilePic.png';
    } else {
      return item.assignProfilePicture || '/assets/images/ProfilePic.png';
    }
  }

  getAssetImage(item: AssetApprovalListItem): string {
    return item.assetImageUrl
      ? FileUrlHelper.getFullUrl(item.assetImageUrl)
      : '/assets/images/asset-placeholder.png';
  }

  onRefresh(): void {
    this.clearSelection();
    this.loadApprovals();
  }

  areAllTransferSelected(): boolean {
    const list = this.transferRequests();
    return list.length > 0 && list.every(i => this.isSelected(i.assignmentId));
  }

  areAllDisposalSelected(): boolean {
    const list = this.disposalRequests();
    return list.length > 0 && list.every(i => this.isSelected(i.assignmentId));
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.src = '/assets/images/ProfilePic.png';
    }
  }

  trackByAssignmentId(index: number, item: AssetApprovalListItem): number {
    return item.assignmentId;
  }
}
