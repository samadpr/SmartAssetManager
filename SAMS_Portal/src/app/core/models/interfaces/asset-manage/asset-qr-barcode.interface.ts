export interface AssetQrBarcode {
  id?: number;
  assetId: string;
  assetBrand: string;
  assetModelNo: string;
  assetSerialNo: string;
  name: string;
  description: string;

  category?: number;
  subCategory?: number;
  quantity?: number;
  unitPrice?: number;
  supplier?: number;
  siteId?: number;
  areaId?: number;
  department?: number;
  subDepartment?: number;
  assetStatus?: number;
  warranetyInMonth?: number;

  imageUrl?: string;

  isAvilable: boolean;
  note?: string;
  barcode?: string;
  qrcode?: string;
  qrcodeImage?: string;

  assetStatusDisplay?: string;
  categoryDisplay?: string;
  subCategoryDisplay?: string;
  supplierDisplay?: string;
  siteDisplay?: string;
  areaDisplay?: string;
  departmentDisplay?: string;
  subDepartmentDisplay?: string;
  assignUserDisplay?: string;
}
