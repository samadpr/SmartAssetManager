import { Component, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { ListConfig, ListWidgetComponent, SelectionActionEvent } from '../../../shared/widgets/common/list-widget/list-widget.component';
import { SitesOrBranchesService } from '../../../core/services/sites-or-branchs/sites-or-branches.service';
import { CitiesService } from '../../../core/services/sites-or-branchs/cities/cities.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { PopupWidgetService } from '../../../core/services/popup-widget/popup-widget.service';
import { AssetSite, AssetSiteRequest, SiteOrBranch } from '../../../core/models/interfaces/sites-or-branchs/asset-site.interface';
import { PopupField, QuickAddConfig } from '../../../core/models/interfaces/popup-widget.interface';
import { Validators } from '@angular/forms';
import { AssetAreaService } from '../../../core/services/sites-or-branchs/areas/asset-area.service';
import { AssetArea } from '../../../core/models/interfaces/sites-or-branchs/asset-area.interface';
import { catchError, forkJoin, map, of, tap } from 'rxjs';

interface DropdownOption {
  value: any;
  label: string;
  disabled?: boolean;
}

interface DropdownData {
  cities: DropdownOption[];
}

@Component({
  selector: 'app-sites-or-branchs',
  imports: [
    PageHeaderComponent,
    ListWidgetComponent
  ],
  templateUrl: './sites-or-branchs.component.html',
  styleUrl: './sites-or-branchs.component.scss'
})
export class SitesOrBranchsComponent implements OnInit {
  private sitesService = inject(SitesOrBranchesService);
  private citiesService = inject(CitiesService);
  private areasService = inject(AssetAreaService);
  private popupService = inject(PopupWidgetService);
  private globalService = inject(GlobalService);

  sites = signal<AssetSite[]>([]);
  loading = signal(false);
  dropdownData = signal<DropdownData>({
    cities: []
  });

  // Type options for radio buttons
  private readonly typeOptions = [
    { value: SiteOrBranch.Site, label: 'Site', disabled: false },
    { value: SiteOrBranch.Branch, label: 'Branch', disabled: false }
  ];

  listConfig: ListConfig = {
    title: 'Sites / Branches',
    showSearch: true,
    showRefresh: true,
    showDownload: true,
    showAdd: true,
    addButtonLabel: 'Add Site/Branch',
    selectable: true,
    compactMode: false,
    showSelectionActions: true,
    rowClickAction: 'view',
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    maxVisibleRows: 5,
    exportFileName: 'sites-branches_export',
    emptyMessage: 'No sites or branches found. Click "Add Site/Branch" to create one.',
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
        label: 'Site/Branch Name',
        sortable: true,
        type: 'text',
        width: '200px',
        align: 'left',
        visible: true,
        ellipsis: true,
        showIcon: true
      },
      {
        key: 'typeDisplay',
        label: 'Type',
        sortable: true,
        type: 'text',
        width: '120px',
        align: 'left',
        visible: false
      },
      {
        key: 'cityDisplay',
        label: 'City',
        sortable: true,
        type: 'text',
        width: '150px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'address',
        label: 'Address',
        sortable: false,
        type: 'address',
        width: '300px',
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
    this.loadSites();
  }

  private loadDropdownData() {
    this.citiesService.getMyCities().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dropdownData.update(current => ({
            ...current,
            cities: response.data!.map(city => ({ value: city.id, label: city.name }))
          }));
        }
      },
      error: () => this.globalService.showToastr('Failed to load cities', 'error')
    });
  }

  private getSiteFields(): PopupField[] {
    const dropdowns = this.dropdownData();
    return [
      {
        key: 'name',
        label: 'Site/Branch Name',
        type: 'text',
        required: true,
        colSpan: 2,
        icon: 'location_city',
        placeholder: 'Enter site or branch name',
        validators: [Validators.minLength(2), Validators.maxLength(100)]
      },
      {
        key: 'city',
        label: 'City',
        type: 'select',
        required: false,
        colSpan: 2,
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
        colSpan: 4,
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
        colSpan: 4,
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
        colSpan: 4,
        icon: 'description',
        placeholder: 'Enter description',
        rows: 4,
        validators: [Validators.maxLength(500)]
      }
    ];
  }

  // 🆕 NEW: Get Quick Add configuration for city field
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
          colSpan: 4,
          icon: 'edit_location_alt',
          placeholder: 'Enter city name',
          validators: [Validators.minLength(2), Validators.maxLength(100)]
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          required: false,
          colSpan: 4,
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

  private loadSites() {
    this.loading.set(true);
    this.sitesService.getMySites().subscribe({
      next: (response) => {
        if (!response.success) { this.globalService.showToastr('Failed to load sites/branches.', 'error'); this.loading.set(false); return; }
        this.sites.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => { this.globalService.showToastr('Failed to load sites/branches.', 'error'); this.loading.set(false); }
    });
  }

  onRowClick(event: { action: string; item: AssetSite }) { if (event.action === 'view') this.viewSite(event.item); }

  onSelectionAction(event: SelectionActionEvent) {
    switch (event.action) {
      case 'delete': this.deleteMultipleSites(event.selectedItems); break;
      case 'export': this.exportSelectedSites(event.selectedItems); break;
    }
  }

  onActionClick(event: { action: string; item: AssetSite }) {
    switch (event.action) {
      case 'view': this.viewSite(event.item); break;
      case 'edit': this.editSite(event.item); break;
      case 'delete': this.deleteSite(event.item); break;
    }
  }

  // ==================== DELETE WITH CASCADE (Areas) ====================

  deleteSite(site: AssetSite) {
    this.loading.set(true);
    this.areasService.getAreasBySiteId(site.id).pipe(
      catchError(() => of({ success: false, data: [] as AssetArea[] }))
    ).subscribe({
      next: (response) => {
        this.loading.set(false);
        const areas = response.success && response.data ? response.data : [];
        this.showSiteDeleteConfirmation(site, areas);
      },
      error: () => { this.loading.set(false); this.showSiteDeleteConfirmation(site, []); }
    });
  }

  private showSiteDeleteConfirmation(site: AssetSite, areas: AssetArea[]) {
    let message = `Are you sure you want to delete "${site.name}"?`;
    let warning = 'This action cannot be undone.';

    if (areas.length > 0) {
      const areaNames = areas.slice(0, 5).map(a => a.name).join(', ');
      warning = areas.length <= 5
        ? `⚠️ This will also delete ${areas.length} dependent Area(s):\n${areaNames}`
        : `⚠️ This will also delete ${areas.length} dependent Area(s) including:\n${areaNames} and ${areas.length - 5} more.`;
    }

    this.popupService.openDeleteConfirmation(message, warning).subscribe(result => {
      if (result?.action === 'confirm') this.performSiteDeleteWithAreas(site, areas);
    });
  }

  private performSiteDeleteWithAreas(site: AssetSite, areas: AssetArea[]) {
    this.loading.set(true);

    if (areas.length === 0) {
      this.deleteSiteOnly(site.id, 0, 0);
      return;
    }

    let deletedAreas = 0, failedAreas = 0;
    areas.forEach(area => {
      this.areasService.deleteArea(area.id).subscribe({
        next: () => { deletedAreas++; if (deletedAreas + failedAreas === areas.length) this.deleteSiteOnly(site.id, deletedAreas, failedAreas); },
        error: () => { failedAreas++; if (deletedAreas + failedAreas === areas.length) this.deleteSiteOnly(site.id, deletedAreas, failedAreas); }
      });
    });
  }

  private deleteSiteOnly(siteId: number, deletedAreas = 0, failedAreas = 0) {
    this.sitesService.deleteSite(siteId).subscribe({
      next: () => {
        this.sites.update(s => s.filter(site => site.id !== siteId));
        this.loading.set(false);
        let msg = 'Site/Branch deleted successfully';
        if (deletedAreas > 0) {
          msg = `Site/Branch and ${deletedAreas} area(s) deleted successfully`;
          if (failedAreas > 0) msg += ` (${failedAreas} area(s) failed)`;
        }
        this.globalService.showSnackbar(msg, 'success');
      },
      error: () => { this.globalService.showToastr('Failed to delete site/branch', 'error'); this.loading.set(false); }
    });
  }

  deleteMultipleSites(selectedSites: AssetSite[]) {
    this.loading.set(true);
    const areaRequests = selectedSites.map(site =>
      this.areasService.getAreasBySiteId(site.id).pipe(
        catchError(() => of({ success: false, data: [] as AssetArea[] })),
        map(res => ({ site, areas: res.success && res.data ? res.data : [] }))
      )
    );

    forkJoin(areaRequests).subscribe({
      next: (results) => {
        this.loading.set(false);
        const allAreas = results.flatMap(r => r.areas);
        this.showBulkSiteDeleteConfirmation(selectedSites, allAreas, results);
      },
      error: () => { this.loading.set(false); this.globalService.showToastr('Failed to check dependencies', 'error'); }
    });
  }

  private showBulkSiteDeleteConfirmation(
    sites: AssetSite[], allAreas: AssetArea[],
    results: { site: AssetSite; areas: AssetArea[] }[]
  ) {
    const names = sites.slice(0, 3).map(s => s.name).join(', ');
    const message = sites.length <= 3 ? `Delete "${names}"?` : `Delete "${names}" and ${sites.length - 3} other sites/branches?`;

    let warning = `This will permanently delete ${sites.length} site/branch record(s).`;
    if (allAreas.length > 0) warning += `\n\n ⚠️ This will also delete ${allAreas.length} Area(s).`;

    this.popupService.openDeleteConfirmation(message, warning).subscribe(result => {
      if (result?.action === 'confirm') this.performBulkSiteDelete(results);
    });
  }

  private performBulkSiteDelete(results: { site: AssetSite; areas: AssetArea[] }[]) {
    this.loading.set(true);
    let idx = 0;

    const deleteNext = () => {
      if (idx >= results.length) {
        this.loading.set(false);
        this.loadSites();
        this.globalService.showSnackbar(`Deleted ${results.length} sites/branches with dependencies`, 'success');
        return;
      }
      const { site, areas } = results[idx];
      this.performSilentSiteDelete(site, areas, () => { idx++; deleteNext(); });
    };
    deleteNext();
  }

  private performSilentSiteDelete(site: AssetSite, areas: AssetArea[], onComplete: () => void) {
    if (areas.length === 0) {
      this.sitesService.deleteSite(site.id).subscribe({ next: onComplete, error: onComplete });
      return;
    }
    let done = 0;
    areas.forEach(a => {
      this.areasService.deleteArea(a.id).subscribe({
        next: () => { done++; if (done === areas.length) this.sitesService.deleteSite(site.id).subscribe({ next: onComplete, error: onComplete }); },
        error: () => { done++; if (done === areas.length) this.sitesService.deleteSite(site.id).subscribe({ next: onComplete, error: onComplete }); }
      });
    });
  }

  // ==================== OTHER CRUD ====================

  onAddSite() {
    const fields = this.getSiteFields();
    this.popupService.openAddPopup('Add New Site/Branch', fields, {
      subtitle: 'Enter site or branch information below', 
      icon: 'location_city', 
      columns: 2, 
      maxWidth: '800px', 
      compactMode: false
    }).subscribe(result => { if (result?.action === 'submit') this.handleAddSite(result.data); });
  }

  handleAddSite(siteData: AssetSiteRequest) {
    this.loading.set(true);
    const requestData = { ...siteData, type: Number(siteData.type) };
    this.sitesService.createSite(requestData).subscribe({
      next: (response) => {
        if (response.success && response.data) { this.globalService.showSnackbar('Site/Branch created successfully', 'success'); this.loadSites(); }
        else { this.globalService.showToastr(response.message || 'Failed to create site/branch', 'error'); }
        this.loading.set(false);
      },
      error: () => { this.globalService.showToastr('Failed to create site/branch', 'error'); this.loading.set(false); }
    });
  }

  viewSite(site: AssetSite) {
    const fields = this.getSiteFields();
    this.popupService.openViewPopup2('Site/Branch Details', fields, { ...site }, {
      subtitle: `${site.typeDisplay || 'Site/Branch'} ID: ${site.id}`, icon: 'location_city', columns: 2, maxWidth: '800px', maxHeight: '800px', showEditButton: true
    }).subscribe(result => { if (result.action === 'edit') this.editSite(site); });
  }

  editSite(site: AssetSite) {
    const fields = this.getSiteFields();
    this.popupService.openEditPopup('Edit Site/Branch', fields, { ...site }, {
      subtitle: `Update information for ${site.name}`, icon: 'edit', columns: 2, maxWidth: '800px'
    }).subscribe(result => {
      if (result?.action === 'submit') { result.data.id = site.id; this.handleEditSite(site.id, result.data); }
    });
  }

  private handleEditSite(id: number, formData: AssetSiteRequest) {
    this.loading.set(true);
    const requestData = { ...formData, type: Number(formData.type) };
    this.sitesService.updateSite(requestData).subscribe({
      next: (response) => {
        if (response.success && response.data) { this.globalService.showSnackbar('Site/Branch updated successfully', 'success'); this.loadSites(); }
        else { this.globalService.showToastr('Update failed', 'error'); }
        this.loading.set(false);
      },
      error: () => { this.globalService.showToastr('Failed to update site/branch', 'error'); this.loading.set(false); }
    });
  }

  exportSelectedSites(selectedItems: AssetSite[]) {
    console.log(`Exporting ${selectedItems.length} selected sites/branches`);
    this.globalService.showSnackbar(`Exported ${selectedItems.length} sites/branches`, 'success');
  }
  onRefresh() {
    this.loadSites();
  }

  onSelectionChange(selected: AssetSite[]) {
    console.log('Selected sites/branches:', selected);
  }
}
