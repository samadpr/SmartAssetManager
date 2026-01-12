import { Component, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { ListConfig, ListWidgetComponent, SelectionActionEvent } from '../../../shared/widgets/common/list-widget/list-widget.component';
import { Department } from '../../../core/models/interfaces/department.interface';
import { PopupWidgetService } from '../../../core/services/popup-widget/popup-widget.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { Validators } from '@angular/forms';
import { PopupField } from '../../../core/models/interfaces/popup-widget.interface';
import { DepartmentService } from '../../../core/services/department/department.service';

@Component({
  selector: 'app-department',
  imports: [
    PageHeaderComponent,
    ListWidgetComponent,
  ],
  templateUrl: './department.component.html',
  styleUrl: './department.component.scss'
})
export class DepartmentComponent implements OnInit {
  private departmentsService = inject(DepartmentService);
  private popupService = inject(PopupWidgetService);
  private globalSevice = inject(GlobalService);

  departments = signal<Department[]>([]);
  loading = signal(false);

  listConfig: ListConfig = {
    title: 'Departments',
    showSearch: true,
    showRefresh: true,
    showDownload: true,
    showAdd: true,
    addButtonLabel: 'Add Department',
    selectable: true,
    compactMode: false, // Set to true for compact layout
    showSelectionActions: true, // Enable bulk actions
    rowClickAction: 'view', // Enable row click to view details
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    maxVisibleRows: 5,
    exportFileName: 'departments_export',
    emptyMessage: 'No departments found. Click "Add Department" to create one.',
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
        label: 'Department Name',
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
        buttonType: 'icon',
        color: 'primary',
        tooltip: 'Edit asset',
        // position: 'end' // Default position
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: 'delete',
        buttonType: 'icon',
        color: 'warn',
        tooltip: 'Delete asset',
        // position: 'end'
      }
    ]
  };


  private getDepartmentFields(): PopupField[] {
    return [
      {
        key: 'name',
        label: 'Department Name',
        type: 'text',
        required: true,
        colSpan: 2,
        icon: 'domain',
        placeholder: 'Enter department name',
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
    ];
  }

  ngOnInit() {
    this.loadDepartments();
  }

  private loadDepartments() {
    this.loading.set(true);
    // Simulate API call
    this.departmentsService.getDepartments().subscribe({
      next: (response) => {
        if (!response.success) {
          this.globalSevice.showToastr('Failed to load departments.', 'error')
          this.loading.set(false);
          return;
        }
        this.departments.set(response.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching departments:', err);
        this.globalSevice.showToastr('Failed to load departments.', 'error')
        this.loading.set(false);
      }
    })
  }

  onAddDepartment() {
    console.log('Opening Add Department Dialog');
    // Implement add department logicf
    const fields = this.getDepartmentFields();

    this.popupService.openAddPopup('Add New Department', fields, {
      subtitle: 'Enter department information below',
      icon: 'domain_add',
      columns: 1,
      maxWidth: '800px',
      compactMode: false
    }).subscribe(result => {
      if (result && result.action === 'submit') {
        this.handleAddDepartment(result.data);
      }
    });
  }
  handleAddDepartment(formData: any) {
    this.loading.set(true);
    this.departmentsService.createDepartment(formData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.departments.update(departments => [...departments, response.data!]);
          this.globalSevice.showSnackbar('Department created successfully', 'success');
        } else {
          this.globalSevice.showToastr(response.message || 'Failed to create department', 'error');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error creating department:', err);
        this.globalSevice.showToastr('Failed to create department', 'error');
        this.loading.set(false);
      }
    });
  }

  // Handle row clicks (opens detail view)
  onRowClick(event: { action: string; item: Department }) {
    console.log("row clicked")
    if (event.action === 'view') {
      this.viewDepartment(event.item);
    }
  }

  // Handle bulk selection actions
  onSelectionAction(event: SelectionActionEvent) {
    switch (event.action) {
      case 'delete':
        this.deleteMultipleDepartments(event.selectedItems);
        break;
      case 'export':
        this.exportSelectedDepartments(event.selectedItems);
        break;
      default:
        console.log('Unknown selection action:', event.action);
    }
  }

  deleteMultipleDepartments(selectedDepartments: Department[]) {
    const count = selectedDepartments.length;
    const names = selectedDepartments.slice(0, 3).map(e => `"${e.name}"`).join(', ');
    const message = count <= 3
      ? `Delete ${names}?`
      : `Delete ${names} and ${count - 3} other departments?`;

    this.popupService.openDeleteConfirmation(
      message,
      `This action will permanently remove ${count} department record${count > 1 ? 's' : ''} 
     and their sub-departments. This cannot be undone.`
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleBulkDelete(selectedDepartments);
      }
    });
  }


  private handleBulkDelete(selectedDepartments: Department[]) {
    const idsToDelete = selectedDepartments.map(dep => dep.id);
    idsToDelete.forEach(id => this.handleDeleteDepartment(id));
    this.globalSevice.showSnackbar(
      `${selectedDepartments.length} departments deleted successfully`,
      'success'
    );
  }


  exportSelectedDepartments(selectedDepartments: Department[]) {
    console.log(`Exporting ${selectedDepartments.length} selected departments`);
    // Custom export logic here - the widget will handle the actual export
    this.globalSevice.showSnackbar(`Exported ${selectedDepartments.length} departments`, 'success');
  }

  onActionClick(event: { action: string, item: Department }) {
    const { action, item } = event;
    switch (event.action) {
      case 'view':
        this.viewDepartment(event.item);
        break;
      case 'edit':
        this.editDepartment(event.item);
        break;
      case 'delete':
        this.deleteDepartment(event.item);
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  viewDepartment(department: Department) {
    const fields = this.getDepartmentFields();
    this.popupService.openViewPopup2('Department Details', fields, department, {
      subtitle: `Department ID: ${department.id}`,
      icon: 'domain',
      columns: 2,
      maxWidth: '800px',
      maxHeight: '800px',
      showEditButton: false
    }
    ).subscribe(result => {
      if (result.action === 'edit') {
        result.data.id = department.id;
        this.handleEditDepartment(department.id, result.data);
      }
    });
  }



  editDepartment(department: Department) {
    console.log('Editing department:', department);
    // Implement edit logic

    const fields = this.getDepartmentFields();

    this.popupService.openEditPopup(
      'Edit Department',
      fields,
      department,
      {
        subtitle: `Update information for ${department.name}`,
        icon: 'edit',
        columns: 1,
        maxWidth: '800px'
      }
    ).subscribe(result => {
      if (result && result.action === 'submit') {
        result.data.id = department.id;
        this.handleEditDepartment(department.id, result.data);
      }
    });
  }

  private handleEditDepartment(id: number, formData: any) {
    this.loading.set(true);
    this.departmentsService.updateDepartment(formData).subscribe({
      next: (response) => {
        if (response.data) {
          // ✅ Update local departments state
          this.departments.update(departments =>
            departments.map(dep => dep.id === id ? response.data! : dep)
          );
          this.globalSevice.showSnackbar('Department updated successfully', 'success');
        } else {
          this.globalSevice.showToastr('Update failed: No data returned', 'error');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error updating department:', err);
        this.globalSevice.showToastr('Failed to update department', 'error');
        this.loading.set(false);
      }
    });
  }

  deleteDepartment(department: Department) {
    console.log('Deleting department:', department);
    // Implement delete logic

    this.popupService.openDeleteConfirmation(
      `Delete Department "${department.name}"?`,
      `This action will permanently remove "${department.name}" and all its sub-departments. 
     This cannot be undone.`
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleDeleteDepartment(department.id);
      }
    });
  }

  private handleDeleteDepartment(id: number) {
    this.loading.set(true);
    this.departmentsService.deleteDepartmentWithSubDepartments(id).subscribe({
      next: (response) => {
        this.departments.update(department =>
          department.filter(d => d.id !== id)
        );
        this.globalSevice.showSnackbar('Department deleted successfully', 'success');
        this.loading.set(false);
      },

      error: (err) => {
        console.error('Error deleting department:', err);
        this.globalSevice.showToastr('Failed to delete department', 'error');
        this.loading.set(false);
      }
    });
  }


  onRefresh() {
    this.loadDepartments();
  }

  onSelectionChange(selected: Department[]) {
    console.log('Selected departments:', selected);
  }
}
