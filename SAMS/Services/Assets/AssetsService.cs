using AutoMapper;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using SAMS.API.AssetAPIs.RequestObject;
using SAMS.Data;
using SAMS.Helpers;
using SAMS.Helpers.Enum;
using SAMS.Models;
using SAMS.Services.Assets.DTOs;
using SAMS.Services.Assets.Interface;
using SAMS.Services.Common.Interface;
using SAMS.Services.Company.Interface;
using static SAMS.Helpers.Enum.AssetEnums;
using AssetStatus = SAMS.Helpers.Enum.AssetEnums.AssetStatusEnum;

namespace SAMS.Services.Assets
{
    public class AssetsService : IAssetsService
    {
        private readonly IAssetsRepository _repo;
        private readonly ILogger<AssetsService> _logger;
        private readonly ICompanyContext _companyContext;
        private readonly IMapper _mapper;
        private readonly FileUploadHelper _fileUploadHelper;
        private readonly BarcodeQRGenerator _barcodeQRGenerator;
        private readonly ApplicationDbContext _context;
        private readonly ICommonService _commonService;

        public AssetsService(
            IAssetsRepository repo, ILogger<AssetsService> logger, 
            ICompanyContext companyContext, 
            IMapper mapper, 
            FileUploadHelper fileUploadHelper, 
            BarcodeQRGenerator barcodeQRGenerator, 
            ApplicationDbContext context, 
            ICommonService commonService)
        {
            _repo = repo;
            _logger = logger;
            _companyContext = companyContext;
            _mapper = mapper;
            _fileUploadHelper = fileUploadHelper;
            _barcodeQRGenerator = barcodeQRGenerator;
            _context = context;
            _commonService = commonService;
        }

        public async Task<(bool success, string message, AssetDetailDto? data)> CreateAsync( AssetRequestObject request, string createdBy)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var orgId = _companyContext.OrganizationId;

                // Generate unique Asset ID
                var maxId = await _repo.GetMaxIdAsync(orgId);
                var assetId = BarcodeQRGenerator.GenerateAssetId(maxId);

                // Check if Asset ID already exists
                if (await _repo.ExistsAsync(assetId, orgId))
                    return (false, "Asset ID already exists", null!);

                // Handle file uploads
                string? imagePath = request.ImagePath;

                if (request.ImageFile != null)
                {
                    var (success, path, _) =
                        await _fileUploadHelper.UploadFileAsync(
                            request.ImageFile,
                            "AssetImages",
                            FileUploadHelper.GetAllowedExtensions("image"));

                    if (success)
                        imagePath = path;
                }

                string? deliveryPath = request.DeliveryNotePath;
                if (request.DeliveryNoteFile != null)
                {
                    var (success, path, _) =
                        await _fileUploadHelper.UploadFileAsync(
                            request.DeliveryNoteFile,
                            "DeliveryNotes",
                            FileUploadHelper.GetAllowedExtensions("all"));

                    if (success)
                        deliveryPath = path;
                }

                string? receiptPath = request.PurchaseReceiptPath;
                if (request.PurchaseReceiptFile != null)
                {
                    var (success, path, _) =
                        await _fileUploadHelper.UploadFileAsync(
                            request.PurchaseReceiptFile,
                            "PurchaseReceipts",
                            FileUploadHelper.GetAllowedExtensions("all"));

                    if (success)
                        receiptPath = path;
                }

                string? invoicePath = request.InvoicePath;
                if (request.InvoiceFile != null)
                {
                    var (success, path, _) =
                        await _fileUploadHelper.UploadFileAsync(
                            request.InvoiceFile,
                            "Invoices",
                            FileUploadHelper.GetAllowedExtensions("all"));

                    if (success)
                        invoicePath = path;
                }

                // Handle file uploads
                //var (imageSuccess, imagePath, imageMessage) = await _fileUploadHelper.UploadFileAsync(
                //    request.ImageUrl, "AssetImages", FileUploadHelper.GetAllowedExtensions("image"));

                //var (deliverySuccess, deliveryPath, deliveryMessage) = await _fileUploadHelper.UploadFileAsync(
                //    request.DeliveryNote, "DeliveryNotes", FileUploadHelper.GetAllowedExtensions("all"));

                //var (receiptSuccess, receiptPath, receiptMessage) = await _fileUploadHelper.UploadFileAsync(
                //    request.PurchaseReceipt, "PurchaseReceipts", FileUploadHelper.GetAllowedExtensions("all"));

                //var (invoiceSuccess, invoicePath, invoiceMessage) = await _fileUploadHelper.UploadFileAsync(
                //    request.Invoice, "Invoices", FileUploadHelper.GetAllowedExtensions("all"));

                // Create Asset entity
                var asset = new Asset
                {
                    AssetId = assetId,
                    AssetBrand = request.AssetBrand,
                    AssetModelNo = request.AssetModelNo,
                    AssetSerialNo = request.AssetSerialNo,
                    Name = request.Name,
                    Description = request.Description,
                    Category = request.Category,
                    SubCategory = request.SubCategory,
                    Quantity = request.Quantity,
                    UnitPrice = request.UnitPrice,
                    Supplier = request.Supplier,
                    SiteId = request.SiteId,
                    AreaId = request.AreaId,
                    Department = request.Department,
                    SubDepartment = request.SubDepartment,
                    WarranetyInMonth = request.WarranetyInMonth,

                    // Depreciation
                    IsDepreciable = request.IsDepreciable,
                    DepreciableCost = request.IsDepreciable ? request.DepreciableCost : 0,
                    SalvageValue = request.IsDepreciable ? request.SalvageValue : 0,
                    DepreciationInMonth = request.IsDepreciable ? request.DepreciationInMonth : 0,
                    DepreciationMethod = request.IsDepreciable ? (int?)request.DepreciationMethod : null,
                    DateAquired = request.IsDepreciable ? request.DateAquired : null,

                    // Files
                    ImageUrl = imagePath,
                    DeliveryNote = deliveryPath,
                    PurchaseReceipt = receiptPath,
                    Invoice = invoicePath,

                    // Dates
                    DateOfPurchase = request.DateOfPurchase,
                    DateOfManufacture = request.DateOfManufacture,
                    YearOfValuation = request.YearOfValuation,

                    // Assignment
                    AssetType = (int)AssetType.Created,
                    AssignTo = (int)request.AssignTo,
                    ApproverType = (int)ApproverType.Level1,
                    TransferAppStatus = (int)TransferApprovalStatus.Approved, // Auto-approve for creation

                    // Barcode & QR Code
                    Qrcode = assetId,
                    Barcode = _barcodeQRGenerator.GenerateBarcode(assetId),
                    QrcodeImage = _barcodeQRGenerator.GenerateQRCode(assetId),

                    Note = request.Note,
                    IsAvilable = true,
                    OrganizationId = orgId,
                    CreatedDate = DateTime.Now,
                    ModifiedDate = DateTime.Now,
                    CreatedBy = createdBy,
                    ModifiedBy = createdBy
                };

                // 1️⃣ Save Asset FIRST
                var createdAsset = await _repo.AddAsync(asset);

                // 🔒 Ensure AssetId is generated
                if (createdAsset.Id <= 0)
                {
                    throw new Exception("Asset ID not generated after save.");
                }

                // 2️⃣ NOW create assignment
                if (request.AssignTo == AssignToType.User && request.AssignUserId.HasValue)
                {
                    createdAsset.AssignUserId = request.AssignUserId.Value;
                    createdAsset.AssetStatus = request.AssetStatus;

                    var user = await _repo.UserGetByIdAsync(request.AssignUserId.Value, orgId);
                    createdAsset.SiteId = user.Site;
                    createdAsset.AreaId = user.Area;

                    await CreateAssetAssignmentAsync(createdAsset, request, createdBy);
                }
                else if (request.AssignTo == AssignToType.Location)
                {
                    createdAsset.SiteId = request.SiteId;
                    createdAsset.AreaId = request.AreaId;
                    createdAsset.AssetStatus = request.AssetStatus;

                    await CreateAssetAssignmentAsync(createdAsset, request, createdBy);
                }

                // Add history
                await AddAssetHistoryAsync(createdAsset.Id, 0, "Asset Created", createdBy);

                // DB changes completed successfully
                await transaction.CommitAsync();

                // Fetch complete details
                //var assetDetails = await _repo.GetDetailsByIdAsync(createdAsset.Id, orgId);

                return (true, $"Asset created successfully with ID: {assetId}", null);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating asset");
                return (false, $"Error creating asset: {ex.Message}", null!);
            }
        }

        public async Task<(bool success, string message, AssetDetailDto? data)> UpdateAsync( AssetRequestObject request, string modifiedBy)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (!request.Id.HasValue)
                    return (false, "Asset ID is required", null!);

                var orgId = _companyContext.OrganizationId;
                var asset = await _repo.GetByIdAsync(request.Id.Value, orgId);

                if (asset == null)
                    return (false, "Asset not found", null!);

                // Handle file uploads
                string? imagePath = request.ImagePath;
                if (request.ImageFile != null)
                {
                    var (success, path, _) =
                        await _fileUploadHelper.UploadFileAsync(
                            request.ImageFile,
                            "AssetImages",
                            FileUploadHelper.GetAllowedExtensions("image"));

                    if (success)
                        imagePath = path;
                }

                string? deliveryNotePath = request.DeliveryNotePath;
                if (request.DeliveryNoteFile != null)
                {
                    var (success, path, _) =
                        await _fileUploadHelper.UploadFileAsync(
                            request.DeliveryNoteFile,
                            "DeliveryNotes",
                            FileUploadHelper.GetAllowedExtensions("all"));

                    if (success)
                        deliveryNotePath = path;
                }

                string? receiptPath = request.PurchaseReceiptPath;
                if (request.PurchaseReceiptFile != null)
                {
                    var (success, path, _) =
                        await _fileUploadHelper.UploadFileAsync(
                            request.PurchaseReceiptFile,
                            "PurchaseReceipts",
                            FileUploadHelper.GetAllowedExtensions("all"));

                    if (success)
                        receiptPath = path;
                }

                string? invoicePath = request.InvoicePath;
                if (request.InvoiceFile != null)
                {
                    var (success, path, _) =
                        await _fileUploadHelper.UploadFileAsync(
                            request.InvoiceFile,
                            "Invoices",
                            FileUploadHelper.GetAllowedExtensions("all"));

                    if (success)
                        invoicePath = path;
                }

                // Handle file uploads (keep existing if no new upload)
                //var (imageSuccess, imagePath, imageMessage) = await _fileUploadHelper.UploadFileAsync(
                //    request.ImageUrl, "AssetImages", FileUploadHelper.GetAllowedExtensions("image"));

                //var (deliverySuccess, deliveryPath, deliveryMessage) = await _fileUploadHelper.UploadFileAsync(
                //    request.DeliveryNote, "DeliveryNotes", FileUploadHelper.GetAllowedExtensions("all"));

                //var (receiptSuccess, receiptPath, receiptMessage) = await _fileUploadHelper.UploadFileAsync(
                //    request.PurchaseReceipt, "PurchaseReceipts", FileUploadHelper.GetAllowedExtensions("all"));

                //var (invoiceSuccess, invoicePath, invoiceMessage) = await _fileUploadHelper.UploadFileAsync(
                //    request.Invoice, "Invoices", FileUploadHelper.GetAllowedExtensions("all"));

                // Update asset properties
                asset.AssetBrand = request.AssetBrand;
                asset.AssetModelNo = request.AssetModelNo;
                asset.AssetSerialNo = request.AssetSerialNo;
                asset.Name = request.Name;
                asset.Description = request.Description;
                asset.Category = request.Category;
                asset.SubCategory = request.SubCategory;
                asset.Quantity = request.Quantity;
                asset.UnitPrice = request.UnitPrice;
                asset.Supplier = request.Supplier;
                asset.Department = request.Department;
                asset.SubDepartment = request.SubDepartment;
                asset.WarranetyInMonth = request.WarranetyInMonth;
                asset.AssetStatus = request.AssetStatus;

                // Depreciation
                asset.IsDepreciable = request.IsDepreciable;
                asset.DepreciableCost = request.IsDepreciable ? request.DepreciableCost : 0;
                asset.SalvageValue = request.IsDepreciable ? request.SalvageValue : 0;
                asset.DepreciationInMonth = request.IsDepreciable ? request.DepreciationInMonth : 0;
                asset.DepreciationMethod = request.IsDepreciable ? (int?)request.DepreciationMethod : null;

                // Update files only if new ones uploaded
                asset.ImageUrl = imagePath;
                asset.DeliveryNote = deliveryNotePath;
                asset.PurchaseReceipt = receiptPath;
                asset.Invoice = invoicePath;

                // Dates
                asset.DateOfPurchase = request.DateOfPurchase;
                asset.DateOfManufacture = request.DateOfManufacture;
                asset.YearOfValuation = request.YearOfValuation;
                asset.Note = request.Note;

                asset.ModifiedDate = DateTime.Now;
                asset.ModifiedBy = modifiedBy;

                // Regenerate barcode/QR if needed
                //asset.Barcode = _barcodeQRGenerator.GenerateBarcode(asset.AssetId);
                //asset.QrcodeImage = _barcodeQRGenerator.GenerateQRCode(asset.AssetId);

                // Handle initial assignment
                //if (request.AssignTo == AssignToType.User && request.AssignUserId.HasValue)
                //{
                //    asset.AssignUserId = request.AssignUserId.Value;
                //    asset.AssetStatus = request.AssetStatus;
                //    var user = await _repo.UserGetByIdAsync(request.AssignUserId.Value, orgId);
                //    asset.SiteId = user.Site;
                //    asset.Area = user.Area;

                //    // Create assignment record
                //    await CreateAssetAssignmentAsync(asset, request, modifiedBy);
                //}
                //else if (request.AssignTo == AssignToType.Location)
                //{
                //    asset.SiteId = request.AssignSiteId;
                //    asset.Area = request.AssignAreaId;
                //    asset.AssetStatus = request.AssetStatus;

                //    // Create assignment record
                //    await CreateAssetAssignmentAsync(asset, request, modifiedBy);
                //}

                var updatedAsset = await _repo.UpdateAsync(asset);

                // Add history
                await AddAssetHistoryAsync(asset.Id, asset.AssignUserId ?? 0, "Asset Updated", modifiedBy);

                // DB changes completed successfully
                await transaction.CommitAsync();

                // Fetch complete details
                //var assetDetails = await _repo.GetDetailsByIdAsync(asset.Id, orgId);

                return (true, "Asset updated successfully", null);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error updating asset");
                return (false, $"Error updating asset: {ex.Message}", null!);
            }
        }

        public async Task<(bool success, string message, AssetDetailDto data)> GetByIdAsync(long id)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var asset = await _repo.GetDetailsByIdAsync(id, orgId);

                if (asset == null)
                    return (false, "Asset not found", null!);

                // Calculate depreciation schedule if asset is depreciable
                if (asset.IsDepreciable && asset.DateOfPurchase.HasValue && asset.DepreciationMethod.HasValue && asset.DepreciationInMonth.HasValue && asset.DepreciationInMonth > 0)
                {
                    asset.DepreciationSchedule = await CalculateDepreciationScheduleAsync(asset);
                }


                return (true, "Asset retrieved successfully", asset);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving asset");
                return (false, $"Error retrieving asset: {ex.Message}", null!);
            }
        }
        public async Task<(bool success, string message, IEnumerable<AssetDetailDto> data)> GetByOrgIdWithValidAssetsAsync()
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var asset = await _repo.GetAssetDetailsByOrgIdWithAvailableAsync(orgId);

                if (asset == null)
                    return (false, "Asset not found", null!);

                return (true, "Asset retrieved successfully", asset);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving asset");
                return (false, $"Error retrieving asset: {ex.Message}", null!);
            }
        }

        public async Task<List<AssetDepreciationDto>> CalculateDepreciationScheduleAsync(AssetDetailDto asset)
        {
            var schedule = new List<AssetDepreciationDto>();

            if (!asset.IsDepreciable || !asset.DateOfPurchase.HasValue || !asset.DepreciationMethod.HasValue)
                return schedule;

            try
            {
                switch (asset.DepreciationMethod.Value)
                {
                    case DepreciationMethod.StraightLine:
                        schedule = CalculateStraightLine(asset);
                        break;

                    case DepreciationMethod.DecliningBalance:
                        schedule = CalculateDecliningBalance(asset, 1.0m);
                        break;

                    case DepreciationMethod.DoubleDecliningBalance:
                        schedule = CalculateDecliningBalance(asset, 2.0m);
                        break;

                    case DepreciationMethod.OneFiftyDecliningBalance:
                        schedule = CalculateDecliningBalance(asset, 1.5m);
                        break;

                    case DepreciationMethod.SumOfYearsDigits:
                        schedule = CalculateSumOfYearsDigits(asset);
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating depreciation schedule");
            }

            return schedule;
        }

        private List<AssetDepreciationDto> CalculateStraightLine(AssetDetailDto asset)
        {
            var schedule = new List<AssetDepreciationDto>();

            decimal assetCost = (asset.DepreciableCost ?? 0) - (asset.SalvageValue ?? 0);
            int depreciationMonths = asset.DepreciationInMonth ?? 0;

            if (assetCost <= 0 || depreciationMonths <= 0)
                return schedule;

            decimal currentYearMonths = 12 - asset.DateOfPurchase.Value.Month + 1;
            decimal noOfYears = depreciationMonths / 12m;
            decimal depreciationPerMonth = assetCost / depreciationMonths;
            decimal depreciationPerYear = depreciationPerMonth * 12;
            decimal bookValueYearEnd = 0;

            for (int i = 0; i < noOfYears; i++)
            {
                var yearSchedule = new AssetDepreciationDto
                {
                    Year = asset.DateOfPurchase.Value.Year + i
                };

                if (i == 0)
                {
                    yearSchedule.BookValueYearBegining = Math.Round(assetCost, 2);
                    yearSchedule.Depreciation = Math.Round(depreciationPerMonth * currentYearMonths, 2);
                    yearSchedule.BookValueYearEnd = Math.Round(assetCost - yearSchedule.Depreciation, 2);
                }
                else
                {
                    yearSchedule.BookValueYearBegining = Math.Round(bookValueYearEnd, 2);
                    yearSchedule.Depreciation = Math.Round(depreciationPerYear, 2);
                    yearSchedule.BookValueYearEnd = Math.Round(yearSchedule.BookValueYearBegining - depreciationPerYear, 2);
                }

                bookValueYearEnd = yearSchedule.BookValueYearEnd;
                schedule.Add(yearSchedule);
            }

            return schedule;
        }

        private List<AssetDepreciationDto> CalculateDecliningBalance(AssetDetailDto asset, decimal multiplier)
        {
            var schedule = new List<AssetDepreciationDto>();

            decimal assetCost = asset.DepreciableCost ?? 0;
            int depreciationMonths = asset.DepreciationInMonth ?? 0;

            if (assetCost <= 0 || depreciationMonths <= 0)
                return schedule;

            decimal currentYearMonths = 12 - asset.DateOfPurchase.Value.Month + 1;
            decimal noOfYears = depreciationMonths / 12m;
            decimal depreciationRatePerYear = (100m / noOfYears) * multiplier;
            decimal depreciationRatePerMonth = depreciationRatePerYear / 12m;
            decimal bookValueYearEnd = 0;

            for (int i = 0; i < noOfYears; i++)
            {
                var yearSchedule = new AssetDepreciationDto
                {
                    Year = asset.DateOfPurchase.Value.Year + i
                };

                if (i == 0)
                {
                    yearSchedule.BookValueYearBegining = Math.Round(assetCost, 2);
                    yearSchedule.Depreciation = Math.Round(
                        assetCost * (depreciationRatePerMonth * currentYearMonths) / 100m, 2);
                    yearSchedule.BookValueYearEnd = Math.Round(
                        assetCost - yearSchedule.Depreciation, 2);
                }
                else
                {
                    yearSchedule.BookValueYearBegining = Math.Round(bookValueYearEnd, 2);
                    yearSchedule.Depreciation = Math.Round(
                        bookValueYearEnd * depreciationRatePerYear / 100m, 2);
                    yearSchedule.BookValueYearEnd = Math.Round(
                        yearSchedule.BookValueYearBegining - yearSchedule.Depreciation, 2);
                }

                bookValueYearEnd = yearSchedule.BookValueYearEnd;
                schedule.Add(yearSchedule);
            }

            return schedule;
        }

        private List<AssetDepreciationDto> CalculateSumOfYearsDigits(AssetDetailDto asset)
        {
            var schedule = new List<AssetDepreciationDto>();

            decimal assetCost = (asset.DepreciableCost ?? 0) - (asset.SalvageValue ?? 0);
            int depreciationMonths = asset.DepreciationInMonth ?? 0;

            if (assetCost <= 0 || depreciationMonths <= 0)
                return schedule;

            decimal currentYearMonths = 12 - asset.DateOfPurchase.Value.Month + 1;
            int noOfYears = depreciationMonths / 12;
            decimal bookValueYearEnd = 0;

            // Calculate sum of years
            int sumOfYears = 0;
            for (int i = 1; i <= noOfYears; i++)
            {
                sumOfYears += i;
            }

            for (int i = 0; i < noOfYears; i++)
            {
                var yearSchedule = new AssetDepreciationDto
                {
                    Year = asset.DateOfPurchase.Value.Year + i
                };

                if (i == 0)
                {
                    decimal depreciationRatePerMonth = (noOfYears / (decimal)sumOfYears) / 12m;
                    yearSchedule.BookValueYearBegining = Math.Round(assetCost, 2);
                    yearSchedule.Depreciation = Math.Round(
                        assetCost * depreciationRatePerMonth * currentYearMonths, 2);
                    yearSchedule.BookValueYearEnd = Math.Round(
                        assetCost - yearSchedule.Depreciation, 2);
                }
                else
                {
                    decimal depreciationRatePerYear = (noOfYears - i) / (decimal)sumOfYears;
                    yearSchedule.BookValueYearBegining = Math.Round(bookValueYearEnd, 2);
                    yearSchedule.Depreciation = Math.Round(
                        assetCost * depreciationRatePerYear, 2);
                    yearSchedule.BookValueYearEnd = Math.Round(
                        yearSchedule.BookValueYearBegining - yearSchedule.Depreciation, 2);
                }

                bookValueYearEnd = yearSchedule.BookValueYearEnd;
                schedule.Add(yearSchedule);
            }

            return schedule;
        }

        public async Task<(bool success, string message)> DeleteAsync(long id, string deletedBy)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;
                var result = await _repo.SoftDeleteAsync(id, orgId, deletedBy);

                if (result)
                {
                    await AddAssetHistoryAsync(id, 0, "Asset Deleted", deletedBy);
                    return (true, "Asset deleted successfully");
                }

                return (false, "Asset not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting asset");
                return (false, $"Error deleting asset: {ex.Message}");
            }
        }

        private async Task CreateAssetAssignmentAsync(Asset asset, AssetRequestObject request, string createdBy)
        {
            var orgId = asset.OrganizationId;
            var now = DateTime.Now;

            // 1️⃣ Get current ACTIVE assignment (if any)
            var previousAssign = await _context.AssetAssigned
                .FirstOrDefaultAsync(x =>
                    x.AssetId == asset.Id &&
                    x.OrganizationId == orgId &&
                    !x.Cancelled &&
                    x.Status == AssetEnums.AssetAssignedStatus.Assigned);

            // 2️⃣ Determine NEW assignment status
            string newStatus;

            if (request.AssignTo == AssignToType.NotAssigned)
            {
                newStatus = AssetEnums.AssetAssignedStatus.UnAssigned;
            }
            else if (request.AssignTo == AssignToType.Disposed)
            {
                newStatus = AssetEnums.AssetAssignedStatus.Disposed;
            }
            else if (previousAssign != null)
            {
                // Asset already assigned → reassignment
                newStatus = AssetEnums.AssetAssignedStatus.ReAssigned;
            }
            else
            {
                // First-time assignment
                newStatus = AssetEnums.AssetAssignedStatus.Assigned;
            }

            // 3️⃣ Close previous assignment (if exists and reassigned/disposed)
            if (previousAssign != null &&
                newStatus != AssetEnums.AssetAssignedStatus.Assigned)
            {
                previousAssign.Status = AssetEnums.AssetAssignedStatus.UnAssigned;
                previousAssign.ModifiedBy = createdBy;
                previousAssign.ModifiedDate = now;
            }

            // 4️⃣ Decide AssetType
            var assetType =
                request.AssignTo == AssignToType.Disposed
                    ? AssetType.Disposed
                    : previousAssign == null
                        ? AssetType.Created
                        : AssetType.Transferred;

            // 5️⃣ Create NEW assignment row
            var assignment = new AssetAssigned
            {
                AssetId = asset.Id,

                // FROM
                AssignedFrom = previousAssign?.Id,
                UserIdFrom = previousAssign?.UserId,
                SiteIdFrom = previousAssign?.SiteId,
                AreaIdFrom = previousAssign?.AreaId,

                // TO
                AssignTo = request.AssignTo,
                UserId = request.AssignTo == AssignToType.User
                            ? asset.AssignUserId
                            : null,
                SiteId = request.AssignTo == AssignToType.Location
                            ? asset.SiteId
                            : null,
                AreaId = request.AssignTo == AssignToType.Location
                            ? asset.AreaId
                            : null,

                // Meta
                AssetType = (int)assetType,
                TransferDate = request.TransferDate ?? now,
                DueDate = request.DueDate,

                ApproverType = (int)ApproverType.Level1,
                ApprovalStatus = (int)TransferApprovalStatus.Approved,

                Status = newStatus,

                // Audit
                OrganizationId = orgId,
                CreatedBy = createdBy,
                ModifiedBy = createdBy,
                CreatedDate = now,
                ModifiedDate = now
            };

            // 6️⃣ Persist
            await _context.AssetAssigned.AddAsync(assignment);
            await _context.SaveChangesAsync();
        }


        public async Task<(bool success, string message)> TransferAssetAsync(AssetTransferRequestDto request, string user)
        {
            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var orgId = _companyContext.OrganizationId;
                var now = DateTime.Now;

                // 1️⃣ Get asset
                var asset = await _repo.GetByIdAsync(request.AssetId, orgId);
                if (asset == null)
                    return (false, "Asset not found");

                // 2️⃣ Check role (Admin or not)
                var assigneeResult = await _commonService.GetUserWithRoleCheck(user);
                var isAdmin = assigneeResult.IsAdmin;

                // 3️⃣ Get current active assignment
                var currentAssign = await _repo.GetActiveAssignmentAsync(asset.Id, orgId);

                // 4️⃣ Decide approval + status
                var approvalStatus = isAdmin
                    ? TransferApprovalStatus.Approved
                    : TransferApprovalStatus.Pending;

                string newAssignStatus;

                if (approvalStatus == TransferApprovalStatus.Pending)
                {
                    // Waiting for approval
                    newAssignStatus = AssetEnums.AssetAssignedStatus.Hold;
                }
                else if (currentAssign == null)
                {
                    // First-time assignment
                    newAssignStatus = AssetEnums.AssetAssignedStatus.Assigned;
                }
                else
                {
                    // Transfer from one to another
                    newAssignStatus = AssetEnums.AssetAssignedStatus.ReAssigned;
                }

                // 5️⃣ Close previous assignment ONLY if approved
                if (currentAssign != null && approvalStatus == TransferApprovalStatus.Approved)
                {
                    currentAssign.Status = AssetEnums.AssetAssignedStatus.UnAssigned;
                    currentAssign.ModifiedBy = user;
                    currentAssign.ModifiedDate = now;

                    await _repo.UpdateAssignmentAsync(currentAssign);
                }

                // 6️⃣ Create new assignment row
                var newAssign = new AssetAssigned
                {
                    AssetId = asset.Id,

                    // FROM
                    AssignedFrom = currentAssign?.Id,
                    UserIdFrom = currentAssign?.UserId,
                    SiteIdFrom = currentAssign?.SiteId,
                    AreaIdFrom = currentAssign?.AreaId,

                    // TO
                    AssignTo = request.AssignTo,
                    UserId = request.AssignUserId,
                    SiteId = request.SiteId,
                    AreaId = request.AreaId,

                    AssetType = (int)AssetType.Transferred,
                    TransferDate = request.TransferDate,
                    DueDate = request.DueDate,

                    ApproverType = (int)ApproverType.Level1,
                    ApprovalStatus = (int)approvalStatus,

                    Status = newAssignStatus,

                    OrganizationId = orgId,
                    CreatedBy = user,
                    CreatedDate = now,
                    ModifiedBy = user,
                    ModifiedDate = now
                };

                await _repo.AddNewAssignmentAsync(newAssign);

                // 7️⃣ Update asset snapshot ONLY if approved
                if (approvalStatus == TransferApprovalStatus.Approved)
                {
                    asset.AssignTo = (int)request.AssignTo;
                    asset.AssignUserId = request.AssignUserId;
                    asset.SiteId = request.SiteId;
                    asset.AreaId = request.AreaId;
                    asset.AssetType = (int)AssetType.Transferred;
                    asset.AssetStatus = (int)AssetStatusEnum.InUse;
                    asset.TransferAppStatus = (int)TransferApprovalStatus.Approved;

                    asset.ModifiedBy = user;
                    asset.ModifiedDate = now;

                    await _repo.UpdateAsync(asset);
                }

                // 8️⃣ Asset history
                await _repo.AddAssetHistoryAsync(new AssetHistory
                {
                    AssetId = asset.Id,
                    AssignUserId = request.AssignUserId,
                    Action = approvalStatus == TransferApprovalStatus.Approved
                        ? "Asset Transferred"
                        : "Asset Transfer Requested (Pending Approval)",
                    OrganizationId = orgId,
                    CreatedBy = user,
                    CreatedDate = now,
                    ModifiedBy = user,
                    ModifiedDate = now
                });

                await tx.CommitAsync();
                return (true,
                    approvalStatus == TransferApprovalStatus.Approved
                        ? "Asset transferred successfully"
                        : "Asset transfer request submitted for approval");
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                _logger.LogError(ex, "Asset transfer failed");
                return (false, "Asset transfer failed");
            }
        }


        public async Task<(bool success, string message)> DisposeAssetAsync(AssetDisposeRequestDto request, string user)
        {
            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var orgId = _companyContext.OrganizationId;
                var now = DateTime.Now;

                // 1️⃣ Get asset
                var asset = await _repo.GetByIdAsync(request.AssetId, orgId);
                if (asset == null)
                    return (false, "Asset not found");

                // 2️⃣ Role check (Admin / Non-admin)
                var roleResult = await _commonService.GetUserWithRoleCheck(user);
                var isAdmin = roleResult.IsAdmin;

                var approvalStatus = isAdmin
                    ? TransferApprovalStatus.Approved
                    : TransferApprovalStatus.Pending;

                // 3️⃣ Upload disposal document (optional)
                string? disposalDocPath = null;
                if (request.DisposalDocument != null)
                {
                    var upload = await _fileUploadHelper.UploadFileAsync(
                        request.DisposalDocument,
                        "DisposalDocuments",
                        FileUploadHelper.GetAllowedExtensions("all"));

                    if (!upload.success)
                        return (false, upload.message);

                    disposalDocPath = upload.filePath;
                }

                // 4️⃣ Get current active assignment
                var activeAssign = await _repo.GetActiveAssignmentAsync(asset.Id, orgId);

                // 5️⃣ Close previous assignment ONLY if approved
                if (activeAssign != null && approvalStatus == TransferApprovalStatus.Approved)
                {
                    activeAssign.Status = AssetEnums.AssetAssignedStatus.UnAssigned;
                    activeAssign.ModifiedBy = user;
                    activeAssign.ModifiedDate = now;

                    await _repo.UpdateAssignmentAsync(activeAssign);
                }

                // 6️⃣ Decide assignment status
                var disposalAssignStatus =
                    approvalStatus == TransferApprovalStatus.Pending
                        ? AssetEnums.AssetAssignedStatus.Hold
                        : AssetEnums.AssetAssignedStatus.Disposed;

                // 7️⃣ Create disposal assignment row
                var disposalAssign = new AssetAssigned
                {
                    AssetId = asset.Id,

                    AssignedFrom = activeAssign?.Id,
                    UserIdFrom = activeAssign?.UserId,
                    SiteIdFrom = activeAssign?.SiteId,
                    AreaIdFrom = activeAssign?.AreaId,

                    AssignTo = AssignToType.Disposed,
                    AssetType = (int)AssetType.Disposed,

                    TransferDate = request.DisposalDate,

                    ApproverType = (int)ApproverType.Level1,
                    ApprovalStatus = (int)approvalStatus,

                    Status = disposalAssignStatus,

                    OrganizationId = orgId,
                    CreatedBy = user,
                    CreatedDate = now,
                    ModifiedBy = user,
                    ModifiedDate = now
                };

                await _repo.AddNewAssignmentAsync(disposalAssign);

                // 8️⃣ Update Asset snapshot ONLY if approved
                if (approvalStatus == TransferApprovalStatus.Approved)
                {
                    asset.AssignTo = (int)AssignToType.Disposed;
                    asset.AssetType = (int)AssetType.Disposed;
                    asset.AssetStatus = (int)AssetStatusEnum.Expired;

                    asset.DisposalDate = request.DisposalDate;
                    asset.DisposalMethod = (int)request.DisposalMethod;
                    asset.DisposalDocument = disposalDocPath;
                    asset.DisposalAppStatus = (int)TransferApprovalStatus.Approved;

                    asset.IsAvilable = false;
                    asset.ModifiedBy = user;
                    asset.ModifiedDate = now;

                    await _repo.UpdateAsync(asset);
                }

                // 9️⃣ Comment (always allowed)
                if (!string.IsNullOrWhiteSpace(request.Comment))
                {
                    _context.Comment.Add(new Comment
                    {
                        AssetId = asset.Id,
                        Message = request.Comment,
                        IsAdmin = isAdmin,
                        OrganizationId = orgId,
                        CreatedBy = user,
                        CreatedDate = now,
                        ModifiedBy = user,
                        ModifiedDate = now
                    });
                }

                // 🔟 Asset history
                await _repo.AddAssetHistoryAsync(new AssetHistory
                {
                    AssetId = asset.Id,
                    AssignUserId = asset.AssignUserId,
                    Action = approvalStatus == TransferApprovalStatus.Approved
                        ? "Asset Disposed"
                        : "Asset Disposal Requested (Pending Approval)",
                    OrganizationId = orgId,
                    CreatedBy = user,
                    CreatedDate = now,
                    ModifiedBy = user,
                    ModifiedDate = now
                });

                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                return (
                    true,
                    approvalStatus == TransferApprovalStatus.Approved
                        ? "Asset disposed successfully"
                        : "Asset disposal request submitted for approval"
                );
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                _logger.LogError(ex, "Asset disposal failed");
                return (false, "Asset disposal failed");
            }
        }

        public async Task<(bool success, string message)> ApproveAssetRequestAsync(AssetApprovalRequestDto request, string user)
        {
            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var orgId = _companyContext.OrganizationId;
                var now = DateTime.Now;

                var assignment = await _repo.GetAssignmentByIdAsync(request.AssignmentId, orgId);
                if (assignment == null)
                    return (false, "Assignment not found");

                if (assignment.ApprovalStatus != (int)TransferApprovalStatus.Pending)
                    return (false, "Request already processed");

                var asset = await _repo.GetByIdAsync(assignment.AssetId, orgId);
                if (asset == null)
                    return (false, "Asset not found");

                // 🔹 Close previous assignment
                if (assignment.AssignedFrom.HasValue)
                {
                    var previous = await _repo.GetAssignmentByIdAsync(
                        assignment.AssignedFrom.Value, orgId);

                    if (previous != null)
                    {
                        previous.Status = AssetEnums.AssetAssignedStatus.UnAssigned;
                        previous.ModifiedBy = user;
                        previous.ModifiedDate = now;
                    }
                }

                // 🔹 Update assignment
                assignment.ApprovalStatus = (int)TransferApprovalStatus.Approved;
                assignment.Status = assignment.AssignTo == AssignToType.Disposed
                    ? AssetEnums.AssetAssignedStatus.Disposed
                    : AssetEnums.AssetAssignedStatus.ReAssigned;

                assignment.ModifiedBy = user;
                assignment.ModifiedDate = now;

                // 🔹 Update asset snapshot
                asset.AssignTo = (int)assignment.AssignTo;
                asset.AssignUserId = assignment.UserId;
                asset.SiteId = assignment.SiteId;
                asset.AreaId = assignment.AreaId;
                asset.AssetType = assignment.AssetType;
                asset.TransferAppStatus = (int)TransferApprovalStatus.Approved;

                if (assignment.AssignTo == AssignToType.Disposed)
                {
                    asset.AssetStatus = (int)AssetStatusEnum.Expired;
                    asset.IsAvilable = false;
                    asset.DisposalAppStatus = (int)TransferApprovalStatus.Approved;
                }

                asset.ModifiedBy = user;
                asset.ModifiedDate = now;

                await _repo.UpdateAsync(asset);

                await _repo.AddAssetHistoryAsync(new AssetHistory
                {
                    AssetId = asset.Id,
                    AssignUserId = asset.AssignUserId,
                    Action = assignment.AssignTo == AssignToType.Disposed
                        ? "Asset Disposal Approved"
                        : "Asset Transfer Approved",
                    OrganizationId = orgId,
                    ModifiedBy = user,
                    ModifiedDate = now,
                    CreatedBy = user,
                    CreatedDate = now
                });

                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                return (true, "Request approved successfully");
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                _logger.LogError(ex, "Approval failed");
                return (false, "Approval failed");
            }
        }

        public async Task<(bool success, string message)> RejectAssetRequestAsync(AssetApprovalRequestDto request, string user)
        {
            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var orgId = _companyContext.OrganizationId;
                var now = DateTime.Now;

                var assignment = await _repo.GetAssignmentByIdAsync(request.AssignmentId, orgId);
                if (assignment == null)
                    return (false, "Assignment not found");

                if (assignment.ApprovalStatus != (int)TransferApprovalStatus.Pending)
                    return (false, "Request already processed");

                assignment.ApprovalStatus = (int)TransferApprovalStatus.Rejected;
                assignment.Status = AssetEnums.AssetAssignedStatus.UnAssigned;
                assignment.ModifiedBy = user;
                assignment.ModifiedDate = now;

                await _repo.AddAssetHistoryAsync(new AssetHistory
                {
                    AssetId = assignment.AssetId,
                    AssignUserId = assignment.UserId,
                    Action = assignment.AssignTo == AssignToType.Disposed
                        ? "Asset Disposal Rejected"
                        : "Asset Transfer Rejected",
                    OrganizationId = orgId,
                    ModifiedBy = user,
                    ModifiedDate = now,
                    CreatedBy = user,
                    CreatedDate = now
                });

                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                return (true, "Request rejected successfully");
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                _logger.LogError(ex, "Rejection failed");
                return (false, "Rejection failed");
            }
        }

        public async Task<(bool success, string message, IEnumerable<AssetApprovalListDto> data)> GetPendingApprovalAssetsAsync()
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                var list = await _repo.GetPendingApprovalsAsync(orgId);

                if (!list.Any())
                    return (true, "No approval requests found", Enumerable.Empty<AssetApprovalListDto>());

                return (true, "Pending approval assets retrieved successfully", list);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending approvals");
                return (false, "Failed to retrieve pending approvals", Enumerable.Empty<AssetApprovalListDto>());
            }
        }

        private async Task AddAssetHistoryAsync(long assetId, long employeeId, string action, string createdBy)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                var history = new AssetHistory
                {
                    AssetId = assetId,
                    AssignUserId = employeeId,
                    Action = action,
                    OrganizationId = orgId,
                    CreatedDate = DateTime.Now,
                    ModifiedDate = DateTime.Now,
                    CreatedBy = createdBy,
                    ModifiedBy = createdBy
                };

                await _repo.AddAssetHistoryAsync(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding asset history");
            }
        }

    }
}
