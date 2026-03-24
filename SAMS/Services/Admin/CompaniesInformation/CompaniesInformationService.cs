using AutoMapper;
using SAMS.Services.Admin.CompaniesInformation.DTOs;
using SAMS.Services.Admin.CompaniesInformation.Interface;
using SAMS.Services.Assets;
using SAMS.Services.Company.DTOs;

namespace SAMS.Services.Admin.CompaniesInformation
{
    public class CompaniesInformationService : ICompaniesInformationService
    {
        private readonly ICompaniesInformationRepository _repo;
        private readonly ILogger<CompaniesInformationService> _logger;
        private readonly IMapper _mapper;

        public CompaniesInformationService(ICompaniesInformationRepository repo, ILogger<CompaniesInformationService> logger, IMapper mapper)
        {
            _repo = repo;
            _logger = logger;
            _mapper = mapper;
        }

        // ── 1. Full page load ─────────────────────────────────────────────────
        public async Task<(bool success, string message, CompanyDetailDto? data)>
            GetCompanyDetailAsync(long companyId, string? orgId)
        {
            try
            {
                var data = await _repo.GetCompanyDetailAsync(companyId, orgId);

                if (data == null)
                    return (false, "Company not found.", null);

                return (true, "Success", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching company detail for companyId={CompanyId}", companyId);
                return (false, "An error occurred while fetching company details.", null);
            }
        }

        // ── 2. Stats refresh ──────────────────────────────────────────────────
        public async Task<(bool success, string message, CompanyStatsDto? data)>
            GetCompanyStatsAsync(long companyId, string? orgId)
        {
            try
            {
                var data = await _repo.GetCompanyStatsAsync(companyId, orgId);

                if (data == null)
                    return (false, "Company not found.", null);

                return (true, "Success", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching company stats for companyId={CompanyId}", companyId);
                return (false, "An error occurred while fetching company stats.", null);
            }
        }

        // ── 3. Login users ────────────────────────────────────────────────────
        public async Task<(bool success, string message, List<LoginAccessUserDto> data)>
            GetCompanyLoginUsersAsync(long companyId, string? orgId)
        {
            try
            {
                var data = await _repo.GetCompanyLoginUsersAsync(companyId, orgId);
                return (true, "Success", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching login users for companyId={CompanyId}", companyId);
                return (false, "An error occurred while fetching login users.", new List<LoginAccessUserDto>());
            }
        }

        // ── 4. Toggle active ──────────────────────────────────────────────────
        public async Task<(bool success, string message)>
            ToggleActiveAsync(ToggleActiveRequestDto request)
        {
            try
            {
                var (found, activated) = await _repo.ToggleActiveAsync(request.CompanyId, request.IsActive);

                if (!found)
                    return (false, "Company not found.");

                var msg = activated ? "Company activated successfully." : "Company suspended successfully.";
                return (true, msg);
            }
            catch (InvalidOperationException ex)
            {
                // Guard: no subscription plan assigned
                return (false, ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling active state for companyId={CompanyId}", request.CompanyId);
                return (false, "An error occurred while updating company status.");
            }
        }

        // ── 5. Get by id ──────────────────────────────────────────────────────
        public async Task<(bool success, string message, CompanyWithUserInfoDto? data)>
            GetByIdAsync(long id)
        {
            try
            {
                var data = await _repo.GetByIdAsync(id);

                if (data == null)
                    return (false, "Company not found.", null);

                return (true, "Company fetched successfully.", data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching company by id={Id}", id);
                return (false, "An error occurred while fetching the company.", null);
            }
        }
    }
}
