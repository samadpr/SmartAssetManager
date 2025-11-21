import { Component, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/widgets/page-header/page-header.component';
import { AssetCategoriesService } from '../../../../core/services/asset-categories/asset-categories.service';
import { PopupWidgetService } from '../../../../core/services/popup-widget/popup-widget.service';
import { GlobalService } from '../../../../core/services/global/global.service';
import { AssetCategory, AssetCategoryRequest } from '../../../../core/models/interfaces/asset-category/asset-category.interface';
import { ListConfig, ListWidgetComponent, SelectionActionEvent } from '../../../../shared/widgets/common/list-widget/list-widget.component';
import { PopupField } from '../../../../core/models/interfaces/popup-widget.interface';
import { Validators } from '@angular/forms';
import { AssetSubCategoriesService } from '../../../../core/services/asset-categories/asset-sub-categories/asset-sub-categories.service';
import { AssetSubCategory } from '../../../../core/models/interfaces/asset-category/asset-sub-category.interface';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-asset-category',
  imports: [
    PageHeaderComponent,
    ListWidgetComponent
  ],
  templateUrl: './asset-category.component.html',
  styleUrl: './asset-category.component.scss'
})
export class AssetCategoryComponent implements OnInit {
    private categoriesService = inject(AssetCategoriesService);
  private popupService = inject(PopupWidgetService);
  private globalService = inject(GlobalService);
  private subCategoriesService = inject(AssetSubCategoriesService);

  categories = signal<AssetCategory[]>([]);
  loading = signal(false);

  listConfig: ListConfig = {
    title: 'Asset Categories',
    showSearch: true,
    showRefresh: true,
    showDownload: true,
    showAdd: true,
    addButtonLabel: 'Add Category',
    selectable: true,
    compactMode: false,
    showSelectionActions: true,
    rowClickAction: 'view',
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    maxVisibleRows: 5,
    exportFileName: 'asset-categories_export',
    emptyMessage: 'No asset categories found. Click "Add Category" to create one.',
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
        label: 'Category Name',
        sortable: true,
        type: 'text',
        width: '250px',
        align: 'left',
        visible: true,
        ellipsis: true,
        showIcon: true
      },
      {
        key: 'description',
        label: 'Description',
        sortable: false,
        type: 'text',
        width: '400px',
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
        color: 'primary',
        tooltip: 'Edit category'
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        tooltip: 'Delete category'
      }
    ]
  };

  ngOnInit() {
    this.loadCategories();
  }

  private getCategoryFields(): PopupField[] {
    return [
      {
        key: 'name',
        label: 'Category Name',
        type: 'text',
        required: true,
        colSpan: 2,
        icon: 'category',
        placeholder: 'Enter category name',
        validators: [Validators.minLength(2), Validators.maxLength(100)]
      },
      {
        key: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        colSpan: 2,
        icon: 'description',
        placeholder: 'Enter category description',
        rows: 4,
        validators: [Validators.maxLength(500)]
      }
    ];
  }

  private loadCategories() {
    this.loading.set(true);
    
    this.categoriesService.getCategoriesByOrg().subscribe({
      next: (response) => {
        if (!response.success) {
          this.globalService.showToastr('Failed to load categories.', 'error');
          this.loading.set(false);
          return;
        }
        this.categories.set(response.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
        this.globalService.showToastr('Failed to load categories.', 'error');
        this.loading.set(false);
      }
    });
  }

  onRowClick(event: { action: string; item: AssetCategory }) {
    if (event.action === 'view') {
      this.viewCategory(event.item);
    }
  }

  onSelectionAction(event: SelectionActionEvent) {
    switch (event.action) {
      case 'delete':
        this.deleteMultipleCategories(event.selectedItems);
        break;
      case 'export':
        this.exportSelectedCategories(event.selectedItems);
        break;
      default:
        console.log('Unknown selection action:', event.action);
    }
  }

  deleteMultipleCategories(selectedCategories: AssetCategory[]) {
    this.loading.set(true);
    
    // Fetch subcategories for all selected categories
    const subCategoryRequests = selectedCategories.map(cat =>
      this.subCategoriesService.getSubCategoriesByCategoryId(cat.id).pipe(
        catchError(() => of({ success: false, data: [] as AssetSubCategory[] }))
      )
    );

    forkJoin(subCategoryRequests).subscribe({
      next: (responses) => {
        this.loading.set(false);
        
        const allSubCategories: AssetSubCategory[] = [];
        responses.forEach(res => {
          if (res.success && res.data) allSubCategories.push(...res.data);
        });

        const count = selectedCategories.length;
        const subCount = allSubCategories.length;
        const names = selectedCategories.slice(0, 3).map(c => c.name).join(', ');
        
        let message = count <= 3
          ? `Are you sure you want to delete "${names}"?`
          : `Are you sure you want to delete "${names}" and ${count - 3} other categories?`;

        let warning = `This action cannot be undone.`;
        if (subCount > 0) {
          const subNames = allSubCategories.slice(0, 5).map(sc => sc.name).join(', ');
          warning = subCount <= 5
            ? `⚠️ This will also delete ${subCount} sub-categories: ${subNames}`
            : `⚠️ This will also delete ${subCount} sub-categories including: ${subNames} and ${subCount - 5} more.`;
        }

        this.popupService.openDeleteConfirmation(message, warning).subscribe(result => {
          if (result?.action === 'confirm') {
            this.handleBulkDeleteWithSubCategories(selectedCategories, allSubCategories);
          }
        });
      },
      error: () => {
        this.loading.set(false);
        this.globalService.showToastr('Failed to check dependent sub-categories', 'error');
      }
    });
  }

  private handleBulkDeleteWithSubCategories(categories: AssetCategory[], subCategories: AssetSubCategory[]) {
    this.loading.set(true);
    const totalOps = subCategories.length + categories.length;
    let completed = 0, failed = 0;

    const updateProgress = () => {
      completed++;
      if (completed + failed === totalOps) {
        this.loading.set(false);
        this.loadCategories();
        const msg = failed > 0
          ? `Deleted ${completed - failed} items, ${failed} failed`
          : `Successfully deleted ${categories.length} categories and ${subCategories.length} sub-categories`;
        this.globalService.showSnackbar(msg, failed > 0 ? 'error' : 'success');
      }
    };

    const handleError = () => { failed++; updateProgress(); };

    // Delete subcategories first, then categories
    if (subCategories.length > 0) {
      subCategories.forEach(sc => {
        this.subCategoriesService.deleteSubCategory(sc.id).subscribe({
          next: updateProgress,
          error: handleError
        });
      });
    }

    // Wait a bit for subcategories to be processed, then delete categories
    setTimeout(() => {
      categories.forEach(cat => {
        this.categoriesService.deleteCategory(cat.id).subscribe({
          next: updateProgress,
          error: handleError
        });
      });
    }, subCategories.length > 0 ? 500 : 0);
  }

 handleBulkDelete(selectedCategories: AssetCategory[]) {
    this.deleteMultipleCategories(selectedCategories);
  }

  exportSelectedCategories(selectedItems: AssetCategory[]) {
    this.globalService.showSnackbar(`Exported ${selectedItems.length} categories`, 'success');
  }

  onActionClick(event: { action: string; item: AssetCategory }) {
    switch (event.action) {
      case 'view': this.viewCategory(event.item); break;
      case 'edit': this.editCategory(event.item); break;
      case 'delete': this.deleteCategory(event.item); break;
    }
  }

  onAddCategory() {
    const fields = this.getCategoryFields();
    this.popupService.openAddPopup('Add New Category', fields, {
      subtitle: 'Enter category information below',
      icon: 'add_circle', columns: 2, maxWidth: '700px', compactMode: false
    }).subscribe(result => {
      if (result?.action === 'submit') this.handleAddCategory(result.data);
    });
  }

  handleAddCategory(categoryData: AssetCategoryRequest) {
    this.loading.set(true);
    this.categoriesService.createCategory(categoryData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.globalService.showSnackbar('Category created successfully', 'success');
          this.loadCategories();
        } else {
          this.globalService.showToastr(response.message || 'Failed to create category', 'error');
        }
        this.loading.set(false);
      },
      error: () => {
        this.globalService.showToastr('Failed to create category', 'error');
        this.loading.set(false);
      }
    });
  }

  viewCategory(category: AssetCategory) {
    const fields = this.getCategoryFields();
    this.popupService.openViewPopup2('Category Details', fields, category, {
      subtitle: `Category ID: ${category.id}`,
      icon: 'category', columns: 2, maxWidth: '700px', maxHeight: '600px', showEditButton: true
    }).subscribe(result => {
      if (result.action === 'edit') this.editCategory(category);
    });
  }

  editCategory(category: AssetCategory) {
    const fields = this.getCategoryFields();
    this.popupService.openEditPopup('Edit Category', fields, category, {
      subtitle: `Update information for ${category.name}`,
      icon: 'edit', columns: 2, maxWidth: '700px'
    }).subscribe(result => {
      if (result?.action === 'submit') {
        result.data.id = category.id;
        this.handleEditCategory(category.id, result.data);
      }
    });
  }

  private handleEditCategory(id: number, formData: AssetCategoryRequest) {
    this.loading.set(true);
    this.categoriesService.updateCategory(formData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.globalService.showSnackbar('Category updated successfully', 'success');
          this.loadCategories();
        } else {
          this.globalService.showToastr('Update failed: No data returned', 'error');
        }
        this.loading.set(false);
      },
      error: () => {
        this.globalService.showToastr('Failed to update category', 'error');
        this.loading.set(false);
      }
    });
  }

  deleteCategory(category: AssetCategory) {
    this.loading.set(true);

    // First, fetch dependent sub-categories
    this.subCategoriesService.getSubCategoriesByCategoryId(category.id).pipe(
      catchError(() => of({ success: false, data: [] as AssetSubCategory[] }))
    ).subscribe({
      next: (response) => {
        this.loading.set(false);
        const subCategories = response.success && response.data ? response.data : [];
        this.showDeleteConfirmation(category, subCategories);
      },
      error: () => {
        this.loading.set(false);
        // Show confirmation anyway without sub-category info
        this.showDeleteConfirmation(category, []);
      }
    });
  }

  private showDeleteConfirmation(category: AssetCategory, subCategories: AssetSubCategory[]) {
    const hasSubCategories = subCategories.length > 0;
    
    let message = `Are you sure you want to delete "${category.name}"?`;
    let warning = 'This action cannot be undone.';

    if (hasSubCategories) {
      const subNames = subCategories.slice(0, 5).map(sc => sc.name).join(', ');
      warning = subCategories.length <= 5
        ? `⚠️ This will also delete ${subCategories.length} dependent sub-categories:\n${subNames}`
        : `⚠️ This will also delete ${subCategories.length} dependent sub-categories including:\n${subNames} and ${subCategories.length - 5} more.`;
    }

    this.popupService.openDeleteConfirmation(message, warning).subscribe(result => {
      if (result?.action === 'confirm') {
        this.handleDeleteCategoryWithSubCategories(category, subCategories);
      }
    });
  }

  private handleDeleteCategoryWithSubCategories(category: AssetCategory, subCategories: AssetSubCategory[]) {
    this.loading.set(true);

    if (subCategories.length === 0) {
      // No sub-categories, directly delete the category
      this.performCategoryDelete(category.id);
      return;
    }

    // Delete all sub-categories first
    let deletedSubCount = 0, failedSubCount = 0;
    const totalSubs = subCategories.length;

    subCategories.forEach(sc => {
      this.subCategoriesService.deleteSubCategory(sc.id).subscribe({
        next: () => {
          deletedSubCount++;
          this.checkAndDeleteCategory(deletedSubCount, failedSubCount, totalSubs, category.id);
        },
        error: () => {
          failedSubCount++;
          this.checkAndDeleteCategory(deletedSubCount, failedSubCount, totalSubs, category.id);
        }
      });
    });
  }

  private checkAndDeleteCategory(deleted: number, failed: number, total: number, categoryId: number) {
    if (deleted + failed === total) {
      // All sub-categories processed, now delete the category
      this.performCategoryDelete(categoryId, deleted, failed);
    }
  }

  private performCategoryDelete(categoryId: number, deletedSubs = 0, failedSubs = 0) {
    this.categoriesService.deleteCategory(categoryId).subscribe({
      next: () => {
        this.categories.update(cats => cats.filter(c => c.id !== categoryId));
        this.loading.set(false);
        
        let msg = 'Category deleted successfully';
        if (deletedSubs > 0) {
          msg = `Category and ${deletedSubs} sub-categories deleted successfully`;
          if (failedSubs > 0) msg += ` (${failedSubs} sub-categories failed)`;
        }
        this.globalService.showSnackbar(msg, 'success');
      },
      error: (err) => {
        console.error('Error deleting category:', err);
        this.globalService.showToastr('Failed to delete category', 'error');
        this.loading.set(false);
      }
    });
  }

  handleDeleteCategory(id: number) {
    const category = this.categories().find(c => c.id === id);
    if (category) this.deleteCategory(category);
  }
  
  onRefresh() {
    this.loadCategories();
  }

  onSelectionChange(selected: AssetCategory[]) {
    console.log('Selected categories:', selected);
  }
}
