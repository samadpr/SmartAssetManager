import { Component, inject, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { ManageAssetsService } from '../../../core/services/asset/manage-assets.service';
import { SuppliersService } from '../../../core/services/supplier/suppliers.service';
import { DepartmentService } from '../../../core/services/department/department.service';
import { SubDepartmentService } from '../../../core/services/department/sub-department/sub-department.service';
import { SitesOrBranchesService } from '../../../core/services/sites-or-branchs/sites-or-branches.service';
import { AssetAreaService } from '../../../core/services/sites-or-branchs/areas/asset-area.service';
import { AssetDepreciation, AssetDetail, AssetDisposeRequest, AssetDropdownData, AssetRequest, AssetResponse, AssetTransferRequest } from '../../../core/models/interfaces/asset-manage/assets.interface';
import { PopupWidgetService } from '../../../core/services/popup-widget/popup-widget.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { ListConfig, ListWidgetComponent, SelectionActionEvent } from '../../../shared/widgets/common/list-widget/list-widget.component';
import { forkJoin, Observable } from 'rxjs';
import { PopupField } from '../../../core/models/interfaces/popup-widget.interface';
import { Validators } from '@angular/forms';
import { AssetCategoriesService } from '../../../core/services/asset-categories/asset-categories.service';
import { AssetSubCategoriesService } from '../../../core/services/asset-categories/asset-sub-categories/asset-sub-categories.service';
import { FileUrlHelper } from '../../../core/helper/get-file-url';
import { AssignToType, DepreciationMethod, DisposalMethod } from '../../../core/enum/asset.enums';
import { UserProfileService } from '../../../core/services/users/user-profile.service';
import { AssetStatusService } from '../../../core/services/asset/asset-status/asset-status.service';

@Component({
  selector: 'app-manage-assets',
  imports: [
    PageHeaderComponent,
    ListWidgetComponent
  ],
  templateUrl: './manage-assets.component.html',
  styleUrl: './manage-assets.component.scss'
})
export class ManageAssetsComponent {
  private assetService = inject(ManageAssetsService);
  private supplierService = inject(SuppliersService);
  private departmentService = inject(DepartmentService);
  private subDepartmentService = inject(SubDepartmentService);
  private siteService = inject(SitesOrBranchesService);
  private areaService = inject(AssetAreaService);
  private popupService = inject(PopupWidgetService);
  private globalService = inject(GlobalService);
  private assetCategoryService = inject(AssetCategoriesService);
  private assetSubCategoriesService = inject(AssetSubCategoriesService);
  private userService = inject(UserProfileService);
  private assetStatusService = inject(AssetStatusService);

  assets = signal<AssetResponse[]>([]);
  loading = signal(false);
  filePreviewMap = signal<Map<string, string>>(new Map());
  fileMap = signal<Map<string, File>>(new Map());
  dropdownData = signal<AssetDropdownData>({
    categories: [],
    allSubCategories: [],
    suppliers: [],
    sites: [],
    allAreas: [],
    departments: [],
    allSubDepartments: [],
    depreciationMethods: [],
    assignToOptions: [],
    usersList: [],
    assetStatus: []
  });

  listConfig: ListConfig = {
    title: 'Asset Management',
    showSearch: true,
    showRefresh: true,
    showDownload: true,
    showAdd: true,
    addButtonLabel: 'Add Asset',
    selectable: true,
    compactMode: false,
    showSelectionActions: true,
    rowClickAction: 'view',
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    maxVisibleRows: 6,
    exportFileName: 'assets_export',
    emptyMessage: 'No assets found. Click "Add Asset" to create one.',
    actionsHeaderLabel: 'Actions', // ✅ Custom header
    columns: [
      {
        key: 'id',
        label: 'ID',
        sortable: true,
        type: 'number',
        width: '80px',
        align: 'left',
        visible: false
      },
      {
        key: 'assetId',
        label: 'Asset ID',
        sortable: true,
        type: 'text',
        width: '120px',
        align: 'left',
        visible: false
      },
      {
        key: 'name',
        label: 'Asset Name',
        sortable: true,
        type: 'avatar',
        width: '250px',
        align: 'left',
        visible: true,
        ellipsis: true,
        avatarField: 'imageUrl',
        nameField: 'name'
      },
      {
        key: 'assetBrand',
        label: 'Brand',
        sortable: true,
        type: 'text',
        width: '150px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'assetModelNo',
        label: 'Model',
        sortable: true,
        type: 'text',
        width: '150px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'categoryDisplay',
        label: 'Category',
        sortable: true,
        type: 'text',
        width: '150px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'subCategoryDisplay',
        label: 'Sub Category',
        sortable: true,
        type: 'text',
        width: '150px',
        align: 'left',
        visible: false,
        ellipsis: true
      },
      {
        key: 'unitPrice',
        label: 'Price',
        sortable: true,
        type: 'currency',
        width: '120px',
        align: 'right',
        visible: true
      },
      {
        key: 'supplierDisplay',
        label: 'Supplier',
        sortable: true,
        type: 'text',
        width: '180px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'assignToDisplay',
        label: 'Assign To',
        sortable: true,
        type: 'text',
        width: '150px',
        align: 'left',
        visible: false,
        ellipsis: true
      },
      {
        key: 'assignUserDisplay',
        label: 'Assigned User',
        sortable: true,
        type: 'text',
        width: '150px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'siteDisplay',
        label: 'Site',
        sortable: true,
        type: 'text',
        width: '150px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'areaDisplay',
        label: 'Area',
        sortable: true,
        type: 'text',
        width: '150px',
        align: 'left',
        visible: false,
        ellipsis: true
      },
      // ================= FILE COLUMNS =================
      {
        key: 'deliveryNote',
        label: 'Delivery Note',
        type: 'file',
        width: '180px',
        visible: false,
        filePreviewEnabled: true,
        fileDownloadEnabled: true,
        fileTypeIcon: true
      },

      {
        key: 'purchaseReceipt',
        label: 'Purchase Receipt',
        type: 'file',
        width: '180px',
        visible: false, // 🔥 optional by default
        filePreviewEnabled: true,
        fileDownloadEnabled: true,
        fileTypeIcon: true
      },

      {
        key: 'invoice',
        label: 'Invoice',
        type: 'file',
        width: '160px',
        visible: true,
        filePreviewEnabled: true,
        fileDownloadEnabled: true,
        fileTypeIcon: true
      },
      // {
      //   key: 'isAvilable',
      //   label: 'Available',
      //   sortable: true,
      //   type: 'boolean',
      //   width: '100px',
      //   align: 'center',
      //   visible: true
      // }
    ],
    actions: [
      // transfer, disposel button
      {
        key: 'transfer',
        label: 'Transfer',
        icon: 'swap_horiz',
        buttonType: 'icon',
        color: 'info',
        position: 'start',
        order: 1,
        tooltip: 'Transfer asset to another location or person',
        showIf: (item: AssetResponse) => item.isAvilable, // Only show for available assets
        popup: {
          title: 'Transfer Asset',
          subtitle: 'Transfer this asset to a new location or assignee',
          icon: 'swap_horiz',
          columns: 2,
          maxWidth: '900px',
          submitButtonText: 'Complete Transfer',
          fields: () => this.getTransferPopupFields(),
          onSubmit: (data, item) => this.handleTransferAsset(data, item)
        }
      },
      {
        key: 'dispose',
        label: 'Dispose',
        icon: 'delete_forever',
        buttonType: 'icon',
        color: 'warn',
        position: 'start',
        order: 2,
        tooltip: 'Dispose this asset',
        showIf: (item: AssetResponse) => item.isAvilable, // Only show for available assets
        popup: {
          title: 'Dispose Asset',
          subtitle: 'Mark this asset as disposed',
          icon: 'delete_forever',
          columns: 2,
          maxWidth: '800px',
          submitButtonText: 'Dispose Asset',
          fields: () => this.getDisposePopupFields(),
          onSubmit: (data, item) => this.handleDisposeAsset(data, item)
        }
      },
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

  private getTransferPopupFields(): PopupField[] {
    const dropdowns = this.dropdownData(); // ✅ ALWAYS LATEST DATA

    return [
      { key: 'divider_transfer', label: 'Transfer Details', type: 'divider', colSpan: 4 },

      {
        key: 'transferDate',
        label: 'Transfer Date',
        type: 'date',
        required: true,
        colSpan: 2,
        icon: 'event',
        value: new Date()
      },
      {
        key: 'dueDate',
        label: 'Due Date',
        type: 'date',
        colSpan: 2,
        icon: 'event'
      },
      {
        key: 'assignTo',
        label: 'Assign To',
        type: 'select',
        required: true,
        colSpan: 2,
        icon: 'assignment_ind',
        options: dropdowns.assignToOptions
      },
      {
        key: 'assignUserId',
        label: 'Employee',
        type: 'select',
        colSpan: 2,
        icon: 'person',
        options: dropdowns.usersList,
        showIf: { field: 'assignTo', value: AssignToType.User }
      },
      {
        key: 'siteId',
        label: 'Site',
        type: 'select',
        colSpan: 2,
        icon: 'location_city',
        options: dropdowns.sites,
        showIf: { field: 'assignTo', value: AssignToType.Site },
        cascadeFrom: undefined // 🔥 Clear any cascading
      },
      {
        key: 'areaId',
        label: 'Area',
        type: 'select',
        colSpan: 2,
        icon: 'map',
        showIf: { field: 'assignTo', value: AssignToType.Site },
        cascadeFrom: 'siteId', // 🔥 CASCADE FROM ASSIGNMENT SITE
        cascadeProperty: 'siteId',
        options: dropdowns.allAreas
      },
      {
        key: 'note',
        label: 'Transfer Note',
        type: 'textarea',
        colSpan: 4,
        rows: 2,
        icon: 'description'
      }
    ];
  }

  private handleTransferAsset(data: any, item: AssetResponse): Observable<any> {
    const transferRequest: AssetTransferRequest = {
      assetId: item.id,
      transferDate: data.transferDate,
      dueDate: data.dueDate,
      assignTo: data.assignTo,
      assignUserId: data.assignUserId,
      siteId: data.siteId,
      areaId: data.areaId,
      note: data.note
    };

    return this.assetService.transferAsset(transferRequest);
  }

  private getDisposePopupFields(): PopupField[] {
    return [
      { key: 'divider_dispose', label: 'Disposal Details', type: 'divider', colSpan: 4 },

      {
        key: 'disposalDate',
        label: 'Dispose Date',
        type: 'date',
        required: true,
        colSpan: 2,
        icon: 'event',
        value: new Date()
      },
      {
        key: 'disposalMethod',
        label: 'Disposal Method',
        type: 'select',
        required: true,
        colSpan: 2,
        icon: 'build',
        options: [
          { value: DisposalMethod.Sold, label: 'Sold' },
          { value: DisposalMethod.Donated, label: 'Donated' },
          { value: DisposalMethod.Recycled, label: 'Recycled' },
          { value: DisposalMethod.Destroyed, label: 'Destroyed' },
          { value: DisposalMethod.Other, label: 'Other' }
        ]
      },

      {
        key: 'disposalDocument',
        label: 'Disposal Document',
        type: 'file',
        colSpan: 4,
        icon: 'attach_file',
        acceptedFileTypes: '.pdf,.jpg,.png',
        maxFileSize: 10,
        helperText: 'Optional (No file chosen allowed)'
      },

      {
        key: 'comment',
        label: 'Comment',
        type: 'textarea',
        colSpan: 4,
        rows: 3,
        icon: 'description',
        placeholder: 'Reason for disposal'
      }
    ];
  }

  private handleDisposeAsset(
    data: any,
    item: AssetResponse
  ): Observable<any> {

    const disposeRequest: AssetDisposeRequest = {
      assetId: item.id,
      disposalDate: data.disposalDate,
      disposalMethod: data.disposalMethod,
      disposalDocument: data.disposalDocument,
      comment: data.comment
    };

    return this.assetService.disposeAsset(disposeRequest);
  }

  ngOnInit(): void {
    this.loadDropdownData();
    this.loadAssets();
  }

  private loadDropdownData() {
    forkJoin({
      suppliers: this.supplierService.getSuppliersByOrg(),
      departments: this.departmentService.getDepartments(),
      subDepartments: this.subDepartmentService.getSubDepartments(),
      sites: this.siteService.getMySites(),
      areas: this.areaService.getMyAreas(),
      categories: this.assetCategoryService.getCategoriesByOrg(),
      subCategories: this.assetSubCategoriesService.getSubCategoriesByOrg(),
      usersList: this.userService.getOrganizationUsers(),
      assetStatus: this.assetStatusService.getByOrganization()
    }).subscribe({
      next: (responses) => {
        this.dropdownData.update(current => ({
          ...current,
          suppliers: responses.suppliers.data?.map(s => ({
            value: s.id!,
            label: s.name!
          })) ?? [],
          departments: responses.departments.data?.map(d => ({
            value: d.id!,
            label: d.name!
          })) ?? [],
          allSubDepartments: responses.subDepartments.data?.map(sd => ({
            value: sd.id,
            label: sd.name ?? '',
            departmentId: sd.departmentId
          })) ?? [],
          sites: responses.sites.data?.map(s => ({
            value: s.id,
            label: s.name
          })) ?? [],
          allAreas: responses.areas.data?.map(a => ({
            value: a.id,
            label: a.name ?? '',
            siteId: a.siteId
          })) ?? [],
          categories: responses.categories.data?.map(c => ({
            value: c.id,
            label: c.name
          })) ?? [],
          allSubCategories: responses.subCategories.data?.map(sc => ({
            value: sc.id,
            label: sc.name ?? '',
            categoryId: sc.assetCategorieId
          })) ?? [],
          usersList: responses.usersList.data?.map(u => ({
            value: u.userProfileId, // ⚠️ use correct ID
            label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Unknown User'
          })) ?? [],
          assetStatus: responses.assetStatus.data?.map(s => ({
            value: s.id,
            label: s.name
          })) ?? [],

          // Depreciation methods from enum
          depreciationMethods: [
            { value: DepreciationMethod.None, label: 'None' },
            { value: DepreciationMethod.StraightLine, label: 'Straight Line' },
            { value: DepreciationMethod.DecliningBalance, label: 'Declining Balance' },
            { value: DepreciationMethod.DoubleDecliningBalance, label: 'Double Declining Balance' },
            { value: DepreciationMethod.OneFiftyDecliningBalance, label: '150% Declining Balance' },
            { value: DepreciationMethod.SumOfYearsDigits, label: 'Sum of Years Digits' }
          ],

          // Assignment options from enum
          assignToOptions: [
            { value: AssignToType.NotAssigned, label: 'Not Assigned' },
            { value: AssignToType.User, label: 'User' },
            { value: AssignToType.Site, label: 'Site' }
          ],

          // Mock data - replace with actual API calls
          // categories: [
          //   { value: 1, label: 'Electronics' },
          //   { value: 2, label: 'Furniture' },
          //   { value: 3, label: 'Vehicles' },
          //   { value: 4, label: 'Equipment' }
          // ],
          // allSubCategories: [
          //   { value: 1, label: 'Computers', categoryId: 1 },
          //   { value: 2, label: 'Mobile Devices', categoryId: 1 },
          //   { value: 3, label: 'Office Furniture', categoryId: 2 },
          //   { value: 4, label: 'Cars', categoryId: 3 }
          // ],
          // depreciationMethods: [
          //   { value: 1, label: 'Straight Line' },
          //   { value: 2, label: 'Declining Balance' },
          //   { value: 3, label: 'Sum of Years Digits' }
          // ],
          // assignToOptions: [
          //   { value: 1, label: 'Employee' },
          //   { value: 2, label: 'Site' },
          //   { value: 3, label: 'Location' }
          // ],
          // employees: [
          //   { value: 1, label: 'John Doe' },
          //   { value: 2, label: 'Jane Smith' }
          // ],
          // locations: [
          //   { value: 1, label: 'Warehouse A' },
          //   { value: 2, label: 'Office Floor 1' }
          // ]
        }));
      },
      error: (error) => {
        console.error('Error loading dropdown data:', error);
        this.globalService.showToastr('Failed to load form data', 'error');
      }
    });
  }

  /**
   * 🔥 FORM FIELDS - Used in ADD popup (includes assignment)
   */
  private getAssetFormFieldsForAdd(): PopupField[] {
    const dropdowns = this.dropdownData();

    return [
      // ============ SECTION 1: BASIC INFORMATION ============
      { key: 'divider_basic', label: 'Basic Information', type: 'divider', colSpan: 4 },

      {
        key: 'name',
        label: 'Asset Name',
        type: 'text',
        required: true,
        placeholder: 'Enter asset name',
        colSpan: 2,
        icon: 'inventory',
        validators: [Validators.minLength(2), Validators.maxLength(200)]
      },
      {
        key: 'assetBrand',
        label: 'Brand',
        type: 'text',
        required: true,
        placeholder: 'Enter brand name',
        colSpan: 1,
        icon: 'branding_watermark'
      },
      {
        key: 'assetModelNo',
        label: 'Model Number',
        type: 'text',
        required: true,
        placeholder: 'Enter model number',
        colSpan: 1,
        icon: 'tag'
      },
      {
        key: 'assetSerialNo',
        label: 'Serial Number',
        type: 'text',
        required: true,
        placeholder: 'Enter serial number',
        colSpan: 1,
        icon: 'qr_code_2'
      },
      {
        key: 'quantity',
        label: 'Quantity',
        type: 'number',
        placeholder: '1',
        colSpan: 1,
        icon: 'numbers',
        min: 1
      },
      {
        key: 'unitPrice',
        label: 'Unit Price',
        type: 'number',
        placeholder: '0.00',
        colSpan: 1,
        icon: 'attach_money',
        min: 0
      },
      {
        key: 'assetStatus',
        label: 'Asset Status',
        type: 'select',
        colSpan: 1,
        icon: 'fact_check',
        options: dropdowns.assetStatus,
        placeholder: 'Select Asset status'
      },
      {
        key: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Enter asset description (optional)',
        colSpan: 4,
        rows: 2,
        icon: 'description'
      },

      // ============ SECTION 2: Asset Classification ============
      { key: 'divider_category', label: 'Asset Classification', type: 'divider', colSpan: 4 },

      {
        key: 'category',
        label: 'Category',
        type: 'select',
        colSpan: 2,
        icon: 'category',
        options: dropdowns.categories,
        placeholder: 'Select category'
      },
      {
        key: 'subCategory',
        label: 'Sub Category',
        type: 'select',
        colSpan: 2,
        icon: 'label',
        placeholder: 'Select category first',
        cascadeFrom: 'category',
        cascadeProperty: 'categoryId',
        options: dropdowns.allSubCategories
      },
      {
        key: 'supplier',
        label: 'Supplier',
        type: 'select',
        colSpan: 1,
        icon: 'business',
        options: dropdowns.suppliers,
        placeholder: 'Select supplier'
      },
      {
        key: 'warranetyInMonth',
        label: 'Warranty (Months)',
        type: 'number',
        placeholder: '0',
        colSpan: 1,
        icon: 'verified_user',
        min: 0
      },
      {
        key: 'department',
        label: 'Department',
        type: 'select',
        colSpan: 1,
        icon: 'business_center',
        options: dropdowns.departments,
        placeholder: 'Select department'
      },
      {
        key: 'subDepartment',
        label: 'Sub Department',
        type: 'select',
        colSpan: 1,
        icon: 'account_tree',
        placeholder: 'Select department first',
        cascadeFrom: 'department',
        cascadeProperty: 'departmentId',
        options: dropdowns.allSubDepartments
      },

      // ============ SECTION 3: DEPRECIATION ============
      { key: 'divider_depreciation', label: 'Depreciation Details', type: 'divider', colSpan: 4 },

      {
        key: 'isDepreciable',
        label: 'Asset is Depreciable',
        type: 'toggle',
        value: false,
        colSpan: 4,
        icon: 'trending_down',
        helperText: 'Enable if this asset should be depreciated over time',
        color: 'primary'
      },
      {
        key: 'depreciableCost',
        label: 'Depreciable Cost',
        type: 'number',
        placeholder: '0.00',
        colSpan: 1,
        icon: 'payments',
        min: 0,
        showIf: { field: 'isDepreciable', value: true }
      },
      {
        key: 'salvageValue',
        label: 'Salvage Value',
        type: 'number',
        placeholder: '0.00',
        colSpan: 1,
        icon: 'account_balance',
        min: 0,
        showIf: { field: 'isDepreciable', value: true },
        conditionalRequired: { field: 'isDepreciable', value: true }
      },
      {
        key: 'depreciationInMonth',
        label: 'Depreciation Period (Months)',
        type: 'number',
        placeholder: '0',
        colSpan: 1,
        icon: 'schedule',
        min: 1,
        showIf: { field: 'isDepreciable', value: true },
        conditionalRequired: { field: 'isDepreciable', value: true }
      },
      {
        key: 'depreciationMethod',
        label: 'Depreciation Method',
        type: 'select',
        colSpan: 1,
        icon: 'calculate',
        options: dropdowns.depreciationMethods,
        placeholder: 'Select method',
        showIf: { field: 'isDepreciable', value: true },
        conditionalRequired: { field: 'isDepreciable', value: true }
      },
      {
        key: 'dateAquired',
        label: 'Date Acquired',
        type: 'date',
        colSpan: 2,
        showIf: { field: 'isDepreciable', value: true }
      },

      // ============ SECTION 4: IMPORTANT DATES ============
      {
        key: 'divider_dates',
        label: 'Important Dates',
        type: 'divider',
        colSpan: 4
      },
      {
        key: 'dateOfPurchase',
        label: 'Purchase Date',
        type: 'date',
        colSpan: 2,
        conditionalRequired: { field: 'isDepreciable', value: true }
      },
      {
        key: 'dateOfManufacture',
        label: 'Manufacturing Date',
        type: 'date',
        colSpan: 1
      },
      {
        key: 'yearOfValuation',
        label: 'Year of Valuation',
        type: 'date',
        colSpan: 1
      },

      // ============ SECTION 5: ASSIGNMENT DETAILS (ONLY IN ADD) ============
      {
        key: 'divider_assignment',
        label: 'Assignment Details',
        type: 'divider',
        colSpan: 4
      },
      {
        key: 'assignTo',
        label: 'Assign To',
        type: 'select',
        required: true,
        colSpan: 2,
        icon: 'assignment_ind',
        options: dropdowns.assignToOptions,
        placeholder: 'Select assignment type',
        value: AssignToType.NotAssigned
      },
      {
        key: 'assignUserId',
        label: 'Employee',
        type: 'select',
        colSpan: 2,
        icon: 'person',
        options: dropdowns.usersList,
        placeholder: 'Select employee',
        showIf: { field: 'assignTo', value: AssignToType.User }
      },
      {
        key: 'siteId',
        label: 'Assign to Site',
        type: 'select',
        colSpan: 2,
        icon: 'location_city',
        options: dropdowns.sites,
        placeholder: 'Select site',
        showIf: { field: 'assignTo', value: AssignToType.Site },
        cascadeFrom: undefined
      },
      {
        key: 'areaId',
        label: 'Site Area',
        type: 'select',
        colSpan: 2,
        icon: 'map',
        placeholder: 'Select site first',
        showIf: { field: 'assignTo', value: AssignToType.Site },
        cascadeFrom: 'siteId',
        cascadeProperty: 'siteId',
        options: dropdowns.allAreas
      },
      {
        key: 'transferDate',
        label: 'Transfer Date',
        type: 'date',
        colSpan: 1
      },
      {
        key: 'dueDate',
        label: 'Due Date',
        type: 'date',
        colSpan: 1
      },

      // ============ SECTION 6: FILE UPLOADS ============
      {
        key: 'divider_files',
        label: 'Documents & Images',
        type: 'divider',
        colSpan: 4
      },
      {
        key: 'imageUrl',
        label: 'Asset Image',
        type: 'file',
        colSpan: 2,
        icon: 'image',
        acceptedFileTypes: '.jpg,.jpeg,.png,.webp',
        maxFileSize: 5,
        helperText: 'Images only (Max 5MB)',
        previewWidth: '100%',
        previewHeight: '150px'
      },
      {
        key: 'deliveryNote',
        label: 'Delivery Note',
        type: 'file',
        colSpan: 2,
        icon: 'local_shipping',
        acceptedFileTypes: '.pdf,.jpg,.png',
        maxFileSize: 10,
        helperText: 'PDF or Image (Max 10MB)',
        previewWidth: '100%',
        previewHeight: '150px'
      },
      {
        key: 'purchaseReceipt',
        label: 'Purchase Receipt',
        type: 'file',
        colSpan: 2,
        icon: 'receipt',
        acceptedFileTypes: '.pdf,.jpg,.png',
        maxFileSize: 10,
        helperText: 'PDF or Image (Max 10MB)',
        previewWidth: '100%',
        previewHeight: '150px'
      },
      {
        key: 'invoice',
        label: 'Invoice',
        type: 'file',
        colSpan: 2,
        icon: 'receipt_long',
        acceptedFileTypes: '.pdf,.jpg,.png',
        maxFileSize: 10,
        helperText: 'PDF or Image (Max 10MB)',
        previewWidth: '100%',
        previewHeight: '150px'
      },

      // ============ SECTION 7: NOTES ============
      { key: 'divider_notes', label: 'Additional Notes', type: 'divider', colSpan: 4 },
      {
        key: 'note',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Any additional notes...',
        colSpan: 4,
        rows: 3,
        icon: 'note'
      }
    ];
  }

  /**
   * 🔥 FORM FIELDS - Used in EDIT popup (excludes assignment section)
   */
  private getAssetFormFieldsForEdit(): PopupField[] {
    const dropdowns = this.dropdownData();

    return [
      // ============ SECTION 1: BASIC INFORMATION ============
      { key: 'divider_basic', label: 'Basic Information', type: 'divider', colSpan: 4 },

      {
        key: 'name',
        label: 'Asset Name',
        type: 'text',
        required: true,
        placeholder: 'Enter asset name',
        colSpan: 2,
        icon: 'inventory',
        validators: [Validators.minLength(2), Validators.maxLength(200)]
      },
      {
        key: 'assetBrand',
        label: 'Brand',
        type: 'text',
        required: true,
        placeholder: 'Enter brand name',
        colSpan: 1,
        icon: 'branding_watermark'
      },
      {
        key: 'assetModelNo',
        label: 'Model Number',
        type: 'text',
        required: true,
        placeholder: 'Enter model number',
        colSpan: 1,
        icon: 'tag'
      },
      {
        key: 'assetSerialNo',
        label: 'Serial Number',
        type: 'text',
        required: true,
        placeholder: 'Enter serial number',
        colSpan: 1,
        icon: 'qr_code_2'
      },
      {
        key: 'quantity',
        label: 'Quantity',
        type: 'number',
        placeholder: '1',
        colSpan: 1,
        icon: 'numbers',
        min: 1
      },
      {
        key: 'unitPrice',
        label: 'Unit Price',
        type: 'number',
        placeholder: '0.00',
        colSpan: 1,
        icon: 'attach_money',
        min: 0
      },
      {
        key: 'assetStatus',
        label: 'Asset Status',
        type: 'select',
        colSpan: 1,
        icon: 'fact_check',
        options: dropdowns.assetStatus,
        placeholder: 'Select Asset status'
      },
      {
        key: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Enter asset description (optional)',
        colSpan: 4,
        rows: 2,
        icon: 'description'
      },

      // ============ SECTION 2: Asset Classification ============
      { key: 'divider_category', label: 'Asset Classification', type: 'divider', colSpan: 4 },

      {
        key: 'category',
        label: 'Category',
        type: 'select',
        colSpan: 2,
        icon: 'category',
        options: dropdowns.categories,
        placeholder: 'Select category'
      },
      {
        key: 'subCategory',
        label: 'Sub Category',
        type: 'select',
        colSpan: 2,
        icon: 'label',
        placeholder: 'Select category first',
        cascadeFrom: 'category',
        cascadeProperty: 'categoryId',
        options: dropdowns.allSubCategories
      },
      {
        key: 'supplier',
        label: 'Supplier',
        type: 'select',
        colSpan: 1,
        icon: 'business',
        options: dropdowns.suppliers,
        placeholder: 'Select supplier'
      },
      {
        key: 'warranetyInMonth',
        label: 'Warranty (Months)',
        type: 'number',
        placeholder: '0',
        colSpan: 1,
        icon: 'verified_user',
        min: 0
      },
      {
        key: 'department',
        label: 'Department',
        type: 'select',
        colSpan: 1,
        icon: 'business_center',
        options: dropdowns.departments,
        placeholder: 'Select department'
      },
      {
        key: 'subDepartment',
        label: 'Sub Department',
        type: 'select',
        colSpan: 1,
        icon: 'account_tree',
        placeholder: 'Select department first',
        cascadeFrom: 'department',
        cascadeProperty: 'departmentId',
        options: dropdowns.allSubDepartments
      },

      // ============ SECTION 3: DEPRECIATION ============
      { key: 'divider_depreciation', label: 'Depreciation Details', type: 'divider', colSpan: 4 },

      {
        key: 'isDepreciable',
        label: 'Asset is Depreciable',
        type: 'toggle',
        value: false,
        colSpan: 4,
        icon: 'trending_down',
        helperText: 'Enable if this asset should be depreciated over time',
        color: 'primary'
      },
      {
        key: 'depreciableCost',
        label: 'Depreciable Cost',
        type: 'number',
        placeholder: '0.00',
        colSpan: 1,
        icon: 'payments',
        min: 0,
        showIf: { field: 'isDepreciable', value: true }
      },
      {
        key: 'salvageValue',
        label: 'Salvage Value',
        type: 'number',
        placeholder: '0.00',
        colSpan: 1,
        icon: 'account_balance',
        min: 0,
        showIf: { field: 'isDepreciable', value: true },
        conditionalRequired: { field: 'isDepreciable', value: true }
      },
      {
        key: 'depreciationInMonth',
        label: 'Depreciation Period (Months)',
        type: 'number',
        placeholder: '0',
        colSpan: 1,
        icon: 'schedule',
        min: 1,
        showIf: { field: 'isDepreciable', value: true },
        conditionalRequired: { field: 'isDepreciable', value: true }
      },
      {
        key: 'depreciationMethod',
        label: 'Depreciation Method',
        type: 'select',
        colSpan: 1,
        icon: 'calculate',
        options: dropdowns.depreciationMethods,
        placeholder: 'Select method',
        showIf: { field: 'isDepreciable', value: true },
        conditionalRequired: { field: 'isDepreciable', value: true }
      },
      {
        key: 'dateAquired',
        label: 'Date Acquired',
        type: 'date',
        colSpan: 2,
        showIf: { field: 'isDepreciable', value: true }
      },

      // ============ SECTION 4: IMPORTANT DATES ============
      {
        key: 'divider_dates',
        label: 'Important Dates',
        type: 'divider',
        colSpan: 4
      },
      {
        key: 'dateOfPurchase',
        label: 'Purchase Date',
        type: 'date',
        colSpan: 2,
        conditionalRequired: { field: 'isDepreciable', value: true }
      },
      {
        key: 'dateOfManufacture',
        label: 'Manufacturing Date',
        type: 'date',
        colSpan: 1
      },
      {
        key: 'yearOfValuation',
        label: 'Year of Valuation',
        type: 'date',
        colSpan: 1
      },

      // ============ SECTION 5: FILE UPLOADS ============
      {
        key: 'divider_files',
        label: 'Documents & Images',
        type: 'divider',
        colSpan: 4
      },
      {
        key: 'imageUrl',
        label: 'Asset Image',
        type: 'file',
        colSpan: 2,
        icon: 'image',
        acceptedFileTypes: '.jpg,.jpeg,.png,.webp',
        maxFileSize: 5,
        helperText: 'Images only (Max 5MB)',
        previewWidth: '100%',
        previewHeight: '150px'
      },
      {
        key: 'deliveryNote',
        label: 'Delivery Note',
        type: 'file',
        colSpan: 2,
        icon: 'local_shipping',
        acceptedFileTypes: '.pdf,.jpg,.png',
        maxFileSize: 10,
        helperText: 'PDF or Image (Max 10MB)',
        previewWidth: '100%',
        previewHeight: '150px'
      },
      {
        key: 'purchaseReceipt',
        label: 'Purchase Receipt',
        type: 'file',
        colSpan: 2,
        icon: 'receipt',
        acceptedFileTypes: '.pdf,.jpg,.png',
        maxFileSize: 10,
        helperText: 'PDF or Image (Max 10MB)',
        previewWidth: '100%',
        previewHeight: '150px'
      },
      {
        key: 'invoice',
        label: 'Invoice',
        type: 'file',
        colSpan: 2,
        icon: 'receipt_long',
        acceptedFileTypes: '.pdf,.jpg,.png',
        maxFileSize: 10,
        helperText: 'PDF or Image (Max 10MB)',
        previewWidth: '100%',
        previewHeight: '150px'
      },

      // ============ SECTION 6: NOTES ============
      { key: 'divider_notes', label: 'Additional Notes', type: 'divider', colSpan: 4 },
      {
        key: 'note',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Any additional notes...',
        colSpan: 4,
        rows: 3,
        icon: 'note'
      }
    ];
  }

  /**
 * 🔥 VIEW FIELDS - Extended with view-only fields
 */
  private getAssetViewFields(assetDetail: AssetDetail): PopupField[] {
    const formFields = this.getAssetFormFieldsForAdd();

    // Add view-only fields at the beginning
    const viewOnlyFields: PopupField[] = [
      {
        key: 'divider_system',
        label: 'System Information',
        type: 'divider',
        colSpan: 4
      },
      {
        key: 'assetId',
        label: 'Asset ID',
        type: 'info',
        value: assetDetail.assetId,
        colSpan: 2,
        icon: 'fingerprint',
        color: 'primary'
      },
      {
        key: 'assetStatusDisplay',
        label: 'Asset Status',
        type: 'info',
        value: assetDetail.assetStatusDisplay || 'Not Set',
        colSpan: 2,
        icon: 'verified',
        color: 'accent'
      }
    ];

    // ✅ CRITICAL FIX: Only add depreciation schedule if data exists
    if (assetDetail.depreciationSchedule && assetDetail.depreciationSchedule.length > 0) {
      const scheduleHtml = this.formatDepreciationScheduleAsTable(assetDetail.depreciationSchedule);

      viewOnlyFields.push(
        {
          key: 'divider_depreciation_schedule',
          label: 'Depreciation Schedule',
          type: 'divider',
          colSpan: 4
        },
        {
          key: 'depreciationScheduleDisplay',
          label: 'Year-wise Depreciation',
          type: 'info', // ✅ Keep as 'info' type
          value: scheduleHtml,
          colSpan: 4,
          icon: 'table_chart',
          color: 'primary',
          helperText: `Total ${assetDetail.depreciationSchedule.length} years depreciation schedule`
        }
      );
    }

    // ✅ CRITICAL FIX: Filter out the depreciation schedule field from formFields
    // to prevent duplicate rendering
    const filteredFormFields = formFields.filter(field =>
      field.key !== 'depreciationScheduleDisplay' &&
      field.key !== 'divider_depreciation_schedule'
    );

    return [...viewOnlyFields, ...filteredFormFields];
  }

  /**
 * ✅ Format depreciation schedule as HTML table (duplicate from popup component)
 */
  private formatDepreciationScheduleAsTable(schedule: AssetDepreciation[]): string {
    if (!schedule || schedule.length === 0) {
      return '<div class="no-schedule-data">No depreciation schedule available</div>';
    }

    let html = '<div class="depreciation-schedule-wrapper">';
    html += '<div class="depreciation-schedule-table">';
    html += '<table cellspacing="0" cellpadding="0">';

    html += '<thead>';
    html += '<tr>';
    html += '<th class="col-year">Year</th>';
    html += '<th class="col-beginning">Beginning Value</th>';
    html += '<th class="col-depreciation">Depreciation</th>';
    html += '<th class="col-ending">Ending Value</th>';
    html += '</tr>';
    html += '</thead>';

    html += '<tbody>';
    schedule.forEach((item, index) => {
      const rowClass = index % 2 === 0 ? 'even-row' : 'odd-row';
      html += `<tr class="${rowClass}">`;
      html += `<td class="year-cell">${item.year}</td>`;
      html += `<td class="currency-cell">₹${this.formatCurrency(item.bookValueYearBegining)}</td>`;
      html += `<td class="currency-cell depreciation">₹${this.formatCurrency(item.depreciation)}</td>`;
      html += `<td class="currency-cell">₹${this.formatCurrency(item.bookValueYearEnd)}</td>`;
      html += '</tr>';
    });
    html += '</tbody>';

    html += '</table>';
    html += '</div>';
    html += '</div>';

    return html;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
  /**
   * 🆕 Alternative: Format as simple text list (if HTML not supported)
   */
  private formatDepreciationScheduleAsText(schedule: AssetDepreciation[]): string {
    if (!schedule || schedule.length === 0) {
      return 'No depreciation schedule available';
    }

    let text = '';
    schedule.forEach((item, index) => {
      text += `Year ${item.year}:\n`;
      text += `  Book Value (Beginning): ₹${this.formatCurrency(item.bookValueYearBegining)}\n`;
      text += `  Depreciation: ₹${this.formatCurrency(item.depreciation)}\n`;
      text += `  Book Value (End): ₹${this.formatCurrency(item.bookValueYearEnd)}\n`;
      if (index < schedule.length - 1) {
        text += '\n';
      }
    });

    return text;
  }


  private loadAssets() {
    this.loading.set(true);
    this.assetService.getByOrg().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Map file URLs to full paths
          const mapped = response.data.map(asset => ({
            ...asset,
            imageUrl: asset.imageUrl ? FileUrlHelper.getFullUrl(asset.imageUrl) : undefined,
            deliveryNote: asset.deliveryNote ? FileUrlHelper.getFullUrl(asset.deliveryNote) : undefined,
            purchaseReceipt: asset.purchaseReceipt ? FileUrlHelper.getFullUrl(asset.purchaseReceipt) : undefined,
            invoice: asset.invoice ? FileUrlHelper.getFullUrl(asset.invoice) : undefined
          }));
          this.assets.set(mapped);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading assets:', error);
        this.globalService.showToastr('Failed to load assets', 'error');
        this.loading.set(false);
      }
    });
  }

  onRowClick(event: { action: string; item: AssetResponse }) {
    if (event.action === 'view') {
      this.viewAsset(event.item);
    }
  }

  onActionClick(event: { action: string; item: AssetResponse }) {
    switch (event.action) {
      case 'view':
        this.viewAsset(event.item);
        break;
      case 'edit':
        this.editAsset(event.item);
        break;
      case 'delete':
        this.deleteAsset(event.item);
        break;
    }
  }

  onAddAsset() {
    const fields = this.getAssetFormFieldsForAdd();

    this.popupService.openAddPopup('Add New Asset', fields, {
      subtitle: 'Enter asset information below',
      icon: 'add_circle',
      columns: 4, // 4 columns for better layout
      maxWidth: '1400px', // Large width
      maxHeight: '95vh', // Maximum height
      compactMode: false,
      disableClose: true
    }).subscribe(result => {
      if (result && result.action === 'submit') {
        this.handleAddAsset(result.data);
      }
    });
  }

  private handleAddAsset(formData: any) {
    console.log('📝 Adding new asset from form:', formData);

    // 🔥 Map form data to AssetRequest
    const assetRequest: AssetRequest = {
      assetBrand: formData.assetBrand,
      assetModelNo: formData.assetModelNo,
      assetSerialNo: formData.assetSerialNo,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      subCategory: formData.subCategory,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      supplier: formData.supplier,
      siteId: formData.siteId,
      areaId: formData.areaId,
      department: formData.department,
      subDepartment: formData.subDepartment,
      warranetyInMonth: formData.warranetyInMonth,
      // assetStatus: formData.assetStatus,
      isDepreciable: formData.isDepreciable,
      depreciableCost: formData.depreciableCost,
      salvageValue: formData.salvageValue,
      depreciationInMonth: formData.depreciationInMonth,
      depreciationMethod: formData.depreciationMethod,
      dateAquired: formData.dateAquired,
      dateOfPurchase: formData.dateOfPurchase,
      dateOfManufacture: formData.dateOfManufacture,
      yearOfValuation: formData.yearOfValuation,
      assignTo: formData.assignTo,
      assignUserId: formData.assignUserId,
      assignSiteId: formData.siteId,
      assignAreaId: formData.areaId,
      transferDate: formData.transferDate,
      dueDate: formData.dueDate,
      note: formData.note
    };

    // 🔥 Map file fields (File objects from form)
    if (formData.ImageFile instanceof File) {
      assetRequest.imageFile = formData.ImageFile;
    }
    if (formData.DeliveryNoteFile instanceof File) {
      assetRequest.deliveryNoteFile = formData.DeliveryNoteFile;
    }
    if (formData.PurchaseReceiptFile instanceof File) {
      assetRequest.purchaseReceiptFile = formData.PurchaseReceiptFile;
    }
    if (formData.InvoiceFile instanceof File) {
      assetRequest.invoiceFile = formData.InvoiceFile;
    }

    console.log('📦 Sending asset request:', assetRequest);

    this.loading.set(true);
    this.assetService.createAsset(assetRequest).subscribe({
      next: (response) => {
        if (response.success) {
          this.globalService.showSnackbar('Asset created successfully', 'success');
          this.loadAssets();
        } else {
          this.globalService.showToastr('Failed to create asset', 'error');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error creating asset:', error);
        this.globalService.showToastr('Failed to create asset', 'error');
        this.loading.set(false);
      }
    });
  }

  viewAsset(asset: AssetResponse) {
    this.loading.set(true);
    this.assetService.getById(asset.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // ✅ DEBUG: Log the depreciation schedule
          console.log('📊 API Response:', response.data);
          console.log('📊 Depreciation Schedule:', response.data.depreciationSchedule);
          console.log('📊 Schedule Length:', response.data.depreciationSchedule?.length);

          const fullData: AssetDetail = {
            ...response.data,
            imageUrl: response.data.imageUrl ? FileUrlHelper.getFullUrl(response.data.imageUrl) : undefined,
            deliveryNote: response.data.deliveryNote ? FileUrlHelper.getFullUrl(response.data.deliveryNote) : undefined,
            purchaseReceipt: response.data.purchaseReceipt ? FileUrlHelper.getFullUrl(response.data.purchaseReceipt) : undefined,
            invoice: response.data.invoice ? FileUrlHelper.getFullUrl(response.data.invoice) : undefined
          };

          const fields = this.getAssetViewFields(fullData); // 🔥 USE VIEW FIELDS

          // ✅ DEBUG: Log the generated fields
          const depreciationField = fields.find(f => f.key === 'depreciationScheduleDisplay');
          console.log('📊 Depreciation Field:', depreciationField);
          if (depreciationField) {
            console.log('📊 Field Value Type:', typeof depreciationField.value);
            console.log('📊 Field Value Length:', depreciationField.value?.length);
            console.log('📊 Field Value Preview:', depreciationField.value?.substring(0, 200));
          }

          this.popupService.openViewPopup2('Asset Details', fields, fullData, {
            subtitle: `Asset ID: ${asset.assetId} | ${asset.name}`,
            icon: 'inventory',
            columns: 4,
            maxWidth: '1400px',
            maxHeight: '95vh',
            showEditButton: true
          }).subscribe(result => {
            if (result && result.action === 'edit') {
              this.editAsset(asset);
            }
          });
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading asset details:', error);
        this.globalService.showToastr('Failed to load asset details', 'error');
        this.loading.set(false);
      }
    });
  }

  editAsset(asset: AssetResponse) {
    this.loading.set(true);

    this.assetService.getById(asset.id).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          this.globalService.showToastr('Failed to load asset details', 'error');
          this.loading.set(false);
          return;
        }

        // 🔥 STEP 1: Process file URLs properly
        const fullData: AssetDetail = {
          ...response.data,

          // ✅ Convert backend URLs to full paths for preview
          imageUrl: response.data.imageUrl
            ? FileUrlHelper.getFullUrl(response.data.imageUrl)
            : undefined,
          deliveryNote: response.data.deliveryNote
            ? FileUrlHelper.getFullUrl(response.data.deliveryNote)
            : undefined,
          purchaseReceipt: response.data.purchaseReceipt
            ? FileUrlHelper.getFullUrl(response.data.purchaseReceipt)
            : undefined,
          invoice: response.data.invoice
            ? FileUrlHelper.getFullUrl(response.data.invoice)
            : undefined
        };

        // 🔥 STEP 2: Pre-populate file preview maps for popup
        if (fullData.imageUrl) {
          this.filePreviewMap.update(map => {
            const newMap = new Map(map);
            newMap.set('imageUrl', fullData.imageUrl!);
            return newMap;
          });
        }

        if (fullData.deliveryNote) {
          this.filePreviewMap.update(map => {
            const newMap = new Map(map);
            newMap.set('deliveryNote', fullData.deliveryNote!);
            return newMap;
          });
        }

        if (fullData.purchaseReceipt) {
          this.filePreviewMap.update(map => {
            const newMap = new Map(map);
            newMap.set('purchaseReceipt', fullData.purchaseReceipt!);
            return newMap;
          });
        }

        if (fullData.invoice) {
          this.filePreviewMap.update(map => {
            const newMap = new Map(map);
            newMap.set('invoice', fullData.invoice!);
            return newMap;
          });
        }

        const fields = this.getAssetFormFieldsForEdit();

        this.popupService.openEditPopup(
          'Edit Asset',
          fields,
          fullData, // ✅ Now includes full URLs for preview
          {
            subtitle: `Update information for ${fullData.name} | ID: ${fullData.assetId}`,
            icon: 'edit',
            columns: 4,
            maxWidth: '1400px',
            maxHeight: '95vh',
            disableClose: true
          }
        ).subscribe(result => {
          if (result?.action === 'submit') {
            // 🔥 STEP 3: Prepare update data with correct field names
            const updateData = this.prepareUpdateData(result.data, asset.id);
            this.handleEditAsset(updateData);
          }

          // 🔥 STEP 4: Clear file maps after dialog closes
          this.filePreviewMap.set(new Map());
          this.fileMap.set(new Map());
        });

        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading asset:', error);
        this.globalService.showToastr('Failed to load asset details', 'error');
        this.loading.set(false);
      }
    });
  }

  private prepareUpdateData(formData: any, assetId: number): AssetRequest {
    console.log('📝 Preparing update data from form:', formData);

    const updateData: AssetRequest = {
      id: assetId,
      assetBrand: formData.assetBrand,
      assetModelNo: formData.assetModelNo,
      assetSerialNo: formData.assetSerialNo,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      subCategory: formData.subCategory,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      supplier: formData.supplier,
      siteId: formData.siteId,
      areaId: formData.areaId,
      department: formData.department,
      subDepartment: formData.subDepartment,
      warranetyInMonth: formData.warranetyInMonth,
      // assetStatus: formData.assetStatus,
      isDepreciable: formData.isDepreciable,
      depreciableCost: formData.depreciableCost,
      salvageValue: formData.salvageValue,
      depreciationInMonth: formData.depreciationInMonth,
      depreciationMethod: formData.depreciationMethod,
      dateAquired: formData.dateAquired,
      dateOfPurchase: formData.dateOfPurchase,
      dateOfManufacture: formData.dateOfManufacture,
      yearOfValuation: formData.yearOfValuation,
      assignTo: formData.assignTo,
      assignUserId: formData.assignUserId,
      assignSiteId: formData.siteId,
      assignAreaId: formData.areaId,
      transferDate: formData.transferDate,
      dueDate: formData.dueDate,
      note: formData.note
    };

    // 🔥 CRITICAL: Map file fields correctly
    // Check for new File objects (user uploaded new files)
    if (formData.ImageFile instanceof File) {
      updateData.imageFile = formData.ImageFile;
      console.log('✅ NEW IMAGE FILE:', formData.ImageFile.name);
    } else if (formData.ImagePath) {
      updateData.imagePath = formData.ImagePath;
      console.log('✅ EXISTING IMAGE PATH:', formData.ImagePath);
    }

    if (formData.DeliveryNoteFile instanceof File) {
      updateData.deliveryNoteFile = formData.DeliveryNoteFile;
      console.log('✅ NEW DELIVERY NOTE FILE:', formData.DeliveryNoteFile.name);
    } else if (formData.DeliveryNotePath) {
      updateData.deliveryNotePath = formData.DeliveryNotePath;
      console.log('✅ EXISTING DELIVERY NOTE PATH:', formData.DeliveryNotePath);
    }

    if (formData.PurchaseReceiptFile instanceof File) {
      updateData.purchaseReceiptFile = formData.PurchaseReceiptFile;
      console.log('✅ NEW PURCHASE RECEIPT FILE:', formData.PurchaseReceiptFile.name);
    } else if (formData.PurchaseReceiptPath) {
      updateData.purchaseReceiptPath = formData.PurchaseReceiptPath;
      console.log('✅ EXISTING PURCHASE RECEIPT PATH:', formData.PurchaseReceiptPath);
    }

    if (formData.InvoiceFile instanceof File) {
      updateData.invoiceFile = formData.InvoiceFile;
      console.log('✅ NEW INVOICE FILE:', formData.InvoiceFile.name);
    } else if (formData.InvoicePath) {
      updateData.invoicePath = formData.InvoicePath;
      console.log('✅ EXISTING INVOICE PATH:', formData.InvoicePath);
    }

    console.log('📦 Final update data:', updateData);

    return updateData;
  }

  private handleEditAsset(formData: AssetRequest) {
    this.loading.set(true);
    this.assetService.updateAsset(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.globalService.showSnackbar('Asset updated successfully', 'success');
          this.loadAssets();
        } else {
          this.globalService.showToastr('Failed to update asset', 'error');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error updating asset:', error);
        this.globalService.showToastr('Failed to update asset', 'error');
        this.loading.set(false);
      }
    });
  }


  deleteAsset(asset: AssetResponse) {
    this.popupService.openDeleteConfirmation(
      `Are you sure you want to delete "${asset.name}"?`,
      'This action cannot be undone. All associated data will be permanently removed.'
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleDeleteAsset(asset.id);
      }
    });
  }

  private handleDeleteAsset(id: number) {
    this.loading.set(true);
    this.assetService.deleteAsset(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.globalService.showSnackbar('Asset deleted successfully', 'success');
          this.loadAssets();
        } else {
          this.globalService.showToastr('Failed to delete asset', 'error');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error deleting asset:', error);
        this.globalService.showToastr('Failed to delete asset', 'error');
        this.loading.set(false);
      }
    });
  }

  onSelectionAction(event: SelectionActionEvent) {
    switch (event.action) {
      case 'delete':
        this.deleteMultipleAssets(event.selectedItems);
        break;
      case 'export':
        this.exportSelectedAssets(event.selectedItems);
        break;
    }
  }

  deleteMultipleAssets(selectedAssets: AssetResponse[]) {
    const count = selectedAssets.length;
    const names = selectedAssets.slice(0, 3).map(a => a.name).join(', ');
    const message = count <= 3
      ? `Are you sure you want to delete ${names}?`
      : `Are you sure you want to delete ${names} and ${count - 3} other assets?`;

    this.popupService.openDeleteConfirmation(
      message,
      `This will permanently delete ${count} asset record${count > 1 ? 's' : ''}.`
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleBulkDelete(selectedAssets);
      }
    });
  }

  handleBulkDelete(selectedAssets: AssetResponse[]) {
    const idsToDelete = selectedAssets.map(a => a.id);
    let deletedCount = 0;
    let failedCount = 0;

    idsToDelete.forEach(id => {
      this.assetService.deleteAsset(id).subscribe({
        next: () => {
          deletedCount++;
          if (deletedCount + failedCount === idsToDelete.length) {
            this.assets.update(assets => assets.filter(a => !idsToDelete.includes(a.id)));
            this.globalService.showSnackbar(
              `${deletedCount} asset${deletedCount > 1 ? 's' : ''} deleted successfully`,
              'success'
            );
          }
        },
        error: () => {
          failedCount++;
          if (deletedCount + failedCount === idsToDelete.length) {
            this.assets.update(assets => assets.filter(a => !idsToDelete.includes(a.id)));
            this.globalService.showToastr(
              `${deletedCount} deleted, ${failedCount} failed`,
              failedCount > deletedCount ? 'error' : 'warning'
            );
          }
        }
      });
    });
  }

  exportSelectedAssets(selectedAssets: AssetResponse[]) {
    console.log(`Exporting ${selectedAssets.length} selected assets`);
    this.globalService.showSnackbar(`Exported ${selectedAssets.length} assets`, 'success');
  }

  onRefresh() {
    this.loadAssets();
  }

  onSelectionChange(selected: AssetResponse[]) {
    console.log('Selected assets:', selected);
  }
}
