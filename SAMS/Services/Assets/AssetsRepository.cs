using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Helpers.Enum;
using SAMS.Models;
using SAMS.Services.Assets.DTOs;
using SAMS.Services.Assets.Interface;
using static SAMS.Helpers.Enum.AssetEnums;
using AssetStatus = SAMS.Helpers.Enum.AssetEnums.AssetStatusEnum;

namespace SAMS.Services.Assets
{
    public class AssetsRepository : IAssetsRepository
    {
        private readonly ApplicationDbContext _context;

        public AssetsRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Asset> AddAsync(Asset asset)
        {
            _context.Asset.Add(asset);
            await _context.SaveChangesAsync();
            return asset;
        }

        public async Task<Asset> UpdateAsync(Asset asset)
        {
            _context.Asset.Update(asset);
            await _context.SaveChangesAsync();
            return asset;
        }

        public async Task<Asset> GetByIdAsync(long id, Guid organizationId)
        {
            return await _context.Asset
                .FirstOrDefaultAsync(a => a.Id == id && a.OrganizationId == organizationId && !a.Cancelled);
        }
        public async Task<AssetDetailDto> GetDetailsByIdAsync(long id, Guid organizationId)
        {
            var asset = await (from a in _context.Asset
                               where a.Id == id && a.OrganizationId == organizationId && !a.Cancelled

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

                               select new AssetDetailDto
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
                                   DeliveryNote = a.DeliveryNote,
                                   PurchaseReceipt = a.PurchaseReceipt,
                                   Invoice = a.Invoice,
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
                                   Barcode = a.Barcode,
                                   Qrcode = a.Qrcode,
                                   QrcodeImage = a.QrcodeImage,
                                   Note = a.Note,
                                   CreatedDate = a.CreatedDate,
                                   CreatedBy = a.CreatedBy,
                                   OrganizationId = a.OrganizationId
                               })
                              .FirstOrDefaultAsync();

            if (asset != null)
            {
                // Load history
                //asset.AssetHistory = await GetAssetHistoryAsync(id);

                //// Load depreciation schedule
                //if (asset.IsDepreciable)
                //    asset.DepreciationSchedule = await CalculateDepreciationScheduleAsync(asset);

                //// Load comments
                //asset.Comments = await GetAssetCommentsAsync(id);
            }

            return asset;
        }

        public async Task<IEnumerable<AssetDetailDto>> GetAssetDetailsByOrgIdWithAvailableAsync(Guid organizationId)
        {
            try
            {
                var asset = await (from a in _context.Asset
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

                                   select new AssetDetailDto
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
                                       DeliveryNote = a.DeliveryNote,
                                       PurchaseReceipt = a.PurchaseReceipt,
                                       Invoice = a.Invoice,
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
                                       Barcode = a.Barcode,
                                       Qrcode = a.Qrcode,
                                       QrcodeImage = a.QrcodeImage,
                                       Note = a.Note,
                                       CreatedDate = a.CreatedDate,
                                       CreatedBy = a.CreatedBy,
                                       OrganizationId = a.OrganizationId
                                   })
                              .ToListAsync();

                if (asset != null)
                {
                    // Load history
                    //asset.AssetHistory = await GetAssetHistoryAsync(id);

                    //// Load depreciation schedule
                    //if (asset.IsDepreciable)
                    //    asset.DepreciationSchedule = await CalculateDepreciationScheduleAsync(asset);

                    //// Load comments
                    //asset.Comments = await GetAssetCommentsAsync(id);
                }
                if (asset == null)
                    return null!;
                return asset;
            }
            catch(Exception ex)
            {
                return null!;
            }
        }

        public async Task<long> GetMaxIdAsync(Guid organizationId)
        {
            var maxId = await _context.Asset
                .Where(a => a.OrganizationId == organizationId)
                .MaxAsync(a => (long?)a.Id) ?? 0;

            return maxId;
        }

        public async Task<bool> ExistsAsync(string assetId, Guid organizationId)
        {
            return await _context.Asset
                .AnyAsync(a => a.AssetId == assetId && a.OrganizationId == organizationId && !a.Cancelled);
        }

        public async Task<bool> SoftDeleteAsync(long id, Guid organizationId, string deletedBy)
        {
            var asset = await GetByIdAsync(id, organizationId);
            if (asset == null) return false;

            asset.Cancelled = true;
            asset.ModifiedBy = deletedBy;
            asset.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task AddAssetHistoryAsync(AssetHistory history)
        {
            _context.AssetHistory.Add(history);
            await _context.SaveChangesAsync();
        }

        public async Task<UserProfile> UserGetByIdAsync(long id, Guid organizationId)
        {
            var user = await _context.UserProfiles.FirstOrDefaultAsync(up =>
                up.UserProfileId == id && up.OrganizationId == organizationId && !up.Cancelled
            );

            return user ?? throw new KeyNotFoundException("User not found");
        }

        // asset assigned methords
        public async Task<AssetAssigned?> GetActiveAssignmentAsync(long assetId, Guid orgId)
        {
            return await _context.AssetAssigned
                .FirstOrDefaultAsync(x =>
                    x.AssetId == assetId &&
                    x.OrganizationId == orgId &&
                    !x.Cancelled &&
                    x.Status == AssetEnums.AssetAssignedStatus.Assigned);
        }

        public async Task AddNewAssignmentAsync(AssetAssigned entity)
        {
            _context.AssetAssigned.Add(entity);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAssignmentAsync(AssetAssigned entity)
        {
            _context.AssetAssigned.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task<AssetAssigned?> GetAssignmentByIdAsync(long assignmentId, Guid orgId)
        {
            return await _context.AssetAssigned
                .FirstOrDefaultAsync(x =>
                    x.Id == assignmentId &&
                    x.OrganizationId == orgId &&
                    !x.Cancelled);
        }

        public async Task<IEnumerable<AssetApprovalListDto>> GetPendingApprovalsAsync(Guid orgId)
        {
            return await (
                from aa in _context.AssetAssigned
                join a in _context.Asset on aa.AssetId equals a.Id

                // 🔹 JOIN REQUESTED USER BY EMAIL + ORG (with better fallback)
                join reqUser in _context.UserProfiles
                    on new { Email = aa.CreatedBy, OrgId = orgId }
                    equals new { Email = reqUser.Email, OrgId = reqUser.OrganizationId }
                    into reqUserGroup
                from requestedUser in reqUserGroup.DefaultIfEmpty()

                    // 🔹 JOIN ASSIGNED USER
                join assUser in _context.UserProfiles
                    on aa.UserId equals assUser.UserProfileId
                    into assUserGroup
                from assignUser in assUserGroup.DefaultIfEmpty()

                    // 🔹 JOIN SITE
                join site in _context.AssetSite on aa.SiteId equals site.Id into siteGroup
                from assetSite in siteGroup.DefaultIfEmpty()

                    // 🔹 JOIN AREA
                join area in _context.AssetArea on aa.AreaId equals area.Id into areaGroup
                from assetArea in areaGroup.DefaultIfEmpty()

                where aa.OrganizationId == orgId
                      && !aa.Cancelled
                      && aa.ApprovalStatus == (int)TransferApprovalStatus.Pending
                      && aa.Status == AssetEnums.AssetAssignedStatus.Hold

                orderby aa.CreatedDate descending

                select new AssetApprovalListDto
                {
                    AssignmentId = aa.Id,
                    AssetRowId = a.Id,
                    AssetId = a.AssetId,

                    AssetType = (AssetType)aa.AssetType!,
                    AssignTo = aa.AssignTo!.Value,

                    // 🔹 REQUESTED BY (RESOLVED)
                    RequestedByEmail = aa.CreatedBy,
                    RequestedByName = requestedUser != null
                        ? $"{requestedUser.FirstName} {requestedUser.LastName}".Trim()
                        : aa.CreatedBy,
                    RequestedByProfilePicture = requestedUser != null
                        ? requestedUser.ProfilePicture
                        : null,

                    RequestedDate = aa.CreatedDate,

                    // 🔹 ASSIGNED USER INFO
                    AssignUserId = aa.UserId,
                    AssignUserName = assignUser != null
                        ? $"{assignUser.FirstName} {assignUser.LastName}".Trim()
                        : null,
                    AssignProfilePicture = assignUser != null
                        ? assignUser.ProfilePicture
                        : null,

                    // 🔹 LOCATION INFO
                    SiteId = aa.SiteId,
                    SiteName = assetSite != null ? assetSite.Name : null,

                    AreaId = aa.AreaId,
                    AreaName = assetArea != null ? assetArea.Name : null,

                    // 🔹 STATUS
                    ApprovalStatus = TransferApprovalStatus.Pending,
                    Status = aa.Status,

                    // 🔹 ASSET IMAGE
                    AssetImageUrl = a.ImageUrl
                }
            ).ToListAsync();
        }



    }
}
