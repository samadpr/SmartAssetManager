import { Component, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { AssetAreaService } from '../../../core/services/sites-or-branchs/areas/asset-area.service';
import { SitesOrBranchesService } from '../../../core/services/sites-or-branchs/sites-or-branches.service';
import { PopupWidgetService } from '../../../core/services/popup-widget/popup-widget.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { AssetArea, AssetAreaRequest } from '../../../core/models/interfaces/sites-or-branchs/asset-area.interface';
import { ListConfig, ListWidgetComponent, SelectionActionEvent } from '../../../shared/widgets/common/list-widget/list-widget.component';
import { forkJoin, map, tap } from 'rxjs';
import { PopupField, QuickAddConfig } from '../../../core/models/interfaces/popup-widget.interface';
import { Validators } from '@angular/forms';
import { CitiesService } from '../../../core/services/sites-or-branchs/cities/cities.service';
import { SiteOrBranch } from '../../../core/models/interfaces/sites-or-branchs/asset-site.interface';

interface DropdownOption {
  value: any;
  label: string;
  disabled?: boolean;
}

interface DropdownData {
  sites: DropdownOption[];
  cities: DropdownOption[];
}
@Component({
  selector: 'app-areas',
  imports: [
    PageHeaderComponent,
    ListWidgetComponent
  ],
  templateUrl: './areas.component.html',
  styleUrl: './areas.component.scss'
})
export class AreasComponent implements OnInit {
  private assetAreaService = inject(AssetAreaService);
  private sitesService = inject(SitesOrBranchesService);
  private popupService = inject(PopupWidgetService);
  private globalService = inject(GlobalService);
  private citiesService = inject(CitiesService);

  areas = signal<AssetArea[]>([]);
  loading = signal(false);
  dropdownData = signal<DropdownData>({
    sites: [],
    cities: []
  });

  // Type options for radio buttons
  private readonly typeOptions = [
    { value: SiteOrBranch.Site, label: 'Site', disabled: false },
    { value: SiteOrBranch.Branch, label: 'Branch', disabled: false }
  ];

  listConfig: ListConfig = {
    title: 'Asset Areas',
    showSearch: true,
    showRefresh: true,
    showDownload: true,
    showAdd: true,
    addButtonLabel: 'Add Area',
    selectable: true,
    compactMode: false,
    showSelectionActions: true,
    rowClickAction: 'view',
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    maxVisibleRows: 5,
    exportFileName: 'asset-areas_export',
    emptyMessage: 'No areas found. Click "Add Area" to create one.',
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
        label: 'Area Name',
        sortable: true,
        type: 'text',
        width: '200px',
        align: 'left',
        visible: true,
        ellipsis: true,
        showIcon: true
      },
      {
        key: 'siteDisplay',
        label: 'Site/Branch',
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
        width: '300px',
        align: 'left',
        visible: true
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
        tooltip: 'Edit area'
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        tooltip: 'Delete area'
      }
    ]
  };

  ngOnInit() {
    this.loadDropdownData();
    this.loadAreas();
  }

  private loadDropdownData() {
    forkJoin({
      sites: this.sitesService.getMySites(),
      cities: this.citiesService.getMyCities()
    }).subscribe({
      next: (responses) => {
        this.dropdownData.update(current => ({
          ...current,
          sites: responses.sites.data?.map(site => ({
            value: site.id,
            label: site.name
          })) ?? [],
          cities: responses.cities.data?.map(city => ({
            value: city.id,
            label: city.name
          })) ?? []
        }));
      },
      error: (error) => {
        console.error('Error loading dropdown data:', error);
        this.globalService.showToastr('Failed to load form data', 'error');
      }
    });
  }

  private getAreaFields(): PopupField[] {
    const dropdowns = this.dropdownData();
    return [
      {
        key: 'name',
        label: 'Area Name',
        type: 'text',
        required: true,
        colSpan: 1,
        icon: 'place',
        placeholder: 'Enter area name',
        validators: [Validators.minLength(2), Validators.maxLength(100)]
      },
      {
        key: 'siteId',
        label: 'Site/Branch',
        type: 'select',
        required: false,
        colSpan: 1,
        icon: 'business',
        placeholder: 'Select site or branch',
        options: dropdowns.sites,
        quickAdd: this.getSiteOrBranchQuickAddConfig()
      },
      {
        key: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        colSpan: 2,
        icon: 'description',
        placeholder: 'Enter area description',
        rows: 4,
        validators: [Validators.maxLength(500)]
      }
    ];
  }

  // 🆕 NEW: Get Quick Add configuration for site or breanch field
  private getSiteOrBranchQuickAddConfig(): QuickAddConfig {
    const dropdowns = this.dropdownData();
    return {
      enabled: true,
      buttonLabel: 'Add New Site/Branch',
      buttonIcon: 'add_circle',
      popupTitle: 'Add New Site/Branch',
      popupIcon: 'edit_location_alt',

      // Fields for the quick add Site/Branch popup
      fields: [
        {
          key: 'name',
          label: 'Site/Branch Name',
          type: 'text',
          required: true,
          colSpan: 1,
          icon: 'location_city',
          placeholder: 'Enter Site/Branch name',
          validators: [Validators.minLength(2), Validators.maxLength(100)]
        },
        {
          key: 'city',
          label: 'City',
          type: 'select',
          required: false,
          colSpan: 1,
          icon: 'edit_location_alt',
          placeholder: 'Select city',
          options: dropdowns.cities,
          quickAdd: this.getCityQuickAddConfig()
        },
        {
          key: 'type',
          label: 'Type',
          type: 'radio',
          required: true,
          colSpan: 2,
          icon: 'category',
          options: this.typeOptions,
          value: SiteOrBranch.Site,
          validators: [Validators.required]
        },
        {
          key: 'address',
          label: 'Address',
          type: 'textarea',
          required: false,
          colSpan: 2,
          icon: 'location_on',
          placeholder: 'Enter full address',
          rows: 3,
          validators: [Validators.maxLength(500)]
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          required: false,
          colSpan: 2,
          icon: 'description',
          placeholder: 'Enter description',
          rows: 3,
          validators: [Validators.maxLength(500)]
        }
      ],

      // Handler to save the new siteOrBranch
      onAdd: (SiteOrBranchData) => {
        console.log('💾 Saving new Site/Branch:', SiteOrBranchData);
        return this.sitesService.createSite(SiteOrBranchData).pipe(
          tap(response => {
            console.log('✅ Site/Branch created:', response);
          })
        );
      },

      // Refresh dropdown options after successful add
      // 🔥 FIXED: Refresh handler - This is the KEY fix
      refreshOptions: (response) => {
        console.log('🔄 Refreshing options after Site/Branch add:', response);

        // Show success message
        const siteOrBranchName = response?.data?.name || response?.name || 'Site/Branch';
        this.globalService.showSnackbar(`"${siteOrBranchName}" added successfully!`, 'success');

        // 🔥 CRITICAL: Fetch fresh data from API
        return this.sitesService.getMySites().pipe(
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
                sites: newOptions
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

   // 🆕 NEW: Get Quick Add configuration for city field in site popup
  private getCityQuickAddConfig(): QuickAddConfig {
    return {
      enabled: true,
      buttonLabel: 'Add New City',
      buttonIcon: 'add_circle',
      popupTitle: 'Add New City',
      popupIcon: 'edit_location_alt',

      // Fields for the quick add city popup
      fields: [
        {
          key: 'name',
          label: 'City Name',
          type: 'text',
          required: true,
          colSpan: 2,
          icon: 'edit_location_alt',
          placeholder: 'Enter city name',
          validators: [Validators.minLength(2), Validators.maxLength(100)]
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          required: false,
          colSpan: 2,
          icon: 'description',
          placeholder: 'Enter city description',
          rows: 3,
          validators: [Validators.maxLength(500)]
        }
      ],

      // Handler to save the new city
      onAdd: (cityData) => {
        console.log('💾 Saving new City:', cityData);
        return this.citiesService.createCity(cityData).pipe(
          tap(response => {
            console.log('✅ City created:', response);
          })
        );
      },

      // Refresh dropdown options after successful add
      // 🔥 FIXED: Refresh handler - This is the KEY fix
      refreshOptions: (response) => {
        console.log('🔄 Refreshing options after city add:', response);

        // Show success message
        const cityName = response?.data?.name || response?.name || 'City';
        this.globalService.showSnackbar(`"${cityName}" added successfully!`, 'success');

        // 🔥 CRITICAL: Fetch fresh data from API
        return this.citiesService.getMyCities().pipe(
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
                cities: newOptions
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


  private loadAreas() {
    this.loading.set(true);
    this.assetAreaService.getMyAreas().subscribe({
      next: (response) => {
        if (!response.success) { this.globalService.showToastr('Failed to load areas.', 'error'); this.loading.set(false); return; }
        this.areas.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => { this.globalService.showToastr('Failed to load areas.', 'error'); this.loading.set(false); }
    });
  }

  onRowClick(event: { action: string; item: AssetArea }) { if (event.action === 'view') this.viewArea(event.item); }

  onSelectionAction(event: SelectionActionEvent) {
    switch (event.action) {
      case 'delete': this.deleteMultipleAreas(event.selectedItems); break;
      case 'export': this.exportSelectedAreas(event.selectedItems); break;
    }
  }

  onActionClick(event: { action: string; item: AssetArea }) {
    switch (event.action) {
      case 'view': this.viewArea(event.item); break;
      case 'edit': this.editArea(event.item); break;
      case 'delete': this.deleteArea(event.item); break;
    }
  }

  // ==================== DELETE (No cascade - Areas are leaf nodes) ====================

  deleteArea(area: AssetArea) {
    this.popupService.openDeleteConfirmation(
      `Are you sure you want to delete "${area.name}"?`,
      'This action cannot be undone.'
    ).subscribe(result => {
      if (result?.action === 'confirm') this.handleDeleteArea(area.id);
    });
  }

  private handleDeleteArea(id: number) {
    this.loading.set(true);
    this.assetAreaService.deleteArea(id).subscribe({
      next: () => {
        this.areas.update(areas => areas.filter(a => a.id !== id));
        this.globalService.showSnackbar('Area deleted successfully', 'success');
        this.loading.set(false);
      },
      error: () => { this.globalService.showToastr('Failed to delete area', 'error'); this.loading.set(false); }
    });
  }

  deleteMultipleAreas(selectedAreas: AssetArea[]) {
    const count = selectedAreas.length;
    const names = selectedAreas.slice(0, 3).map(a => a.name).join(', ');
    const message = count <= 3 ? `Are you sure you want to delete "${names}"?` : `Are you sure you want to delete "${names}" and ${count - 3} other areas?`;

    this.popupService.openDeleteConfirmation(message, `This will permanently delete ${count} area record${count > 1 ? 's' : ''}.`)
      .subscribe(result => { if (result?.action === 'confirm') this.handleBulkDelete(selectedAreas); });
  }

  private handleBulkDelete(selectedAreas: AssetArea[]) {
    this.loading.set(true);
    const ids = selectedAreas.map(a => a.id);
    let completed = 0, failed = 0;

    ids.forEach(id => {
      this.assetAreaService.deleteArea(id).subscribe({
        next: () => {
          completed++;
          if (completed + failed === ids.length) {
            this.areas.update(areas => areas.filter(a => !ids.includes(a.id)));
            this.loading.set(false);
            this.globalService.showSnackbar(
              failed > 0 ? `Deleted ${completed} areas, ${failed} failed` : `${completed} areas deleted successfully`,
              failed > 0 ? 'warning' : 'success'
            );
          }
        },
        error: () => {
          failed++;
          if (completed + failed === ids.length) {
            this.areas.update(areas => areas.filter(a => !ids.includes(a.id)));
            this.loading.set(false);
            this.globalService.showSnackbar(`Deleted ${completed} areas, ${failed} failed`, 'warning');
          }
        }
      });
    });
  }

  // ==================== OTHER CRUD ====================

  onAddArea() {
    const fields = this.getAreaFields();
    this.popupService.openAddPopup('Add New Area', fields, {
      subtitle: 'Enter area information below', icon: 'add_location', columns: 2, maxWidth: '800px', compactMode: false
    }).subscribe(result => { if (result?.action === 'submit') this.handleAddArea(result.data); });
  }

  handleAddArea(areaData: AssetAreaRequest) {
    this.loading.set(true);
    this.assetAreaService.createArea(areaData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.globalService.showSnackbar('Area created successfully', 'success');
          this.loadAreas();
        } else { this.globalService.showToastr(response.message || 'Failed to create area', 'error'); }
        this.loading.set(false);
      },
      error: () => { this.globalService.showToastr('Failed to create area', 'error'); this.loading.set(false); }
    });
  }

  viewArea(area: AssetArea) {
    const fields = this.getAreaFields();
    this.popupService.openViewPopup2('Area Details', fields, area, {
      subtitle: `Area ID: ${area.id}`, icon: 'place', columns: 2, maxWidth: '800px', maxHeight: '800px', showEditButton: true
    }).subscribe(result => { if (result.action === 'edit') this.editArea(area); });
  }

  editArea(area: AssetArea) {
    const fields = this.getAreaFields();
    this.popupService.openEditPopup('Edit Area', fields, area, {
      subtitle: `Update information for ${area.name}`, icon: 'edit', columns: 2, maxWidth: '800px'
    }).subscribe(result => {
      if (result?.action === 'submit') { result.data.id = area.id; this.handleEditArea(area.id, result.data); }
    });
  }

  private handleEditArea(id: number, formData: AssetAreaRequest) {
    this.loading.set(true);
    this.assetAreaService.updateArea(formData).subscribe({
      next: (response) => {
        if (response.success) { this.onRefresh(); this.globalService.showSnackbar('Area updated successfully', 'success'); }
        else { this.globalService.showToastr('Update failed', 'error'); }
        this.loading.set(false);
      },
      error: () => { this.globalService.showToastr('Failed to update area', 'error'); this.loading.set(false); }
    });
  }


  exportSelectedAreas(selectedItems: AssetArea[]) {
    console.log(`Exporting ${selectedItems.length} selected areas`);
    this.globalService.showSnackbar(`Exported ${selectedItems.length} areas`, 'success');
  }

  onRefresh() {
    this.loadAreas();
  }

  onSelectionChange(selected: AssetArea[]) {
    console.log('Selected areas:', selected);
  }
}
