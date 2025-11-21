import { Component, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { ListConfig, ListWidgetComponent, SelectionActionEvent } from '../../../shared/widgets/common/list-widget/list-widget.component';
import { PopupWidgetService } from '../../../core/services/popup-widget/popup-widget.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { CitiesService } from '../../../core/services/sites-or-branchs/cities/cities.service';
import { AssetCity } from '../../../core/models/interfaces/sites-or-branchs/cities.interface';
import { PopupField } from '../../../core/models/interfaces/popup-widget.interface';
import { Validators } from '@angular/forms';
import { SitesOrBranchesService } from '../../../core/services/sites-or-branchs/sites-or-branches.service';
import { AssetAreaService } from '../../../core/services/sites-or-branchs/areas/asset-area.service';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { AssetSite } from '../../../core/models/interfaces/sites-or-branchs/asset-site.interface';
import { AssetArea } from '../../../core/models/interfaces/sites-or-branchs/asset-area.interface';

interface DependentData {
  sites: AssetSite[];
  areas: AssetArea[];
}

@Component({
  selector: 'app-cities',
  imports: [
    PageHeaderComponent,
    ListWidgetComponent
  ],
  templateUrl: './cities.component.html',
  styleUrl: './cities.component.scss'
})
export class CitiesComponent implements OnInit {
  private sitesService = inject(SitesOrBranchesService);
  private areasService = inject(AssetAreaService);
  private citiesService = inject(CitiesService);
  private popupService = inject(PopupWidgetService);
  private globalService = inject(GlobalService);

  Cities = signal<AssetCity[]>([]);
  loading = signal(false);

  listConfig: ListConfig = {
    title: 'Cities',
    showSearch: true,
    showRefresh: true,
    showDownload: true,
    showAdd: true,
    addButtonLabel: 'Add Cities',
    selectable: true,
    compactMode: false, // Set to true for compact layout
    showSelectionActions: true, // Enable bulk actions
    rowClickAction: 'view', // Enable row click to view details
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    maxVisibleRows: 5,
    exportFileName: 'Cities_export',
    emptyMessage: 'No Cities found. Click "Add Cities" to create one.',
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
        label: 'Cities Name',
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
        width: '200px',
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
        tooltip: 'Edit Cities'
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        tooltip: 'Delete Cities'
      }
    ]
  };


  private getCitiesFields(): PopupField[] {
    return [
      {
        key: 'name',
        label: 'City Name',
        type: 'text',
        required: true,
        colSpan: 2,
        icon: 'domain',
        placeholder: 'Enter City name',
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
    this.loadAssetCities();
  }

  private loadAssetCities() {
    this.loading.set(true);
    this.citiesService.getMyCities().subscribe({
      next: (response) => {
        if (!response.success) {
          this.globalService.showToastr('Failed to load Cities.', 'error');
          this.loading.set(false);
          return;
        }
        this.Cities.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.globalService.showToastr('Failed to load Cities.', 'error');
        this.loading.set(false);
      }
    });
  }

  onRowClick(event: { action: string; item: AssetCity }) {
    if (event.action === 'view') this.viewCity(event.item);
  }

  onSelectionAction(event: SelectionActionEvent) {
    switch (event.action) {
      case 'delete': this.deleteMultipleCities(event.selectedItems); break;
      case 'export': this.exportSelectedCities(event.selectedItems); break;
    }
  }

  onActionClick(event: { action: string; item: AssetCity }) {
    switch (event.action) {
      case 'view': this.viewCity(event.item); break;
      case 'edit': this.editCity(event.item); break;
      case 'delete': this.deleteCity(event.item); break;
    }
  }

  // ==================== DELETE LOGIC WITH CASCADE ====================

  deleteCity(city: AssetCity) {
    this.loading.set(true);
    this.fetchDependentDataForCity(city.id).subscribe({
      next: (dependentData) => {
        this.loading.set(false);
        this.showDeleteConfirmation(city, dependentData);
      },
      error: () => {
        this.loading.set(false);
        this.showDeleteConfirmation(city, { sites: [], areas: [] });
      }
    });
  }

  private fetchDependentDataForCity(cityId: number) {
    return this.sitesService.getSitesByCityId(cityId).pipe(
      catchError(() => of({ success: false, data: [] as AssetSite[] })),
      // After getting sites, fetch areas for each site
      switchMap((sitesResponse) => {
        const sites = sitesResponse.success && sitesResponse.data ? sitesResponse.data : [];
        if (sites.length === 0) {
          return of({ sites: [], areas: [] as AssetArea[] });
        }
        // Fetch areas for all sites
        const areaRequests = sites.map(site =>
          this.areasService.getAreasBySiteId(site.id).pipe(
            catchError(() => of({ success: false, data: [] as AssetArea[] }))
          )
        );
        return forkJoin(areaRequests).pipe(
          map(areaResponses => {
            const allAreas: AssetArea[] = [];
            areaResponses.forEach(res => {
              if (res.success && res.data) allAreas.push(...res.data);
            });
            return { sites, areas: allAreas };
          })
        );
      })
    );
  }

  private showDeleteConfirmation(city: AssetCity, dependentData: DependentData) {
    const { sites, areas } = dependentData;
    let message = `Are you sure you want to delete "${city.name}"?`;
    let warning = 'This action cannot be undone.';

    if (sites.length > 0 || areas.length > 0) {
      const warnings: string[] = [];
      if (sites.length > 0) {
        const siteNames = sites.slice(0, 3).map(s => s.name).join(', ');
        warnings.push(sites.length <= 3
          ? `${sites.length} Site(s)/Branch(es): ${siteNames}`
          : `${sites.length} Site(s)/Branch(es) including: ${siteNames} and ${sites.length - 3} more`);
      }
      if (areas.length > 0) {
        const areaNames = areas.slice(0, 3).map(a => a.name).join(', ');
        warnings.push(areas.length <= 3
          ? `${areas.length} Area(s): ${areaNames}`
          : `${areas.length} Area(s) including: ${areaNames} and ${areas.length - 3} more`);
      }
      warning = `⚠️ This will also delete:\n• ${warnings.join('\n• ')}`;
    }

    this.popupService.openDeleteConfirmation(message, warning).subscribe(result => {
      if (result?.action === 'confirm') {
        this.performCascadeDelete(city, dependentData);
      }
    });
  }

  private performCascadeDelete(city: AssetCity, dependentData: DependentData) {
    this.loading.set(true);
    const { sites, areas } = dependentData;
    const totalOps = areas.length + sites.length + 1; // +1 for city
    let completed = 0, failed = 0;

    const checkComplete = () => {
      if (completed + failed === totalOps) {
        this.loading.set(false);
        this.loadAssetCities();
        const msg = failed > 0
          ? `Deleted with ${failed} errors`
          : `Successfully deleted city "${city.name}" with ${sites.length} sites and ${areas.length} areas`;
        this.globalService.showSnackbar(msg, failed > 0 ? 'warning' : 'success');
      }
    };

    const deleteCity = () => {
      this.citiesService.deleteCity(city.id).subscribe({
        next: () => { completed++; checkComplete(); },
        error: () => { failed++; checkComplete(); }
      });
    };

    const deleteSites = () => {
      if (sites.length === 0) { deleteCity(); return; }
      let sitesCompleted = 0;
      sites.forEach(site => {
        this.sitesService.deleteSite(site.id).subscribe({
          next: () => { completed++; sitesCompleted++; if (sitesCompleted === sites.length) deleteCity(); },
          error: () => { failed++; sitesCompleted++; if (sitesCompleted === sites.length) deleteCity(); }
        });
      });
    };

    // Delete Areas first → then Sites → then City
    if (areas.length === 0) {
      deleteSites();
    } else {
      let areasCompleted = 0;
      areas.forEach(area => {
        this.areasService.deleteArea(area.id).subscribe({
          next: () => { completed++; areasCompleted++; if (areasCompleted === areas.length) deleteSites(); },
          error: () => { failed++; areasCompleted++; if (areasCompleted === areas.length) deleteSites(); }
        });
      });
    }
  }

  deleteMultipleCities(selectedCities: AssetCity[]) {
    this.loading.set(true);
    const cityRequests = selectedCities.map(city =>
      this.fetchDependentDataForCity(city.id).pipe(
        catchError(() => of({ sites: [] as AssetSite[], areas: [] as AssetArea[] })),
        map(data => ({ city, ...data }))
      )
    );

    forkJoin(cityRequests).subscribe({
      next: (results) => {
        this.loading.set(false);
        const allSites = results.flatMap(r => r.sites);
        const allAreas = results.flatMap(r => r.areas);
        this.showBulkDeleteConfirmation(selectedCities, allSites, allAreas, results);
      },
      error: () => {
        this.loading.set(false);
        this.globalService.showToastr('Failed to check dependencies', 'error');
      }
    });
  }

  private showBulkDeleteConfirmation(
    cities: AssetCity[], sites: AssetSite[], areas: AssetArea[],
    results: { city: AssetCity; sites: AssetSite[]; areas: AssetArea[] }[]
  ) {
    const names = cities.slice(0, 3).map(c => c.name).join(', ');
    const message = cities.length <= 3
      ? `Delete "${names}"?`
      : `Delete "${names}" and ${cities.length - 3} other cities?`;

    let warning = `This will permanently delete ${cities.length} city record(s).`;
    if (sites.length > 0 || areas.length > 0) {
      warning += `\n\n⚠️ This will also delete:`;
      if (sites.length > 0) warning += `\n• ${sites.length} Site(s)/Branch(es)`;
      if (areas.length > 0) warning += `\n• ${areas.length} Area(s)`;
    }

    this.popupService.openDeleteConfirmation(message, warning).subscribe(result => {
      if (result?.action === 'confirm') {
        this.performBulkCascadeDelete(results);
      }
    });
  }

  private performBulkCascadeDelete(results: { city: AssetCity; sites: AssetSite[]; areas: AssetArea[] }[]) {
    this.loading.set(true);
    let index = 0;

    const deleteNext = () => {
      if (index >= results.length) {
        this.loading.set(false);
        this.loadAssetCities();
        this.globalService.showSnackbar(`Successfully deleted ${results.length} cities with dependencies`, 'success');
        return;
      }
      const { city, sites, areas } = results[index];
      this.performCascadeDeleteSilent(city, { sites, areas }, () => { index++; deleteNext(); });
    };

    deleteNext();
  }

  private performCascadeDeleteSilent(city: AssetCity, data: DependentData, onComplete: () => void) {
    const { sites, areas } = data;

    const deleteCity = () => {
      this.citiesService.deleteCity(city.id).subscribe({ next: onComplete, error: onComplete });
    };

    const deleteSites = () => {
      if (sites.length === 0) { deleteCity(); return; }
      let done = 0;
      sites.forEach(s => {
        this.sitesService.deleteSite(s.id).subscribe({
          next: () => { done++; if (done === sites.length) deleteCity(); },
          error: () => { done++; if (done === sites.length) deleteCity(); }
        });
      });
    };

    if (areas.length === 0) { deleteSites(); return; }
    let done = 0;
    areas.forEach(a => {
      this.areasService.deleteArea(a.id).subscribe({
        next: () => { done++; if (done === areas.length) deleteSites(); },
        error: () => { done++; if (done === areas.length) deleteSites(); }
      });
    });
  }

  // ==================== OTHER CRUD OPERATIONS ====================

  onAddCities() {
    const fields = this.getCitiesFields();
    this.popupService.openAddPopup('Add New City', fields, {
      subtitle: 'Enter city information below', icon: 'domain_add', columns: 1, maxWidth: '800px', compactMode: false
    }).subscribe(result => {
      if (result?.action === 'submit') this.handleAddCities(result.data);
    });
  }

  handleAddCities(formData: any) {
    this.loading.set(true);
    this.citiesService.createCity(formData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.Cities.update(city => [...city, response.data!]);
          this.globalService.showSnackbar('City created successfully', 'success');
        } else {
          this.globalService.showToastr(response.message || 'Failed to create city', 'error');
        }
        this.loading.set(false);
      },
      error: () => { this.globalService.showToastr('Failed to create city', 'error'); this.loading.set(false); }
    });
  }

  viewCity(city: AssetCity) {
    const fields = this.getCitiesFields();
    this.popupService.openViewPopup2('City Details', fields, city, {
      subtitle: `City ID: ${city.id}`, icon: 'domain', columns: 2, maxWidth: '800px', maxHeight: '800px', showEditButton: true
    }).subscribe(result => {
      if (result.action === 'edit') this.editCity(city);
    });
  }

  editCity(city: AssetCity) {
    const fields = this.getCitiesFields();
    this.popupService.openEditPopup('Edit City', fields, city, {
      subtitle: `Update information for ${city.name}`, icon: 'edit', columns: 1, maxWidth: '800px'
    }).subscribe(result => {
      if (result?.action === 'submit') {
        result.data.id = city.id;
        this.handleEditCity(city.id, result.data);
      }
    });
  }

  private handleEditCity(id: number, formData: any) {
    this.loading.set(true);
    this.citiesService.updateCity(formData).subscribe({
      next: (response) => {
        if (response.data) {
          this.Cities.update(cities => cities.map(c => c.id === id ? response.data! : c));
          this.globalService.showSnackbar('City updated successfully', 'success');
        } else {
          this.globalService.showToastr('Update failed', 'error');
        }
        this.loading.set(false);
      },
      error: () => { this.globalService.showToastr('Failed to update city', 'error'); this.loading.set(false); }
    });
  }

  exportSelectedCities(selectedCities: AssetCity[]) {
    this.globalService.showSnackbar(`Exported ${selectedCities.length} cities`, 'success');
  }

  onRefresh() {
    this.loadAssetCities();
  }

  onSelectionChange(selected: AssetCity[]) {
    console.log('Selected Cities:', selected);
  }

}
