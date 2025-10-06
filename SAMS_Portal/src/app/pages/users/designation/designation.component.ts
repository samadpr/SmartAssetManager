import { Component, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { ListConfig, ListWidgetComponent, SelectionActionEvent } from '../../../shared/widgets/common/list-widget/list-widget.component';
import { CommonModule } from '@angular/common';
import { Designation } from '../../../core/models/interfaces/account/designation.model';
import { DesignationService } from '../../../core/services/Designation/designation.service';
import { ToastrService } from 'ngx-toastr';
import { PopupWidgetService } from '../../../core/services/popup-widget/popup-widget.service';
import { Validators } from '@angular/forms';
import { PopupField } from '../../../core/models/interfaces/popup-widget.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GlobalService } from '../../../core/services/global/global.service';

@Component({
  selector: 'app-designation',
  imports: [
    PageHeaderComponent,
    ListWidgetComponent,
    CommonModule
  ],
  templateUrl: './designation.component.html',
  styleUrl: './designation.component.scss'
})
export class DesignationComponent implements OnInit {
  private designationService = inject(DesignationService);
  private popupService = inject(PopupWidgetService);
  private globalSevice = inject(GlobalService);

  designations = signal<Designation[]>([]);
  loading = signal(false);

  listConfig: ListConfig = {
    title: 'Designations Management',
    showSearch: true,
    showRefresh: true,
    showDownload: true,
    showAdd: true,
    addButtonLabel: 'Add Designation',
    selectable: true,
    compactMode: false, // Set to true for compact layout
    showSelectionActions: true, // Enable bulk actions
    rowClickAction: 'view', // Enable row click to view details
    pageSize: 5,
    pageSizeOptions: [5, 10, 25, 50, 100],
    exportFileName: 'designations_export',
    emptyMessage: 'No designations found. Click "Add Designation" to create one.',
    columns: [
      {
        key: 'id',
        label: 'ID',
        sortable: true,
        type: 'number',
        width: '100px',
        align: 'left',
        visible: true
      },
      {
        key: 'name',
        label: 'Designation Name',
        sortable: true,
        type: 'text',
        width: '200px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'description',
        label: 'Description',
        sortable: false,
        type: 'text',
        width: '400px',
        align: 'left',
        visible: true
      }
    ],
    actions: [
      {
        key: 'edit',
        label: 'Edit',
        icon: 'edit',
        color: 'primary',
        tooltip: 'Edit designation'
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        tooltip: 'Delete designation'
      }
    ]
  };

  // Define form fields for designation
  private getDesignationFields(): PopupField[] {
    return [
      {
        key: 'name',
        label: 'Designation Name',
        type: 'text',
        required: true,
        colSpan: 2,
        icon: 'work',
        placeholder: 'Enter designation name',
        validators: [Validators.minLength(2), Validators.maxLength(100)]
      },
      {
        key: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        colSpan: 2,
        placeholder: 'Enter description',
        rows: 4,
        validators: [Validators.minLength(10), Validators.maxLength(500)]
      },
      // {
      //   key: 'department',
      //   label: 'Department',
      //   type: 'select',
      //   required: true,
      //   options: [
      //     { value: 'IT', label: 'Information Technology' },
      //     { value: 'HR', label: 'Human Resources' },
      //     { value: 'Finance', label: 'Finance' },
      //     { value: 'Marketing', label: 'Marketing' },
      //     { value: 'Sales', label: 'Sales' }
      //   ]
      // },
      // {
      //   key: 'isActive',
      //   label: 'Active Status',
      //   type: 'checkbox',
      //   value: true
      // }
    ];
  }

  ngOnInit() {
    this.loadDesignations();
  }

  private loadDesignations() {
    this.loading.set(true);
    // Simulate API call
    this.designationService.getDesignations().subscribe({
      next: (data) => {
        this.designations.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching designations:', err);
        this.globalSevice.showToastr('Failed to load designations.', 'error')
        this.loading.set(false);
      }
    })
  }

  onActionClick(event: { action: string, item: Designation }) {
    const { action, item } = event;
    switch (event.action) {
      case 'view':
        this.viewDesignation(event.item);
        break;
      case 'edit':
        this.editDesignation(event.item);
        break;
      case 'delete':
        this.deleteDesignation(event.item);
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  // Handle row clicks (opens detail view)
  onRowClick(event: { action: string; item: Designation }) {
    console.log("row clicked")
    if (event.action === 'view') {
      this.viewDesignation(event.item);
    }
  }


  // Handle bulk selection actions
  onSelectionAction(event: SelectionActionEvent) {
    switch (event.action) {
      case 'delete':
        this.deleteMultipleDesignations(event.selectedItems);
        break;
      case 'export':
        this.exportSelectedDesignations(event.selectedItems);
        break;
      default:
        console.log('Unknown selection action:', event.action);
    }
  }

  deleteMultipleDesignations(selectedDesignations: Designation[]) {
    const count = selectedDesignations.length;
    const names = selectedDesignations.slice(0, 3).map(e => e.name).join(', ');
    const message = count <= 3 ?
      `Are you sure you want to delete ${names}?` :
      `Are you sure you want to delete ${names} and ${count - 3} other Designations?`;

    this.popupService.openDeleteConfirmation(
      message,
      `This will permanently delete ${count} designation record${count > 1 ? 's' : ''}.`
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleBulkDelete(selectedDesignations);
      }
    });
  }

  private handleBulkDelete(selectedDesignations: Designation[]) {
    const idsToDelete = selectedDesignations.map(emp => emp.id);
    idsToDelete.forEach(id => this.handleDeleteDesignation(id));
    this.globalSevice.showSnackbar(
      `${selectedDesignations.length} designations deleted successfully`,
      'success'
    );
  }

  exportSelectedDesignations(selectedDesignations: Designation[]) {
    console.log(`Exporting ${selectedDesignations.length} selected designations`);
    // Custom export logic here - the widget will handle the actual export
    this.globalSevice.showSnackbar(`Exported ${selectedDesignations.length} designations`, 'success');
  }

  viewDesignation(designation: Designation) {
    const fields = this.getDesignationFields();
    this.popupService.openViewPopup2('Designation Details', fields, designation, {
      subtitle: `Designation ID: ${designation.id}`,
      icon: 'work',
      columns: 2,
      maxWidth: '800px',
      maxHeight: '800px',
      showEditButton: false
    }
    ).subscribe(result => {
      if (result.action === 'edit') {
        result.data.id = designation.id;
        this.handleEditDesignation(designation.id, result.data);
      }
    });
  }

  onAddDesignation() {
    console.log('Opening Add Designation Dialog');
    // Implement add designation logicf
    const fields = this.getDesignationFields();

    this.popupService.openAddPopup('Add New Designation', fields, {
      subtitle: 'Enter designation information below',
      icon: 'add_circle',
      columns: 1,
      maxWidth: '800px',
      compactMode: false
    }).subscribe(result => {
      if (result && result.action === 'submit') {
        this.handleAddDesignation(result.data);
      }
    });
  }
  private handleAddDesignation(formData: any) {
    this.loading.set(true);
    this.designationService.createDesignation(formData).subscribe({
      next: (newDesignation) => {
        this.designations.update(designations => [...designations, newDesignation]);
        this.globalSevice.showSnackbar('Designation created successfully', 'success');
        // this.toastr.success('Designation created successfully', 'Success');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error creating designation:', err);
        // this.toastr.error('Failed to create designation', 'Error');
        this.globalSevice.showToastr('Failed to create designation', 'error');
        this.loading.set(false);
      }
    });
  }

  private editDesignation(designation: Designation) {
    console.log('Editing designation:', designation);
    // Implement edit logic

    const fields = this.getDesignationFields();

    this.popupService.openEditPopup(
      'Edit Designation',
      fields,
      designation,
      {
        subtitle: `Update information for ${designation.name}`,
        icon: 'edit',
        columns: 1,
        maxWidth: '800px'
      }
    ).subscribe(result => {
      if (result && result.action === 'submit') {
        result.data.id = designation.id;
        this.handleEditDesignation(designation.id, result.data);
      }
    });
  }

  private handleEditDesignation(id: number, formData: any) {
    this.loading.set(true);
    this.designationService.updateDesignation(formData).subscribe({
      next: (updatedDesignation) => {
        this.designations.update(designations =>
          designations.map(d => d.id === id ? updatedDesignation : d)
        );
        this.globalSevice.showSnackbar('Designation updated successfully', 'success');
        // this.toastr.success('Designation updated successfully', 'Success');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error updating designation:', err);
        this.globalSevice.showToastr('Failed to update designation', 'error');
        this.loading.set(false);
      }
    });
  }

  private deleteDesignation(designation: Designation) {
    console.log('Deleting designation:', designation);
    // Implement delete logic

    this.popupService.openDeleteConfirmation(
      `Are you sure you want to delete "${designation.name}"?`,
      'This action cannot be undone. All associated data will be permanently removed.'
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleDeleteDesignation(designation.id);
      }
    });
  }

  private handleDeleteDesignation(id: number) {
    this.loading.set(true);
    this.designationService.deleteDesignation(id).subscribe({
      next: () => {
        this.designations.update(designations =>
          designations.filter(d => d.id !== id)
        );
        this.globalSevice.showSnackbar('Designation deleted successfully', 'success');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error deleting designation:', err);
        this.globalSevice.showToastr('Failed to delete designation', 'error');
        this.loading.set(false);
      }
    });
  }

  onRefresh() {
    this.loadDesignations();
  }

  onSelectionChange(selected: Designation[]) {
    console.log('Selected designations:', selected);
  }
}
