using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.Asset_Status.Interface;
using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.Services.Asset_Status
{
    public class AssetStatusService : IAssetStatusService
    {
        private readonly IAssetStatusRepository _repo;
        private ILogger<AssetStatusService> _logger;
        private readonly ICompanyContext _companyContext;
        public AssetStatusService(IAssetStatusRepository repo, ILogger<AssetStatusService> logger, ICompanyContext companyContext)
        {
            _repo = repo;
            _logger = logger;
            _companyContext = companyContext;
        }

        public async Task<(bool isSuccess, List<AssetStatus> data, string message)> GetStatusesAsync()
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                // 🔥 Seed only once per org
                if (!await _repo.AnySystemStatusesAsync(orgId))
                {
                    var systemStatuses = Enum.GetValues(typeof(AssetStatusEnum))
                        .Cast<AssetStatusEnum>()
                        .Select(e => new AssetStatus
                        {
                            Name = e.ToString(),
                            EnumValue = (int)e,
                            IsSystem = true,
                            OrganizationId = orgId,

                            CreatedDate = DateTime.UtcNow,
                            ModifiedDate = DateTime.UtcNow,
                            CreatedBy = "System",
                            ModifiedBy = "System"
                        }).ToList();

                    await _repo.AddRangeAsync(systemStatuses);
                }

                var result = await _repo.GetAllAsync(orgId);
                _logger.LogInformation("Success in GetStatusesAsync");
                return (true, result, "Success");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetStatusesAsync");
                return (false, null, "Error in GetStatusesAsync");
            }
        }
    }
}
