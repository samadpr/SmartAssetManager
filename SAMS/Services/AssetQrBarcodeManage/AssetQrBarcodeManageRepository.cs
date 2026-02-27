using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.AssetQrBarcodeManage.DTOs;
using SAMS.Services.AssetQrBarcodeManage.Interface;
using SAMS.Services.Assets.DTOs;
using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.Services.AssetQrBarcodeManage
{
    public class AssetQrBarcodeManageRepository : IAssetQrBarcodeManageRepository
    {
        private readonly ApplicationDbContext _context;

        public AssetQrBarcodeManageRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<AssetQrBarcodeDto>> GetAssetQrBarcodesByOrg(Guid orgId)
        {
            try
            {
                var asset = await (from a in _context.Asset
                                   where a.OrganizationId == orgId && !a.Cancelled && a.IsAvilable == true

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

                                   select new AssetQrBarcodeDto
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
                                       AssetStatus = (AssetStatusEnum)a.AssetStatus!,
                                       AssetStatusDisplay = ((AssetStatusEnum)a.AssetStatus!).ToString(),
                                       SubDepartmentDisplay = subDepartment.Name,
                                       AssignUserDisplay = employee != null ? $"{employee.FirstName} {employee.LastName}" : null,
                                       UnitPrice = a.UnitPrice,
                                       WarranetyInMonth = a.WarranetyInMonth,
                                       ImageUrl = a.ImageUrl,
                                       IsAvilable = a.IsAvilable ?? false,
                                       Barcode = a.Barcode,
                                       Qrcode = a.Qrcode,
                                       QrcodeImage = a.QrcodeImage,
                                       Note = a.Note,
                                   })
                              .ToListAsync();

                if (asset != null)
                {
                    return asset;
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
