using AutoMapper;
using SAMS.API.AssetIssueAPIs.RequestObject;
using SAMS.Data;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.Assets;
using SAMS.Services.AssetsIssue.DTOs;
using SAMS.Services.AssetsIssue.Interface;
using SAMS.Services.Common.Interface;
using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.Services.AssetsIssue
{
    public class AssetIssueService : IAssetIssueService
    {
        private readonly IAssetIssueRepository _repo;
        private readonly ILogger<AssetsService> _logger;
        private readonly ICompanyContext _companyContext;
        private readonly IMapper _mapper;
        private readonly ApplicationDbContext _context;
        private readonly FileUploadHelper _fileUploadHelper;
        private readonly ICommonService _commonService;

        public AssetIssueService(IAssetIssueRepository repo, ILogger<AssetsService> logger, ICompanyContext companyContext, IMapper mapper, ApplicationDbContext context, FileUploadHelper fileUploadHelper, ICommonService commonService)
        {
            _repo = repo;
            _logger = logger;
            _companyContext = companyContext;
            _mapper = mapper;
            _context = context;
            _fileUploadHelper = fileUploadHelper;
            _commonService = commonService;
        }

        public async Task<(bool success, string message, AssetIssueDto? data)> CreateAsync(AssetIssueRequestObject request, string createdBy)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var orgId = _companyContext.OrganizationId;

                string? invoicePath = null;

                // 🔹 Handle Invoice Upload
                if (request.InvoiceFile != null)
                {
                    var (success, path, message) =
                        await _fileUploadHelper.UploadFileAsync(
                            request.InvoiceFile,
                            "Assets/AssetIssue",
                            FileUploadHelper.GetAllowedExtensions("all"));

                    if (!success)
                        return (false, message, null);

                    invoicePath = path;
                }

                var raisedByUser = await _commonService.GetUserProfileAsync(createdBy, orgId);

                var entity = new AssetIssue
                {
                    AssetId = request.AssetId,
                    RaisedByUserId = raisedByUser.UserProfile.UserProfileId,
                    IssueTitle = request.IssueTitle,
                    IssueDescription = request.IssueDescription,
                    Status = request.Status,
                    ExpectedFixDate = request.ExpectedFixDate,
                    RepairCost = request.RepairCost,
                    Invoice = invoicePath,
                    Comment = request.Comment,

                    OrganizationId = orgId,
                    CreatedDate = DateTime.Now,
                    ModifiedDate = DateTime.Now,
                    CreatedBy = createdBy,
                    ModifiedBy = createdBy
                };

                var result = await _repo.AddAsync(entity);
                await transaction.CommitAsync();

                return (true, "Issue created successfully",
                    _mapper.Map<AssetIssueDto>(result));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating asset issue");
                return (false, "Error creating issue", null);
            }
        }

        public async Task<(bool success, string message, AssetIssueDto? data)> UpdateAsync(AssetIssueRequestObject request, string modifiedBy)
        {

            try
            {
                var orgId = _companyContext.OrganizationId;

                var entity = await _repo.GetByIdAsync(request.Id!.Value, orgId);
                if (entity == null)
                    return (false, "Issue not found in your organization", null);
                if (entity.Status == AssetIssueStatus.Resolved)
                    return (false, "Issue already resolved", null);

                string? invoicePath = entity.Invoice;

                if (request.InvoiceFile != null)
                {
                    // Delete old file
                    if (!string.IsNullOrEmpty(entity.Invoice))
                        _fileUploadHelper.DeleteFile(entity.Invoice);

                    var (success, path, message) =
                        await _fileUploadHelper.UploadFileAsync(
                            request.InvoiceFile,
                            "Assets/AssetIssue",
                            FileUploadHelper.GetAllowedExtensions("all"));

                    if (!success)
                        return (false, message, null);

                    invoicePath = path;
                }


                entity.Status = AssetIssueStatus.Resolved;
                entity.ResolvedDate = DateTime.Now;

                entity.IssueTitle = request.IssueTitle;
                entity.IssueDescription = request.IssueDescription;
                entity.Status = request.Status;
                entity.ExpectedFixDate = request.ExpectedFixDate;
                entity.ResolvedDate = request.ResolvedDate;
                entity.RepairCost = request.RepairCost;
                entity.Invoice = invoicePath;
                entity.Comment = request.Comment;

                entity.ModifiedBy = modifiedBy;
                entity.ModifiedDate = DateTime.Now;

                await _repo.UpdateAsync(entity);

                return (true, "Issue updated successfully",
                    _mapper.Map<AssetIssueDto>(entity));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating issue");
                return (false, "Error updating issue", null);
            }
        }

        public async Task<(bool success, string message, IEnumerable<AssetIssueDetailsDto>? data)> GetByOrganizationAsync()
        {
            var orgId = _companyContext.OrganizationId;

            var list = await _repo.GetByOrganizationAsync(orgId);

            return (true, "Fetched successfully", list);
        }

        public async Task<(bool success, string message, AssetIssueDetailsDto? data)> GetByIdAsync(long id)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                var entity = await _repo.GetByIdWithDetailsAsync(id, orgId);
                if (entity == null)
                    return (false, "Issue not found in your organization", null);

                return (true, "Fetched successfully", entity);
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Error fetching issue");
                return (false, "Error fetching issue", null);
            }
        }

        public async Task<(bool success, string message)> DeleteAsync(long id, string deletedBy)
        {
            var orgId = _companyContext.OrganizationId;

            bool result = await _repo.SoftDeleteAsync(id, orgId, deletedBy);

            return result
                ? (true, "Deleted successfully")
                : (false, "Issue not found");
        }

    }
}
