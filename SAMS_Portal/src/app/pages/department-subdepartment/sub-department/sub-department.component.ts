import { Component, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { ListConfig, ListWidgetComponent, SelectionActionEvent } from '../../../shared/widgets/common/list-widget/list-widget.component';
import { SubDepartmentDto } from '../../../core/models/interfaces/department.interface';
import { SubDepartmentService } from '../../../core/services/department/sub-department/sub-department.service';
import { PopupWidgetService } from '../../../core/services/popup-widget/popup-widget.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { Validators } from '@angular/forms';
import { PopupField } from '../../../core/models/interfaces/popup-widget.interface';
import { forkJoin } from 'rxjs';
import { DepartmentService } from '../../../core/services/department/department.service';

interface DropdownOption {
  value: any;
  label: string;
  disabled?: boolean;
}

interface DropdownData {
  departments: DropdownOption[];
  subDepartments: DropdownOption[];
}

@Component({
  selector: 'app-sub-department',
  imports: [
    PageHeaderComponent,
    ListWidgetComponent
  ],
  templateUrl: './sub-department.component.html',
  styleUrl: './sub-department.component.scss'
})
export class SubDepartmentComponent implements OnInit {
  private subDepartmentService = inject(SubDepartmentService);
  private departmentService = inject(DepartmentService);
  private popupService = inject(PopupWidgetService);
  private globalSevice = inject(GlobalService);

  subDepartments = signal<SubDepartmentDto[]>([]);
  loading = signal(false);
  dropdownData = signal<DropdownData>({
    departments: [],
    subDepartments: []
  });

  listConfig: ListConfig = {
    title: 'Sub Departments',
    showSearch: true,
    showRefresh: true,
    showDownload: true,
    showAdd: true,
    addButtonLabel: 'Add Sub Department',
    selectable: true,
    compactMode: false, // Set to true for compact layout
    showSelectionActions: true, // Enable bulk actions
    rowClickAction: 'view', // Enable row click to view details
    pageSize: 5,
    pageSizeOptions: [5, 10, 25, 50, 100],
    exportFileName: 'sub-departments_export',
    emptyMessage: 'No sub departments found. Click "Add Sub Department" to create one.',
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
        label: 'Sub Department Name',
        sortable: true,
        type: 'text',
        width: '200px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'departmentDisplay',
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
        color: 'primary',
        tooltip: 'Edit department'
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        tooltip: 'Delete department'
      }
    ]
  };


  ngOnInit() {
    this.loadDropdownData();
    this.loadSubDepartments();
  }

  private loadDropdownData() {
    forkJoin({
      departments: this.departmentService.getDepartments()
    }).subscribe({
      next: (responses) => {
        this.dropdownData.update(current => ({
          ...current,
          departments: responses.departments.data?.map(d => ({
            value: d.id,
            label: d.name
          })) ?? []
        }));
      },
      error: (error) => {
        console.error('Error loading dropdown data:', error);
        this.globalSevice.showToastr('Failed to load form data', 'error');
      }
    });
  }


  private getSubDepartmentFields(): PopupField[] {
    const dropdowns = this.dropdownData();
    return [
      {
        key: 'departmentId',
        label: 'Department Name',
        type: 'select',
        required: true,
        colSpan: 1,
        icon: 'domain',
        placeholder: 'Select department',
        options: dropdowns.departments
      },
      {
        key: 'name',
        label: 'Sub Department Name',
        type: 'text',
        required: true,
        colSpan: 1,
        icon: 'layers',
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


  private loadSubDepartments() {
    this.loading.set(true);
    // Simulate API call
    this.subDepartmentService.getSubDepartments().subscribe({
      next: (response) => {
        if (!response.success) {
          this.globalSevice.showToastr('Failed to load sub departments.', 'error')
          this.loading.set(false);
          return;
        }
        this.subDepartments.set(response.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching sub departments:', err);
        this.globalSevice.showToastr('Failed to load sub departments.', 'error')
        this.loading.set(false);
      }
    })
  }


  // Handle row clicks (opens detail view)
  onRowClick(event: { action: string; item: SubDepartmentDto }) {
    console.log("row clicked")
    if (event.action === 'view') {
      this.viewSubDepartment(event.item);
    }
  }

  // Handle bulk selection actions
  onSelectionAction(event: SelectionActionEvent) {
    switch (event.action) {
      case 'delete':
        this.deleteMultipleSubDepartments(event.selectedItems);
        break;
      case 'export':
        this.exportSelectedSubDepartments(event.selectedItems);
        break;
      default:
        console.log('Unknown selection action:', event.action);
    }
  }

  deleteMultipleSubDepartments(selectedSubDepartment: SubDepartmentDto[]) {
    const count = selectedSubDepartment.length;
    const names = selectedSubDepartment.slice(0, 3).map(e => e.name).join(', ');
    const message = count <= 3 ?
      `Are you sure you want to delete ${names}?` :
      `Are you sure you want to delete ${names} and ${count - 3} other sub departments?`;

    this.popupService.openDeleteConfirmation(
      message,
      `This will permanently delete ${count} sub department record${count > 1 ? 's' : ''}.`
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleBulkDelete(selectedSubDepartment);
      }
    });
  }

  handleBulkDelete(selectedSubDepartments: SubDepartmentDto[]) {
    const idsToDelete = selectedSubDepartments.map(sub => sub.id);
    idsToDelete.forEach(id => this.handleDeleteSubDepartment(id));
    this.globalSevice.showSnackbar(
      `${selectedSubDepartments.length} sub departments deleted successfully`,
      'success'
    );
  }

  exportSelectedSubDepartments(selectedItems: SubDepartmentDto[]) {
    console.log(`Exporting ${selectedItems.length} selected sub departments`);
    // Custom export logic here - the widget will handle the actual export
    this.globalSevice.showSnackbar(`Exported ${selectedItems.length} sub departments`, 'success');
  }

  onActionClick(event: { action: string, item: SubDepartmentDto }) {
    const { action, item } = event;
    switch (event.action) {
      case 'view':
        this.viewSubDepartment(event.item);
        break;
      case 'edit':
        this.editSubDepartment(event.item);
        break;
      case 'delete':
        this.deleteSubDepartment(event.item);
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  onAddSubDepartment() {
    console.log('Opening Add Sub Department Dialog');
    // Implement add department logicf
    const fields = this.getSubDepartmentFields();

    this.popupService.openAddPopup('Add New Sub Department', fields, {
      subtitle: 'Enter sub department information below',
      icon: 'layers_add',
      columns: 1,
      maxWidth: '800px',
      compactMode: false
    }).subscribe(result => {
      if (result && result.action === 'submit') {
        this.handleAddSubDepartment(result.data);
      }
    });
  }

  handleAddSubDepartment(subDepartment: SubDepartmentDto) {
    this.loading.set(true);
    this.subDepartmentService.createSubDepartment(subDepartment).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.subDepartments.update(subDepartments => [...subDepartments, response.data!]);
          this.globalSevice.showSnackbar('Sub Department created successfully', 'success');
          this.loadSubDepartments();
        } else {
          this.globalSevice.showToastr(response.message || 'Failed to create sub department', 'error');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error creating sub department:', err);
        this.globalSevice.showToastr('Failed to create sub department', 'error');
        this.loading.set(false);
      }
    });
  }


  viewSubDepartment(subDepartment: SubDepartmentDto) {
    const fields = this.getSubDepartmentFields();
    this.popupService.openViewPopup2('Sub Department Details', fields, subDepartment, {
      subtitle: `Sub Department ID: ${subDepartment.id}`,
      icon: 'domain',
      columns: 2,
      maxWidth: '800px',
      maxHeight: '800px',
      showEditButton: false
    }
    ).subscribe(result => {
      if (result.action === 'edit') {
        result.data.id = subDepartment.id;
        this.handleEditSubDepartment(subDepartment.id, result.data);
      }
    });
  }

  editSubDepartment(subDepartment: SubDepartmentDto) {
    console.log('Editing Sub department:', subDepartment);
    // Implement edit logic

    const fields = this.getSubDepartmentFields();

    this.popupService.openEditPopup(
      'Edit Sub Department',
      fields,
      subDepartment,
      {
        subtitle: `Update information for ${subDepartment.name}`,
        icon: 'edit',
        columns: 1,
        maxWidth: '800px'
      }
    ).subscribe(result => {
      if (result && result.action === 'submit') {
        result.data.id = subDepartment.id;
        this.handleEditSubDepartment(subDepartment.id, result.data);
      }
    });
  }

  private handleEditSubDepartment(id: number, formData: any) {
    this.loading.set(true);
    this.subDepartmentService.updateSubDepartment(formData).subscribe({
      next: (response) => {
        if (response.data) {
          // ✅ Update local departments state
          this.subDepartments.update(subDepartments =>
            subDepartments.map(dep => dep.id === id ? response.data! : dep)
          );
          this.globalSevice.showSnackbar('Sub Department updated successfully', 'success');
        } else {
          this.globalSevice.showToastr('Update failed: No data returned', 'error');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error updating sub department:', err);
        this.globalSevice.showToastr('Failed to update sub department', 'error');
        this.loading.set(false);
      }
    });
  }

  deleteSubDepartment(subDepartment: SubDepartmentDto) {
     console.log('Deleting Sub department:', subDepartment);
    // Implement delete logic

    this.popupService.openDeleteConfirmation(
      `Are you sure you want to delete "${subDepartment.name}"?`,
      'This action cannot be undone. All associated data will be permanently removed.'
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleDeleteSubDepartment(subDepartment.id);
      }
    });
  }
  handleDeleteSubDepartment(id: number) {
    this.loading.set(true);
    this.subDepartmentService.deleteSubDepartment(id).subscribe({
      next: (response) => {
        this.subDepartments.update(department =>
          department.filter(d => d.id !== id)
        );
        this.globalSevice.showSnackbar('Sub Department deleted successfully', 'success');
        this.loading.set(false);
      },

      error: (err) => {
        console.error('Error deleting sub department:', err);
        this.globalSevice.showToastr('Failed to delete sub department', 'error');
        this.loading.set(false);
      }
    });
  }

  onRefresh() {
    this.loadSubDepartments();
  }

  onSelectionChange(selected: SubDepartmentDto[]) {
    console.log('Selected departments:', selected);
  }
}
