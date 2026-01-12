import { Component, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/widgets/page-header/page-header.component';
import { ListConfig, ListWidgetComponent, SelectionActionEvent } from '../../../../shared/widgets/common/list-widget/list-widget.component';
import { AssetSubCategoriesService } from '../../../../core/services/asset-categories/asset-sub-categories/asset-sub-categories.service';
import { AssetCategoriesService } from '../../../../core/services/asset-categories/asset-categories.service';
import { PopupWidgetService } from '../../../../core/services/popup-widget/popup-widget.service';
import { GlobalService } from '../../../../core/services/global/global.service';
import { AssetSubCategory, AssetSubCategoryRequest } from '../../../../core/models/interfaces/asset-category/asset-sub-category.interface';
import { PopupField, QuickAddConfig } from '../../../../core/models/interfaces/popup-widget.interface';
import { Validators } from '@angular/forms';
import { map, tap } from 'rxjs';

interface DropdownOption {
  value: any;
  label: string;
  disabled?: boolean;
}

interface DropdownData {
  categories: DropdownOption[];
}
@Component({
  selector: 'app-asset-sub-category',
  imports: [
    PageHeaderComponent,
    ListWidgetComponent
  ],
  templateUrl: './asset-sub-category.component.html',
  styleUrl: './asset-sub-category.component.scss'
})
export class AssetSubCategoryComponent implements OnInit {
  private subCategoriesService = inject(AssetSubCategoriesService);
  private categoriesService = inject(AssetCategoriesService);
  private popupService = inject(PopupWidgetService);
  private globalService = inject(GlobalService);

  subCategories = signal<AssetSubCategory[]>([]);
  loading = signal(false);
  dropdownData = signal<DropdownData>({
    categories: []
  });

  listConfig: ListConfig = {
    title: 'Asset Sub Categories',
    showSearch: true,
    showRefresh: true,
    showDownload: true,
    showAdd: true,
    addButtonLabel: 'Add Sub Category',
    selectable: true,
    compactMode: false,
    showSelectionActions: true,
    rowClickAction: 'view',
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    maxVisibleRows: 5,
    exportFileName: 'asset-subcategories_export',
    emptyMessage: 'No asset sub categories found. Click "Add Sub Category" to create one.',
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
        label: 'Sub Category Name',
        sortable: true,
        type: 'text',
        width: '200px',
        align: 'left',
        visible: true,
        ellipsis: true,
        showIcon: true
      },
      {
        key: 'assetCategorieDisplay',
        label: 'Category',
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
        width: '350px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'createdDate',
        label: 'Created Date',
        sortable: true,
        type: 'date',
        width: '150px',
        align: 'left',
        visible: false
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
    this.loadDropdownData();
    this.loadSubCategories();
  }

  // 🔥 FIXED: Load dropdown data
  private loadDropdownData() {
    this.categoriesService.getCategoriesByOrg().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const categoryOptions = response.data.map(cat => ({
            value: cat.id,
            label: cat.name
          }));

          this.dropdownData.update(current => ({
            ...current,
            categories: categoryOptions
          }));

          console.log('✅ Categories loaded:', categoryOptions.length);
        }
      },
      error: (error) => {
        console.error('❌ Error loading categories:', error);
        this.globalService.showToastr('Failed to load categories', 'error');
      }
    });
  }

  // 🆕 NEW: Get Quick Add configuration for Category field
  private getCategoryQuickAddConfig(): QuickAddConfig {
    return {
      enabled: true,
      buttonLabel: 'Add New Category',
      buttonIcon: 'add_circle',
      popupTitle: 'Add New Asset Category',
      popupIcon: 'category',

      // Fields for the quick add category popup
      fields: [
        {
          key: 'name',
          label: 'Category Name',
          type: 'text',
          required: true,
          colSpan: 4,
          icon: 'category',
          placeholder: 'Enter category name',
          validators: [Validators.minLength(2), Validators.maxLength(100)]
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          required: false,
          colSpan: 4,
          icon: 'description',
          placeholder: 'Enter category description',
          rows: 3,
          validators: [Validators.maxLength(500)]
        }
      ],

      // Handler to save the new category
      onAdd: (categoryData) => {
        console.log('💾 Saving new category:', categoryData);
        return this.categoriesService.createCategory(categoryData).pipe(
          tap(response => {
            console.log('✅ Category created:', response);
          })
        );
      },

      // Refresh dropdown options after successful add
      // 🔥 FIXED: Refresh handler - This is the KEY fix
      refreshOptions: (response) => {
        console.log('🔄 Refreshing options after category add:', response);
        
        // Show success message
        const categoryName = response?.data?.name || response?.name || 'Category';
        this.globalService.showSnackbar(`"${categoryName}" added successfully!`, 'success');
        
        // 🔥 CRITICAL: Fetch fresh data from API
        return this.categoriesService.getCategoriesByOrg().pipe(
          map(apiResponse => {
            if (apiResponse.success && apiResponse.data) {
              const newOptions = apiResponse.data.map(cat => ({
                value: cat.id,
                label: cat.name
              }));
              
              console.log('✅ Fresh options loaded:', newOptions.length);
              
              // 🔥 CRITICAL: Update the component's dropdown data
              this.dropdownData.update(current => ({
                ...current,
                categories: newOptions
              }));
              
              return newOptions;
            }
            return [];
          }),
          tap(newOptions => {
            console.log('🎯 Options ready for dropdown:', newOptions);
          })
        );
      }
    };
  }

  private getSubCategoryFields(): PopupField[] {
    const dropdowns = this.dropdownData();
    return [
      {
        key: 'assetCategorieId',
        label: 'Category',
        type: 'select',
        required: true,
        colSpan: 2,
        icon: 'category',
        placeholder: 'Select category',
        options: dropdowns.categories,
        validators: [Validators.required],
        // 🆕 NEW: Enable Quick Add
        quickAdd: this.getCategoryQuickAddConfig()
      },
      {
        key: 'name',
        label: 'Sub Category Name',
        type: 'text',
        required: true,
        colSpan: 2,
        icon: 'label',
        placeholder: 'Enter sub category name',
        validators: [Validators.minLength(2), Validators.maxLength(100)]
      },
      {
        key: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        colSpan: 4,
        icon: 'description',
        placeholder: 'Enter sub category description (optional)',
        rows: 4,
        validators: [Validators.maxLength(500)]
      }
    ];
  }

  private loadSubCategories() {
    this.loading.set(true);

    this.subCategoriesService.getSubCategoriesByOrg().subscribe({
      next: (response) => {
        if (!response.success) {
          this.globalService.showToastr('Failed to load sub categories.', 'error');
          this.loading.set(false);
          return;
        }
        this.subCategories.set(response.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching sub categories:', err);
        this.globalService.showToastr('Failed to load sub categories.', 'error');
        this.loading.set(false);
      }
    });
  }

  onRowClick(event: { action: string; item: AssetSubCategory }) {
    if (event.action === 'view') {
      this.viewSubCategory(event.item);
    }
  }

  onSelectionAction(event: SelectionActionEvent) {
    switch (event.action) {
      case 'delete':
        this.deleteMultipleSubCategories(event.selectedItems);
        break;
      case 'export':
        this.exportSelectedSubCategories(event.selectedItems);
        break;
      default:
        console.log('Unknown selection action:', event.action);
    }
  }

  deleteMultipleSubCategories(selectedSubCategories: AssetSubCategory[]) {
    const count = selectedSubCategories.length;
    const names = selectedSubCategories.slice(0, 3).map(sc => sc.name).join(', ');
    const message = count <= 3
      ? `Are you sure you want to delete ${names}?`
      : `Are you sure you want to delete ${names} and ${count - 3} other sub categories?`;

    this.popupService.openDeleteConfirmation(
      message,
      `This will permanently delete ${count} sub category record${count > 1 ? 's' : ''}.`
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleBulkDelete(selectedSubCategories);
      }
    });
  }

  handleBulkDelete(selectedSubCategories: AssetSubCategory[]) {
    const idsToDelete = selectedSubCategories.map(sc => sc.id);
    let deletedCount = 0;
    let failedCount = 0;

    idsToDelete.forEach((id) => {
      this.subCategoriesService.deleteSubCategory(id).subscribe({
        next: () => {
          deletedCount++;
          if (deletedCount + failedCount === idsToDelete.length) {
            this.subCategories.update(scs => scs.filter(sc => !idsToDelete.includes(sc.id)));
            this.globalService.showSnackbar(
              `${deletedCount} sub categor${deletedCount > 1 ? 'ies' : 'y'} deleted successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
              deletedCount > 0 ? 'success' : 'error'
            );
          }
        },
        error: () => {
          failedCount++;
          if (deletedCount + failedCount === idsToDelete.length) {
            this.subCategories.update(scs => scs.filter(sc => !idsToDelete.includes(sc.id)));
            this.globalService.showSnackbar(
              `${deletedCount} sub categor${deletedCount > 1 ? 'ies' : 'y'} deleted${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
              deletedCount > 0 ? 'success' : 'error'
            );
          }
        }
      });
    });
  }

  exportSelectedSubCategories(selectedItems: AssetSubCategory[]) {
    console.log(`Exporting ${selectedItems.length} selected sub categories`);
    this.globalService.showSnackbar(`Exported ${selectedItems.length} sub categories`, 'success');
  }

  onActionClick(event: { action: string; item: AssetSubCategory }) {
    switch (event.action) {
      case 'view':
        this.viewSubCategory(event.item);
        break;
      case 'edit':
        this.editSubCategory(event.item);
        break;
      case 'delete':
        this.deleteSubCategory(event.item);
        break;
      default:
        console.log('Unknown action:', event.action);
    }
  }

  onAddSubCategory() {
    console.log('Opening Add Sub Category Dialog');
    const fields = this.getSubCategoryFields();

    this.popupService.openAddPopup('Add New Sub Category', fields, {
      subtitle: 'Enter sub category information below',
      icon: 'add_circle',
      columns: 2,
      maxWidth: '700px',
      compactMode: false
    }).subscribe(result => {
      if (result && result.action === 'submit') {
        this.handleAddSubCategory(result.data);
      }
    });
  }

  handleAddSubCategory(subCategoryData: AssetSubCategoryRequest) {
    this.loading.set(true);

    this.subCategoriesService.createSubCategory(subCategoryData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.globalService.showSnackbar('Sub category created successfully', 'success');
          this.loadSubCategories();
        } else {
          this.globalService.showToastr(response.message || 'Failed to create sub category', 'error');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error creating sub category:', err);
        this.globalService.showToastr('Failed to create sub category', 'error');
        this.loading.set(false);
      }
    });
  }

  viewSubCategory(subCategory: AssetSubCategory) {
    const fields = this.getSubCategoryFields();

    const viewData = {
      ...subCategory,
      assetCategorieId: subCategory.assetCategorieId
    };

    this.popupService.openViewPopup2('Sub Category Details', fields, viewData, {
      subtitle: `Sub Category ID: ${subCategory.id}`,
      icon: 'label',
      columns: 2,
      maxWidth: '700px',
      maxHeight: '600px',
      showEditButton: true
    }).subscribe(result => {
      if (result.action === 'edit') {
        this.editSubCategory(subCategory);
      }
    });
  }

  editSubCategory(subCategory: AssetSubCategory) {
    console.log('Editing sub category:', subCategory);
    const fields = this.getSubCategoryFields();

    const editData = {
      ...subCategory,
      assetCategorieId: subCategory.assetCategorieId
    };

    this.popupService.openEditPopup(
      'Edit Sub Category',
      fields,
      editData,
      {
        subtitle: `Update information for ${subCategory.name}`,
        icon: 'edit',
        columns: 2,
        maxWidth: '700px'
      }
    ).subscribe(result => {
      if (result && result.action === 'submit') {
        result.data.id = subCategory.id;
        this.handleEditSubCategory(subCategory.id, result.data);
      }
    });
  }

  private handleEditSubCategory(id: number, formData: AssetSubCategoryRequest) {
    this.loading.set(true);

    this.subCategoriesService.updateSubCategory(formData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.globalService.showSnackbar('Sub category updated successfully', 'success');
          this.loadSubCategories();
        } else {
          this.globalService.showToastr('Update failed: No data returned', 'error');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error updating sub category:', err);
        this.globalService.showToastr('Failed to update sub category', 'error');
        this.loading.set(false);
      }
    });
  }

  deleteSubCategory(subCategory: AssetSubCategory) {
    console.log('Deleting sub category:', subCategory);

    this.popupService.openDeleteConfirmation(
      `Are you sure you want to delete "${subCategory.name}"?`,
      'This action cannot be undone. All associated assets will be affected.'
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleDeleteSubCategory(subCategory.id);
      }
    });
  }

  handleDeleteSubCategory(id: number) {
    this.loading.set(true);
    this.subCategoriesService.deleteSubCategory(id).subscribe({
      next: (response) => {
        this.subCategories.update(scs =>
          scs.filter(sc => sc.id !== id)
        );
        this.globalService.showSnackbar('Sub category deleted successfully', 'success');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error deleting sub category:', err);
        this.globalService.showToastr('Failed to delete sub category', 'error');
        this.loading.set(false);
      }
    });
  }

  onRefresh() {
    this.loadSubCategories();
  }

  onSelectionChange(selected: AssetSubCategory[]) {
    console.log('Selected sub categories:', selected);
  }
}
