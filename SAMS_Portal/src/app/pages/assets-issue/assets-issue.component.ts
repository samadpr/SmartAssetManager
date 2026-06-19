import { Component, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../shared/widgets/page-header/page-header.component';
import { ListConfig, ListWidgetComponent, SelectionActionEvent } from '../../shared/widgets/common/list-widget/list-widget.component';
import { AssetIssue, AssetIssueDetails } from '../../core/models/interfaces/asset-manage/asset-issue.interface';
import { AssetIssueStatus } from '../../core/enum/asset.enums';
import { AssetIssueService } from '../../core/services/asset/asset-issues/asset-issue.service';
import { GlobalService } from '../../core/services/global/global.service';
import { PopupWidgetService } from '../../core/services/popup-widget/popup-widget.service';
import { PopupField } from '../../core/models/interfaces/popup-widget.interface';
import { Validators } from '@angular/forms';
import { FileUrlHelper } from '../../core/helper/get-file-url';

// Extend AssetIssueDetails locally for display-only fields we add during mapping
interface AssetIssueRow extends AssetIssueDetails {
  statusLabel: string;   // human-readable status
  invoiceUrl: string;   // full URL for the file column
}

@Component({
  selector: 'app-assets-issue',
  imports: [
    PageHeaderComponent,
    ListWidgetComponent
  ],
  templateUrl: './assets-issue.component.html',
  styleUrl: './assets-issue.component.scss'
})
export class AssetsIssueComponent implements OnInit {

  private issueService = inject(AssetIssueService);
  private popupService = inject(PopupWidgetService);
  private globalService = inject(GlobalService);

  issues = signal<AssetIssueRow[]>([]);
  loading = signal(false);

  // ─── Status options ───────────────────────────────────────────────
  private readonly statusOptions = [
    { value: AssetIssueStatus.New, label: 'New' },
    { value: AssetIssueStatus.InProgress, label: 'In Progress' },
    { value: AssetIssueStatus.Resolved, label: 'Resolved' },
    { value: AssetIssueStatus.Blocker, label: 'Blocker' },
    { value: AssetIssueStatus.Pending, label: 'Pending' },
    { value: AssetIssueStatus.Hold, label: 'Hold' },
    { value: AssetIssueStatus.Rejected, label: 'Rejected' },
    { value: AssetIssueStatus.Accepted, label: 'Accepted' },
    { value: AssetIssueStatus.Closed, label: 'Closed' }
  ];

  private readonly statusLabelMap = new Map<number, string>(
    this.statusOptions.map(o => [o.value, o.label])
  );

  // ─── List Config — follows department pattern exactly ─────────────
  listConfig: ListConfig = {
    title: 'Asset Tickets',
    showSearch: true,
    showRefresh: true,
    showDownload: true,
    showAdd: false,
    addButtonLabel: 'Report Issue',
    selectable: true,
    compactMode: false,
    showSelectionActions: true,
    rowClickAction: 'view',
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    maxVisibleRows: 6,
    exportFileName: 'asset_issues_export',
    emptyMessage: 'No asset issues found.',

    columns: [
      {
        key: 'id',
        label: 'ID',
        sortable: true,
        type: 'number',
        width: '70px',
        align: 'center',
        visible: true
      },
      {
        key: 'assetName',
        label: 'Asset',
        sortable: true,
        type: 'text',
        width: '200px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'issueTitle',
        label: 'Issue Title',
        sortable: true,
        type: 'text',
        width: '260px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'issueDescription',
        label: 'Issue Description',
        sortable: false,
        type: 'text',
        width: '260px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'statusLabel',
        label: 'Status',
        sortable: true,
        type: 'text',
        width: '130px',
        align: 'center',
        visible: true
      },
      {
        key: 'raisedByUserName',
        label: 'Raised By',
        sortable: true,
        type: 'text',
        width: '160px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'repairCost',
        label: 'Repair Cost',
        sortable: true,
        type: 'currency',
        width: '130px',
        align: 'right',
        visible: true
      },
      {
        key: 'expectedFixDate',
        label: 'Expected Fix Date',
        sortable: true,
        type: 'date',
        width: '150px',
        align: 'center',
        visible: true
      },
      {
        key: 'createdDate',
        label: 'Created At',
        sortable: true,
        type: 'date',
        width: '130px',
        align: 'center',
        visible: false
      },
      {
        key: 'invoiceUrl',
        label: 'Invoice / Document',
        type: 'file',
        width: '160px',
        visible: true,
        filePreviewEnabled: true,
        fileDownloadEnabled: true,
        fileTypeIcon: true
      }
    ],

    // ✅ NO position, NO inline popup config — exactly like department pattern
    actions: [
      {
        key: 'edit',
        label: 'Edit',
        icon: 'edit',
        buttonType: 'icon',
        color: 'primary',
        tooltip: 'Edit Issue'
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: 'delete',
        buttonType: 'icon',
        color: 'warn',
        tooltip: 'Delete Issue'
      }
    ]
  };

  // ─── Lifecycle ────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadIssues();
  }

  // ─── Data Loading ─────────────────────────────────────────────────
  private loadIssues(): void {
    this.loading.set(true);
    this.issueService.getByOrg().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const mapped: AssetIssueRow[] = response.data.map(issue => ({
            ...issue,
            statusLabel: this.statusLabelMap.get(issue.status ?? 0) ?? String(issue.status),
            invoiceUrl: issue.invoice
              ? FileUrlHelper.getFullUrl(issue.invoice)
              : ''
          }));
          this.issues.set(mapped);
        } else {
          this.issues.set([]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading issues:', err);
        this.globalService.showToastr('Failed to load asset issues', 'error');
        this.loading.set(false);
      }
    });
  }

  // ─── Form Fields ──────────────────────────────────────────────────
  private getIssueFormFields(): PopupField[] {
    return [
      {
        key: 'divider_issue',
        label: 'Issue Information',
        type: 'divider',
        colSpan: 4
      },
      {
        key: 'issueTitle',
        label: 'Issue Title',
        type: 'text',
        required: true,
        placeholder: 'Enter issue title here...',
        colSpan: 4,
        icon: 'title',
        validators: [Validators.minLength(2), Validators.maxLength(100)]
      },
      {
        key: 'issueDescription',
        label: 'Issue Description',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the issue in detail...',
        colSpan: 4,
        rows: 4,
        icon: 'description',
        validators: [Validators.minLength(10), Validators.maxLength(1000)]
      },
      {
        key: 'status',
        label: 'Issue Status',
        type: 'select',
        required: true,
        colSpan: 2,
        icon: 'flag',
        options: this.statusOptions
      },
      {
        key: 'expectedFixDate',
        label: 'Expected Fix Date',
        type: 'date',
        colSpan: 2,
        icon: 'event'
      },
      {
        key: 'repairCost',
        label: 'Estimated Repair Cost',
        type: 'number',
        placeholder: '0.00',
        colSpan: 2,
        icon: 'attach_money',
        min: 0
      },
      {
        key: 'divider_files',
        label: 'Supporting Documents',
        type: 'divider',
        colSpan: 4
      },
      {
        key: 'invoice',
        label: 'Attach Document / Invoice',
        type: 'file',
        colSpan: 4,
        icon: 'attach_file',
        acceptedFileTypes: '.pdf,.jpg,.jpeg,.png',
        maxFileSize: 10,
        helperText: 'PDF or Image (Max 10MB)'
      },
      {
        key: 'divider_comment',
        label: 'Additional Comments',
        type: 'divider',
        colSpan: 4
      },
      {
        key: 'comment',
        label: 'Comment',
        type: 'textarea',
        placeholder: 'Any additional notes or comments...',
        colSpan: 4,
        rows: 3,
        icon: 'comment'
      }
    ];
  }

  // ─── Add (Report Issue) ───────────────────────────────────────────
  onAddIssue(): void {
    const fields = this.getIssueFormFields();

    this.popupService.openAddPopup('Report New Issue', fields, {
      subtitle: 'Raise a new maintenance or issue report',
      icon: 'bug_report',
      columns: 2,
      maxWidth: '860px',
      submitButtonText: 'Submit Issue'
    }).subscribe(result => {
      if (result && result.action === 'submit') {
        this.handleCreateIssue(result.data);
      }
    });
  }

  private handleCreateIssue(formData: any): void {
    const issueRequest: AssetIssue = {
      assetId: formData.assetId ?? 0,
      raisedByUserId: 0,
      issueTitle: formData.issueTitle,
      issueDescription: formData.issueDescription,
      status: formData.status ?? AssetIssueStatus.New,
      expectedFixDate: formData.expectedFixDate,
      repairCost: formData.repairCost,
      comment: formData.comment
    };

    if (formData.InvoiceFile instanceof File) {
      issueRequest.invoiceFile = formData.InvoiceFile;
    }

    this.loading.set(true);
    this.issueService.create(issueRequest).subscribe({
      next: (response) => {
        if (response?.success !== false) {
          this.globalService.showSnackbar('Issue reported successfully', 'success');
          this.loadIssues();
        } else {
          this.globalService.showToastr('Failed to report issue', 'error');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error creating issue:', err);
        this.globalService.showToastr('Failed to report issue', 'error');
        this.loading.set(false);
      }
    });
  }

  // ─── Row Click → View ─────────────────────────────────────────────
  onRowClick(event: { action: string; item: AssetIssueRow }): void {
    if (event.action === 'view') {
      this.viewIssue(event.item);
    }
  }

  // ─── Action Router ────────────────────────────────────────────────
  onActionClick(event: { action: string; item: AssetIssueRow }): void {
    switch (event.action) {
      case 'view': this.viewIssue(event.item); break;
      case 'edit': this.editIssue(event.item); break;
      case 'delete': this.deleteIssue(event.item); break;
      default: console.log('Unknown action:', event.action);
    }
  }

  // ─── View ─────────────────────────────────────────────────────────
  viewIssue(issue: AssetIssueRow): void {
    const fields: PopupField[] = [
      {
        key: 'divider_system',
        label: 'System Information',
        type: 'divider',
        colSpan: 4
      },
      {
        key: 'id',
        label: 'Issue ID',
        type: 'info',
        value: issue.id,
        colSpan: 2,
        icon: 'tag'
      },
      {
        key: 'assetName',
        label: 'Asset',
        type: 'info',
        value: issue.assetName,
        colSpan: 2,
        icon: 'inventory'
      },

      {
        key: 'divider_issue',
        label: 'Issue Information',
        type: 'divider',
        colSpan: 4
      },
      {
        key: 'issueTitle',
        label: 'Issue Title',
        type: 'info',
        value: issue.issueTitle,
        colSpan: 4,
        icon: 'title'
      },
      {
        key: 'issueDescription',
        label: 'Issue Description',
        type: 'info',
        value: issue.issueDescription,
        colSpan: 4,
        icon: 'description'
      },
      {
        key: 'statusLabel',
        label: 'Status',
        type: 'info',
        value: issue.statusLabel,
        colSpan: 2, icon: 'flag'
      },
      {
        key: 'raisedByUserName',
        label: 'Raised By',
        type: 'info',
        value: issue.raisedByUserName,
        colSpan: 2,
        icon: 'person'
      },
      {
        key: 'repairCost',
        label: 'Repair Cost',
        type: 'info',
        value: issue.repairCost != null ? `$${issue.repairCost}` : 'N/A',
        colSpan: 2,
        icon: 'attach_money'
      },
      {
        key: 'expectedFixDate',
        label: 'Expected Fix Date',
        type: 'info',
        value: issue.expectedFixDate ? new Date(issue.expectedFixDate).toLocaleDateString() : 'Not set',
        colSpan: 2,
        icon: 'event'
      },

      {
        key: 'divider_comment',
        label: 'Document / Invoice',
        type: 'divider',
        colSpan: 4
      },
      // 🔥 ENHANCED FILE FIELD WITH PREVIEW
      {
        key: 'invoiceUrl',
        label: 'Invoice / Document',
        type: 'file',
        required: false,
        colSpan: 4, // Full width
        icon: 'upload_file',
        placeholder: 'Upload invoice or document related to the issue',
        acceptedFileTypes: '.pdf,.jpg,.jpeg,.png',
        maxFileSize: 5, // MB
        helperText: 'PDF, JPG, PNG (Max 5MB)',

        // 🆕 Preview settings
        showFilePreview: true,
        previewWidth: '50%',
        previewHeight: 'auto',
        showFileName: true,
        showFileSize: true,
        downloadEnabled: true
      },

      { 
        key: 'divider_comment', 
        label: 'Comments', 
        type: 'divider', 
        colSpan: 4 
      },
      { 
        key: 'comment', 
        label: 'Comment', 
        type: 'info', 
        value: issue.comment || 'No comments', 
        colSpan: 4, 
        icon: 'comment' 
      }
    ];

    this.popupService.openViewPopup2('Asset Issue Details', fields, issue, {
      subtitle: `Issue #${issue.id} — ${issue.assetName}`,
      icon: 'bug_report',
      columns: 4,
      maxWidth: '900px',
      maxHeight: '90vh',
      showEditButton: true,
      editButtonText: 'Edit Issue'
    }).subscribe(result => {
      if (result?.action === 'edit') {
        this.editIssue(issue);
      }
    });
  }

  // ─── Edit ─────────────────────────────────────────────────────────
  editIssue(issue: AssetIssueRow): void {
    const fields = this.getIssueFormFields();

    this.popupService.openEditPopup(
      'Edit Asset Issue',
      fields,
      issue,
      {
        subtitle: `Update issue for ${issue.assetName}`,
        icon: 'edit',
        columns: 2,
        maxWidth: '860px',
        maxHeight: '90vh',
        submitButtonText: 'Update Issue'
      }
    ).subscribe(result => {
      if (result && result.action === 'submit') {
        result.data.id = issue.id;
        this.handleEditIssue(issue, result.data);
      }
    });
  }

  private handleEditIssue(issue: AssetIssueRow, formData: any): void {
    const updateRequest: AssetIssue = {
      id: issue.id,
      assetId: issue.assetId,
      // raisedByUserId:   issue.raisedByUserId,
      issueTitle: formData.issueTitle,
      issueDescription: formData.issueDescription,
      status: formData.status,
      expectedFixDate: formData.expectedFixDate,
      repairCost: formData.repairCost,
      comment: formData.comment,
    };

    if (formData.InvoiceFile instanceof File) {
      updateRequest.invoiceFile = formData.InvoiceFile;
    }

    this.loading.set(true);
    this.issueService.update(updateRequest).subscribe({
      next: (response) => {
        if (response?.success !== false) {
          this.globalService.showSnackbar('Issue updated successfully', 'success');
          this.loadIssues();
        } else {
          this.globalService.showToastr('Failed to update issue', 'error');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error updating issue:', err);
        this.globalService.showToastr('Failed to update issue', 'error');
        this.loading.set(false);
      }
    });
  }

  // ─── Delete ───────────────────────────────────────────────────────
  deleteIssue(issue: AssetIssueRow): void {
    this.popupService.openDeleteConfirmation(
      `Delete issue for "${issue.assetName}"?`,
      'This action cannot be undone. The issue record will be permanently removed.'
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleDeleteIssue(issue.id);
      }
    });
  }

  private handleDeleteIssue(id: number): void {
    this.loading.set(true);
    this.issueService.delete(id).subscribe({
      next: (response) => {
        if (response?.success !== false) {
          this.issues.update(list => list.filter(i => i.id !== id));
          this.globalService.showSnackbar('Issue deleted successfully', 'success');
        } else {
          this.globalService.showToastr('Failed to delete issue', 'error');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error deleting issue:', err);
        this.globalService.showToastr('Failed to delete issue', 'error');
        this.loading.set(false);
      }
    });
  }

  // ─── Bulk Selection ───────────────────────────────────────────────
  onSelectionAction(event: SelectionActionEvent): void {
    switch (event.action) {
      case 'delete':
        this.deleteMultipleIssues(event.selectedItems as AssetIssueRow[]);
        break;
      case 'export':
        this.globalService.showSnackbar(
          `Exported ${event.selectedItems.length} issues`, 'success'
        );
        break;
    }
  }

  deleteMultipleIssues(items: AssetIssueRow[]): void {
    const count = items.length;
    const names = items.slice(0, 3).map(i => `"${i.assetName}"`).join(', ');
    const message = count <= 3
      ? `Delete issues for: ${names}?`
      : `Delete issues for ${names} and ${count - 3} more?`;

    this.popupService.openDeleteConfirmation(
      message,
      `This will permanently delete ${count} issue record${count > 1 ? 's' : ''}.`
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleBulkDelete(items);
      }
    });
  }

  private handleBulkDelete(items: AssetIssueRow[]): void {
    const ids = items.map(i => i.id);
    let done = 0;
    let failed = 0;

    ids.forEach(id => {
      this.issueService.delete(id).subscribe({
        next: () => {
          done++;
          if (done + failed === ids.length) {
            this.issues.update(list => list.filter(i => !ids.includes(i.id)));
            this.globalService.showSnackbar(
              `${done} issue${done > 1 ? 's' : ''} deleted successfully`, 'success'
            );
          }
        },
        error: () => {
          failed++;
          if (done + failed === ids.length) {
            this.issues.update(list => list.filter(i => !ids.includes(i.id)));
            this.globalService.showToastr(
              `${done} deleted, ${failed} failed`,
              failed > done ? 'error' : 'warning'
            );
          }
        }
      });
    });
  }

  // ─── Misc ─────────────────────────────────────────────────────────
  onRefresh(): void { this.loadIssues(); }

  onSelectionChange(selected: AssetIssueRow[]): void {
    console.log('Selected issues:', selected.length);
  }
}
