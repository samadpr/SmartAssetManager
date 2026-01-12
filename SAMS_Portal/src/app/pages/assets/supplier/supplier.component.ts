import { Component, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { ListConfig, ListWidgetComponent, SelectionActionEvent } from '../../../shared/widgets/common/list-widget/list-widget.component';
import { SuppliersService } from '../../../core/services/supplier/suppliers.service';
import { PopupWidgetService } from '../../../core/services/popup-widget/popup-widget.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { Supplier, SupplierCreateRequest, SupplierUpdateRequest } from '../../../core/models/interfaces/asset-manage/supplier.interface';
import { PopupField } from '../../../core/models/interfaces/popup-widget.interface';
import { Validators } from '@angular/forms';
import { FileUrlHelper } from '../../../core/helper/get-file-url';

@Component({
  selector: 'app-supplier',
  imports: [
    PageHeaderComponent,
    ListWidgetComponent
  ],
  templateUrl: './supplier.component.html',
  styleUrl: './supplier.component.scss'
})
export class SupplierComponent implements OnInit {
  private suppliersService = inject(SuppliersService);
  private popupService = inject(PopupWidgetService);
  private globalService = inject(GlobalService);

  suppliers = signal<Supplier[]>([]);
  loading = signal(false);

  listConfig: ListConfig = {
    title: 'Suppliers',
    showSearch: true,
    showRefresh: true,
    showDownload: true,
    showAdd: true,
    addButtonLabel: 'Add Supplier',
    selectable: true,
    compactMode: false,
    showSelectionActions: true,
    rowClickAction: 'view',
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    maxVisibleRows: 5,
    exportFileName: 'suppliers_export',
    emptyMessage: 'No suppliers found. Click "Add Supplier" to create one.',
    columns: [
      {
        key: 'id',
        label: 'ID',
        sortable: true,
        type: 'number',
        width: '100px',
        align: 'left',
        visible: false
      },
      {
        key: 'name',
        label: 'Supplier Name',
        sortable: true,
        type: 'text',
        width: '200px',
        align: 'left',
        visible: true,
        ellipsis: true,
        showIcon: true
      },
      {
        key: 'contactPerson',
        label: 'Contact Person',
        sortable: true,
        type: 'text',
        width: '180px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'email',
        label: 'Email',
        sortable: true,
        type: 'email',
        width: '220px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'phone',
        label: 'Phone',
        sortable: true,
        type: 'phone',
        width: '150px',
        align: 'left',
        visible: true
      },
      {
        key: 'tradeLicense',
        label: 'Trade License',
        sortable: false,
        type: 'file', // 🆕 Changed to 'file' type
        width: '180px',
        align: 'left',
        visible: true,
        // ellipsis: true,
        filePreviewEnabled: true, // 🆕 Enable preview
        fileDownloadEnabled: true, // 🆕 Enable download
        fileTypeIcon: true // 🆕 Show file type icon
      },
      {
        key: 'address',
        label: 'Address',
        sortable: false,
        type: 'address',
        width: '250px',
        align: 'left',
        visible: true,
        ellipsis: true
      }
    ],
    actions: [
      {
        key: 'edit',
        label: 'Edit',
        icon: 'edit',
        buttonType: 'icon',
        color: 'primary',
        tooltip: 'Edit asset',
        position: 'end' // Default position
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: 'delete',
        buttonType: 'icon',
        color: 'warn',
        tooltip: 'Delete asset',
        position: 'end'
      }
    ]
  };

  ngOnInit() {
    this.loadSuppliers();
  }

  private getSupplierFields(): PopupField[] {
    return [
      {
        key: 'name',
        label: 'Supplier Name',
        type: 'text',
        required: true,
        colSpan: 2,
        icon: 'business',
        placeholder: 'Enter supplier name',
        validators: [Validators.minLength(2), Validators.maxLength(100)]
      },
      {
        key: 'contactPerson',
        label: 'Contact Person',
        type: 'text',
        required: true,
        colSpan: 2,
        icon: 'person',
        placeholder: 'Enter contact person name',
        validators: [Validators.minLength(2), Validators.maxLength(100)]
      },
      // 🔥 ENHANCED FILE FIELD WITH PREVIEW
      {
        key: 'tradeLicense',
        label: 'Trade License Document',
        type: 'file',
        required: false,
        colSpan: 4, // Full width
        icon: 'upload_file',
        placeholder: 'Upload trade license',
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
        key: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        colSpan: 2,
        icon: 'email',
        placeholder: 'Enter email address',
        validators: [Validators.email]
      },
      {
        key: 'phone',
        label: 'Phone',
        type: 'text',
        required: true,
        colSpan: 2,
        icon: 'phone',
        placeholder: 'Enter phone number',
        validators: [Validators.pattern(/^[0-9+\-\s()]+$/)]
      },
      {
        key: 'address',
        label: 'Address',
        type: 'textarea',
        required: false,
        colSpan: 4,
        icon: 'location_on',
        placeholder: 'Enter supplier address (optional)',
        rows: 3,
        validators: [Validators.maxLength(500)]
      }
    ];
  }

  private loadSuppliers() {
    this.loading.set(true);

    this.suppliersService.getSuppliersByOrg().subscribe({
      next: (response) => {
        if (!response.success) {
          this.globalService.showToastr('Failed to load suppliers.', 'error');
          this.loading.set(false);
          return;
        }
        const mappedSuppliers = response.data?.map(s => {
          const fullUrl = s.tradeLicense && typeof s.tradeLicense === 'string'
            ? FileUrlHelper.getFullUrl(s.tradeLicense)
            : s.tradeLicense;

          // 🔍 DEBUG
          console.log('📁 Mapped Supplier:', {
            name: s.name,
            tradeLicense: fullUrl
          });

          return {
            ...s,
            tradeLicense: fullUrl
          };
        }) ?? [];

        this.suppliers.set(mappedSuppliers);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching suppliers:', err);
        this.globalService.showToastr('Failed to load suppliers.', 'error');
        this.loading.set(false);
      }
    });
  }

  onRowClick(event: { action: string; item: Supplier }) {
    if (event.action === 'view') {
      this.viewSupplier(event.item);
    }
  }

  onSelectionAction(event: SelectionActionEvent) {
    switch (event.action) {
      case 'delete':
        this.deleteMultipleSuppliers(event.selectedItems);
        break;
      case 'export':
        this.exportSelectedSuppliers(event.selectedItems);
        break;
      default:
        console.log('Unknown selection action:', event.action);
    }
  }

  deleteMultipleSuppliers(selectedSuppliers: Supplier[]) {
    const count = selectedSuppliers.length;
    const names = selectedSuppliers.slice(0, 3).map(s => s.name).join(', ');
    const message = count <= 3
      ? `Are you sure you want to delete ${names}?`
      : `Are you sure you want to delete ${names} and ${count - 3} other suppliers?`;

    this.popupService.openDeleteConfirmation(
      message,
      `This will permanently delete ${count} supplier record${count > 1 ? 's' : ''}.`
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleBulkDelete(selectedSuppliers);
      }
    });
  }

  handleBulkDelete(selectedSuppliers: Supplier[]) {
    const idsToDelete = selectedSuppliers.map(s => s.id!);
    let deletedCount = 0;
    let failedCount = 0;

    idsToDelete.forEach((id) => {
      this.suppliersService.deleteSupplier(id).subscribe({
        next: () => {
          deletedCount++;
          if (deletedCount + failedCount === idsToDelete.length) {
            this.suppliers.update(suppliers => suppliers.filter(s => !idsToDelete.includes(s.id!)));
            this.globalService.showSnackbar(
              `${deletedCount} supplier${deletedCount > 1 ? 's' : ''} deleted successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
              deletedCount > 0 ? 'success' : 'error'
            );
          }
        },
        error: () => {
          failedCount++;
          if (deletedCount + failedCount === idsToDelete.length) {
            this.suppliers.update(suppliers => suppliers.filter(s => !idsToDelete.includes(s.id!)));
            this.globalService.showSnackbar(
              `${deletedCount} supplier${deletedCount > 1 ? 's' : ''} deleted${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
              deletedCount > 0 ? 'success' : 'error'
            );
          }
        }
      });
    });
  }

  exportSelectedSuppliers(selectedItems: Supplier[]) {
    console.log(`Exporting ${selectedItems.length} selected suppliers`);
    this.globalService.showSnackbar(`Exported ${selectedItems.length} suppliers`, 'success');
  }

  onActionClick(event: { action: string; item: Supplier }) {
    switch (event.action) {
      case 'view':
        this.viewSupplier(event.item);
        break;
      case 'edit':
        this.editSupplier(event.item);
        break;
      case 'delete':
        this.deleteSupplier(event.item);
        break;
      default:
        console.log('Unknown action:', event.action);
    }
  }

  onAddSupplier() {
    console.log('Opening Add Supplier Dialog');
    const fields = this.getSupplierFields();

    this.popupService.openAddPopup('Add New Supplier', fields, {
      subtitle: 'Enter supplier information below',
      icon: 'add_circle',
      columns: 2,
      maxWidth: '700px',
      compactMode: false
    }).subscribe(result => {
      if (result && result.action === 'submit') {
        this.handleAddSupplier(result.data);
      }
    });
  }

  handleAddSupplier(supplierData: Supplier) {

    const payload: SupplierCreateRequest = {
      name: supplierData.name ?? "",
      contactPerson: supplierData.contactPerson ?? "",
      email: supplierData.email ?? "",
      phone: supplierData.phone ?? "",
      address: supplierData.address ?? "",
      tradeLicense: supplierData.tradeLicense instanceof File
        ? supplierData.tradeLicense
        : null
    };

    this.loading.set(true);

    this.suppliersService.createSupplier(payload).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.globalService.showSnackbar('Supplier created successfully', 'success');
          this.loadSuppliers();
        } else {
          this.globalService.showToastr(response.message || 'Failed to create supplier', 'error');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error creating supplier:', err);
        this.globalService.showToastr('Failed to create supplier', 'error');
        this.loading.set(false);
      }
    });
  }

  viewSupplier(supplier: Supplier) {
    const fields = this.getSupplierFields();

    // Ensure file URL is properly formatted
    const viewData = {
      ...supplier,
      tradeLicense: supplier.tradeLicense && typeof supplier.tradeLicense === 'string'
        ? supplier.tradeLicense // Already has full URL from loadSuppliers()
        : supplier.tradeLicense
    };

    // 🔍 DEBUG: Verify data structure
    console.log('📄 View Supplier Data:', {
      id: viewData.id,
      name: viewData.name,
      tradeLicense: viewData.tradeLicense,
      tradeLicenseType: typeof viewData.tradeLicense,
      isFile: viewData.tradeLicense instanceof File,
      isValidUrl: viewData.tradeLicense && typeof viewData.tradeLicense === 'string'
    });

    this.popupService.openViewPopup2('Supplier Details', fields, viewData, {
      subtitle: `Viewing supplier: ${supplier.name}`,
      icon: 'business',
      columns: 2,
      maxWidth: '900px', // Wider for better file preview
      maxHeight: '90vh',
      showEditButton: true,
      compactMode: false
      // disableClose: true,
      // fieldBorderStyle: 'outline' // 🆕 Use outline style
    }).subscribe(result => {
      if (!result) return; // SAFE
      if (result.action === 'edit') {
        this.editSupplier(supplier);
      }
    });
  }

  editSupplier(supplier: Supplier) {
    console.log('Editing supplier:', supplier);
    const fields = this.getSupplierFields();

    this.popupService.openEditPopup(
      'Edit Supplier',
      fields,
      supplier,
      {
        subtitle: `Update information for ${supplier.name}`,
        icon: 'edit',
        columns: 2,
        maxWidth: '700px'
      }
    ).subscribe(result => {
      if (result && result.action === 'submit') {
        result.data.id = supplier.id;
        this.handleEditSupplier(supplier.id!, result.data);
      }
    });
  }

  private handleEditSupplier(id: number, formData: Supplier) {
    this.loading.set(true);

    const payload: SupplierUpdateRequest = {
      id: formData.id!,
      name: formData.name ?? "",
      contactPerson: formData.contactPerson ?? "",
      email: formData.email ?? "",
      phone: formData.phone ?? "",
      address: formData.address ?? "",
      tradeLicense: formData.tradeLicense instanceof File ? formData.tradeLicense : null
    };

    this.suppliersService.updateSupplier(payload).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.globalService.showSnackbar('Supplier updated successfully', 'success');
          this.loadSuppliers();
        } else {
          this.globalService.showToastr('Update failed: No data returned', 'error');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error updating supplier:', err);
        this.globalService.showToastr('Failed to update supplier', 'error');
        this.loading.set(false);
      }
    });
  }

  deleteSupplier(supplier: Supplier) {
    console.log('Deleting supplier:', supplier);

    this.popupService.openDeleteConfirmation(
      `Are you sure you want to delete "${supplier.name}"?`,
      'This action cannot be undone. All associated purchase orders will be affected.'
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleDeleteSupplier(supplier.id!);
      }
    });
  }

  handleDeleteSupplier(id: number) {
    this.loading.set(true);
    this.suppliersService.deleteSupplier(id).subscribe({
      next: (response) => {
        this.suppliers.update(suppliers =>
          suppliers.filter(s => s.id !== id)
        );
        this.globalService.showSnackbar('Supplier deleted successfully', 'success');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error deleting supplier:', err);
        this.globalService.showToastr('Failed to delete supplier', 'error');
        this.loading.set(false);
      }
    });
  }

  onRefresh() {
    this.loadSuppliers();
  }

  onSelectionChange(selected: Supplier[]) {
    console.log('Selected suppliers:', selected);
  }
}
