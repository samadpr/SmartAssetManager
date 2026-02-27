using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Services.Assets.DTOs;
using SAMS.Services.Reports.AssetReports.DTOs;
using SAMS.Services.Reports.AssetReports.Interface;
using static SAMS.Helpers.Enum.AssetEnums;
using AssetStatus = SAMS.Helpers.Enum.AssetEnums.AssetStatusEnum;

namespace SAMS.Services.Reports.AssetReports
{
    public class AssetReportRepository : IAssetReportRepository
    {
        private readonly ApplicationDbContext _context;
        public AssetReportRepository(ApplicationDbContext context)
        {
            _context = context;
        }


        public async Task<IEnumerable<AssetReportDto>> GetAssetFullInfoReportByOrg(Guid organizationId)
        {
            try
            {
                var assetsReport = await(from a in _context.Asset
                                  where a.OrganizationId == organizationId && !a.Cancelled && a.IsAvilable == true

                                  join cat in _context.AssetCategorie on a.Category equals cat.Id into catGroup
                                  from category in catGroup.DefaultIfEmpty()

                                  join subCat in _context.AssetSubCategories on a.SubCategory equals subCat.Id into subCatGroup
                                  from subCategory in subCatGroup.DefaultIfEmpty()

                                  join sup in _context.Suppliers on a.Supplier equals sup.Id into supGroup
                                  from supplier in supGroup.DefaultIfEmpty()

                                  join site in _context.AssetSite on a.SiteId equals site.Id into siteGroup
                                  from assetSite in siteGroup.DefaultIfEmpty()

                                  join area in _context.AssetArea on a.AreaId equals area.Id into areaGroup
                                  from assetArea in areaGroup.DefaultIfEmpty()

                                  join dept in _context.Department on a.Department equals dept.Id into deptGroup
                                  from department in deptGroup.DefaultIfEmpty()

                                  join subDept in _context.SubDepartment on a.SubDepartment equals subDept.Id into subDeptGroup
                                  from subDepartment in subDeptGroup.DefaultIfEmpty()

                                  join emp in _context.UserProfiles on a.AssignUserId equals emp.UserProfileId into empGroup
                                  from employee in empGroup.DefaultIfEmpty()

                                  join cb in _context.UserProfiles on new { Email = a.CreatedBy, OrgId = a.OrganizationId }
                                    equals new { Email = cb.Email, OrgId = cb.OrganizationId } into createdByGroup
                                    from createdByUser in createdByGroup.DefaultIfEmpty()

                                  select new AssetReportDto
                                  {
                                      Id = a.Id,
                                      AssetId = a.AssetId,
                                      AssetBrand = a.AssetBrand,
                                      AssetModelNo = a.AssetModelNo,
                                      AssetSerialNo = a.AssetSerialNo,
                                      Name = a.Name,
                                      Description = a.Description,
                                      Category = a.Category,
                                      CategoryDisplay = category.Name,
                                      SubCategory = a.SubCategory,
                                      SubCategoryDisplay = subCategory.Name,
                                      Quantity = a.Quantity,
                                      Supplier = a.Supplier,
                                      SupplierDisplay = supplier.Name,
                                      SiteId = a.SiteId,
                                      SiteDisplay = assetSite.Name,
                                      AreaId = a.AreaId,
                                      AreaDisplay = assetArea.Name,
                                      Department = a.Department,
                                      DepartmentDisplay = department.Name,
                                      SubDepartment = a.SubDepartment,
                                      SubDepartmentDisplay = subDepartment.Name,
                                      AssignUserId = a.AssignUserId,
                                      AssignUserDisplay = employee != null ? $"{employee.FirstName} {employee.LastName}" : null,
                                      UnitPrice = a.UnitPrice,
                                      WarranetyInMonth = a.WarranetyInMonth,
                                      IsDepreciable = a.IsDepreciable ?? false,
                                      DepreciableCost = a.DepreciableCost,
                                      SalvageValue = a.SalvageValue,
                                      DepreciationInMonth = a.DepreciationInMonth,
                                      DepreciationMethod = (DepreciationMethod?)a.DepreciationMethod,
                                      DateAquired = a.DateAquired,
                                      ImageUrl = a.ImageUrl,
                                      DateOfPurchase = a.DateOfPurchase,
                                      DateOfManufacture = a.DateOfManufacture,
                                      YearOfValuation = a.YearOfValuation,
                                      AssetStatus = (AssetStatus)a.AssetStatus!,
                                      AssetStatusDisplay = ((AssetStatus)a.AssetStatus!).ToString(),
                                      AssignTo = (AssignToType)a.AssignTo!,
                                      AssignToDisplay = ((AssignToType)a.AssignTo!).ToString(),
                                      AssetType = (AssetType)a.AssetType!,
                                      AssetTypeDisplay = ((AssetType)a.AssetType!).ToString(),
                                      IsAvilable = a.IsAvilable ?? false,
                                      Note = a.Note,
                                      CreatedDate = a.CreatedDate,
                                      CreatedByName = createdByUser != null ? $"{createdByUser.FirstName} {createdByUser.LastName}" : a.CreatedBy, 
                                      CreatedBy = a.CreatedBy,
                                      OrganizationId = a.OrganizationId
                                  })
                              .ToListAsync();


                if (assetsReport == null)
                    return null!;
                return assetsReport;
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }


        public async Task<IEnumerable<AssetReportDepreciationDto>> GetAssetDepreciationReportByOrg(Guid organizationId)
        {
            try
            {
                try
                {
                    var assetsDepreciationReport = await (from a in _context.Asset
                                              where a.OrganizationId == organizationId && !a.Cancelled && a.IsAvilable == true &&  a.IsDepreciable == true

                                              join cat in _context.AssetCategorie on a.Category equals cat.Id into catGroup
                                              from category in catGroup.DefaultIfEmpty()

                                              join subCat in _context.AssetSubCategories on a.SubCategory equals subCat.Id into subCatGroup
                                              from subCategory in subCatGroup.DefaultIfEmpty()

                                              join sup in _context.Suppliers on a.Supplier equals sup.Id into supGroup
                                              from supplier in supGroup.DefaultIfEmpty()

                                              join site in _context.AssetSite on a.SiteId equals site.Id into siteGroup
                                              from assetSite in siteGroup.DefaultIfEmpty()

                                              join area in _context.AssetArea on a.AreaId equals area.Id into areaGroup
                                              from assetArea in areaGroup.DefaultIfEmpty()

                                              join dept in _context.Department on a.Department equals dept.Id into deptGroup
                                              from department in deptGroup.DefaultIfEmpty()

                                              join subDept in _context.SubDepartment on a.SubDepartment equals subDept.Id into subDeptGroup
                                              from subDepartment in subDeptGroup.DefaultIfEmpty()

                                              join emp in _context.UserProfiles on a.AssignUserId equals emp.UserProfileId into empGroup
                                              from employee in empGroup.DefaultIfEmpty()

                                              join cb in _context.UserProfiles on new { Email = a.CreatedBy, OrgId = a.OrganizationId }
                                                equals new { Email = cb.Email, OrgId = cb.OrganizationId } into createdByGroup
                                              from createdByUser in createdByGroup.DefaultIfEmpty()

                                              select new AssetReportDepreciationDto
                                              {
                                                  Id = a.Id,
                                                  AssetId = a.AssetId,
                                                  AssetBrand = a.AssetBrand,
                                                  AssetModelNo = a.AssetModelNo,
                                                  AssetSerialNo = a.AssetSerialNo,
                                                  Name = a.Name,
                                                  Description = a.Description,
                                                  Category = a.Category,
                                                  CategoryDisplay = category.Name,
                                                  SubCategory = a.SubCategory,
                                                  SubCategoryDisplay = subCategory.Name,
                                                  Quantity = a.Quantity,
                                                  Supplier = a.Supplier,
                                                  SupplierDisplay = supplier.Name,
                                                  SiteId = a.SiteId,
                                                  SiteDisplay = assetSite.Name,
                                                  AreaId = a.AreaId,
                                                  AreaDisplay = assetArea.Name,
                                                  Department = a.Department,
                                                  DepartmentDisplay = department.Name,
                                                  SubDepartment = a.SubDepartment,
                                                  SubDepartmentDisplay = subDepartment.Name,
                                                  AssignUserId = a.AssignUserId,
                                                  AssignUserDisplay = employee != null ? $"{employee.FirstName} {employee.LastName}" : null,
                                                  UnitPrice = a.UnitPrice,
                                                  WarranetyInMonth = a.WarranetyInMonth,
                                                  IsDepreciable = a.IsDepreciable ?? false,
                                                  DepreciableCost = a.DepreciableCost,
                                                  SalvageValue = a.SalvageValue,
                                                  DepreciationInMonth = a.DepreciationInMonth,
                                                  DepreciationMethod = (DepreciationMethod?)a.DepreciationMethod,
                                                  DateAquired = a.DateAquired,
                                                  ImageUrl = a.ImageUrl,
                                                  DateOfPurchase = a.DateOfPurchase,
                                                  DateOfManufacture = a.DateOfManufacture,
                                                  YearOfValuation = a.YearOfValuation,
                                                  AssetStatus = (AssetStatus)a.AssetStatus!,
                                                  AssetStatusDisplay = ((AssetStatus)a.AssetStatus!).ToString(),
                                                  AssignTo = (AssignToType)a.AssignTo!,
                                                  AssignToDisplay = ((AssignToType)a.AssignTo!).ToString(),
                                                  AssetType = (AssetType)a.AssetType!,
                                                  AssetTypeDisplay = ((AssetType)a.AssetType!).ToString(),
                                                  IsAvilable = a.IsAvilable ?? false,
                                                  Note = a.Note,
                                                  CreatedDate = a.CreatedDate,
                                                  CreatedByName = createdByUser != null ? $"{createdByUser.FirstName} {createdByUser.LastName}" : a.CreatedBy,
                                                  CreatedBy = a.CreatedBy,
                                                  OrganizationId = a.OrganizationId
                                              })
                                  .ToListAsync();


                    if (assetsDepreciationReport == null)
                        return null!;
                    return assetsDepreciationReport;
                }
                catch (Exception ex)
                {
                    throw new Exception(ex.Message);
                }
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public async Task<IEnumerable<AssetDisposalReportDto>> GetAssetDisposalReportByOrg(Guid organizationId)
        {
            try
            {
                var assetDisposalReport = await (from a in _context.Asset
                                                 where a.OrganizationId == organizationId && !a.Cancelled && a.IsAvilable == false && a.AssetType == ((int)AssignToType.Disposed)

                                                 join cat in _context.AssetCategorie on a.Category equals cat.Id into catGroup
                                                 from category in catGroup.DefaultIfEmpty()

                                                 join subCat in _context.AssetSubCategories on a.SubCategory equals subCat.Id into subCatGroup
                                                 from subCategory in subCatGroup.DefaultIfEmpty()

                                                 join sup in _context.Suppliers on a.Supplier equals sup.Id into supGroup
                                                 from supplier in supGroup.DefaultIfEmpty()

                                                 join site in _context.AssetSite on a.SiteId equals site.Id into siteGroup
                                                 from assetSite in siteGroup.DefaultIfEmpty()

                                                 join area in _context.AssetArea on a.AreaId equals area.Id into areaGroup
                                                 from assetArea in areaGroup.DefaultIfEmpty()

                                                 join dept in _context.Department on a.Department equals dept.Id into deptGroup
                                                 from department in deptGroup.DefaultIfEmpty()

                                                 join subDept in _context.SubDepartment on a.SubDepartment equals subDept.Id into subDeptGroup
                                                 from subDepartment in subDeptGroup.DefaultIfEmpty()

                                                 join emp in _context.UserProfiles on a.AssignUserId equals emp.UserProfileId into empGroup
                                                 from employee in empGroup.DefaultIfEmpty()

                                                 join cb in _context.UserProfiles on new { Email = a.CreatedBy, OrgId = a.OrganizationId }
                                                   equals new { Email = cb.Email, OrgId = cb.OrganizationId } into createdByGroup
                                                 from createdByUser in createdByGroup.DefaultIfEmpty()

                                                 select new AssetDisposalReportDto
                                                 {
                                                     Id = a.Id,
                                                     AssetId = a.AssetId,
                                                     AssetBrand = a.AssetBrand,
                                                     AssetModelNo = a.AssetModelNo,
                                                     AssetSerialNo = a.AssetSerialNo,
                                                     Name = a.Name,
                                                     Description = a.Description,
                                                     Category = a.Category,
                                                     CategoryDisplay = category.Name,
                                                     SubCategory = a.SubCategory,
                                                     SubCategoryDisplay = subCategory.Name,
                                                     Quantity = a.Quantity,
                                                     Supplier = a.Supplier,
                                                     SupplierDisplay = supplier.Name,
                                                     SiteId = a.SiteId,
                                                     SiteDisplay = assetSite.Name,
                                                     AreaId = a.AreaId,
                                                     AreaDisplay = assetArea.Name,
                                                     Department = a.Department,
                                                     DepartmentDisplay = department.Name,
                                                     SubDepartment = a.SubDepartment,
                                                     SubDepartmentDisplay = subDepartment.Name,
                                                     AssignUserId = a.AssignUserId,
                                                     AssignUserDisplay = employee != null ? $"{employee.FirstName} {employee.LastName}" : null,
                                                     UnitPrice = a.UnitPrice,
                                                     WarranetyInMonth = a.WarranetyInMonth,
                                                     IsDepreciable = a.IsDepreciable ?? false,
                                                     DepreciableCost = a.DepreciableCost,
                                                     SalvageValue = a.SalvageValue,
                                                     DepreciationInMonth = a.DepreciationInMonth,
                                                     DepreciationMethod = (DepreciationMethod?)a.DepreciationMethod,
                                                     DateAquired = a.DateAquired,
                                                     ImageUrl = a.ImageUrl,
                                                     DateOfPurchase = a.DateOfPurchase,
                                                     DateOfManufacture = a.DateOfManufacture,
                                                     YearOfValuation = a.YearOfValuation,
                                                     AssetStatus = (AssetStatus)a.AssetStatus!,
                                                     AssetStatusDisplay = ((AssetStatus)a.AssetStatus!).ToString(),
                                                     AssignTo = (AssignToType)a.AssignTo!,
                                                     AssignToDisplay = ((AssignToType)a.AssignTo!).ToString(),
                                                     AssetType = (AssetType)a.AssetType!,
                                                     AssetTypeDisplay = ((AssetType)a.AssetType!).ToString(),
                                                     IsAvilable = a.IsAvilable ?? false,
                                                     Note = a.Note,
                                                     DisposalAppStatus = ((int)((TransferApprovalStatus)a.DisposalAppStatus!)),
                                                     DisposalDate = a.DisposalDate,
                                                     DisposalDocument = a.DisposalDocument,
                                                     DisposalMethod = (DisposalMethod?)a.DisposalMethod,
                                                     CreatedDate = a.CreatedDate,
                                                     CreatedByName = createdByUser != null ? $"{createdByUser.FirstName} {createdByUser.LastName}" : a.CreatedBy,
                                                     CreatedBy = a.CreatedBy,
                                                     OrganizationId = a.OrganizationId
                                                 })
                              .ToListAsync();

                if (assetDisposalReport.Count > 0)
                {
                    return assetDisposalReport;
                }
                else
                {
                    return null;
                }
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }
    }
}
