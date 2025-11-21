using AutoMapper;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.AssetSitesOrBranches.DTOs;
using SAMS.Services.AssetSitesOrBranches.Interface;

namespace SAMS.Services.AssetSitesOrBranches
{
    public class AssetSitesOrBranchesService : IAssetSitesOrBranchesService
    {
        private readonly IAssetSitesOrBranchesRepository _repo;
        private readonly ILogger<AssetSitesOrBranchesService> _logger;
        private readonly IMapper _mapper;
        private readonly ICompanyContext _companyContext;
        public AssetSitesOrBranchesService(IAssetSitesOrBranchesRepository assetSitesOrBranchesRepository, ILogger<AssetSitesOrBranchesService> logger, IMapper mapper, ICompanyContext context)
        {
            _repo = assetSitesOrBranchesRepository;
            _logger = logger;
            _mapper = mapper;
            _companyContext = context;
        }

        public async Task<(bool success, string message, AssetSiteDto? data)> CreateAsync(AssetSiteDto dto, string createdBy)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                if (await _repo.ExistsAsync(dto.Name!, orgId))
                    return (false, $"Branch/Site '{dto.Name}' already exists.", null);

                var entity = _mapper.Map<AssetSite>(dto);
                entity.CreatedBy = createdBy;
                entity.ModifiedBy = createdBy;
                entity.CreatedDate = DateTime.Now;
                entity.ModifiedDate = DateTime.Now;

                var result = await _repo.AddAsync(entity);

                return (true, "Created successfully", _mapper.Map<AssetSiteDto>(result));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in creating branch/site");
                return (false, "Error while creating branch/site", null);
            }
        }

        public async Task<(bool success, string message, AssetSiteDto? data)> UpdateAsync(AssetSiteDto dto, string modifiedBy)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                var entity = await _repo.GetByIdAsync(dto.Id!.Value, orgId);
                if (entity == null)
                    return (false, "Not found in your organization", null);

                entity.Name = dto.Name;
                entity.Description = dto.Description;
                entity.Address = dto.Address;
                entity.City = dto.City;
                entity.Type = dto.Type;
                entity.ModifiedBy = modifiedBy;
                entity.ModifiedDate = DateTime.Now;

                await _repo.UpdateAsync(entity);

                return (true, "Updated successfully", _mapper.Map<AssetSiteDto>(entity));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating branch/site");
                return (false, "Error updating branch/site", null);
            }
        }

        public async Task<(bool success, string message, IEnumerable<AssetSite>? data)> GetAllAsync()
        {
            var list = await _repo.GetAllAsync();
            return (true, "Fetched successfully", list);
        }

        public async Task<(bool success, string message, IEnumerable<AssetSiteDto>? data)> GetByOrganizationAsync()
        {
            var orgId = _companyContext.OrganizationId;
            var list = await _repo.GetByOrganizationAsync(orgId);

            return (true, "Fetched successfully", list);
        }

        public async Task<(bool success, string message, IEnumerable<AssetSiteDto>? data)> GetByCityIdAsync(long cityId)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                var list = await _repo.GetByCityIdAsync(cityId, orgId);

                if (!list.Any())
                    return (false, "No sites/branches found for this city.", null);

                return (true, "Fetched successfully", _mapper.Map<IEnumerable<AssetSiteDto>>(list));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching sites by city id");
                return (false, "Error fetching data", null);
            }
        }

        public async Task<(bool success, string message)> DeleteAsync(long id, string deletedBy)
        {
            var orgId = _companyContext.OrganizationId;

            bool result = await _repo.SoftDeleteAsync(id, orgId, deletedBy);
            return result
                ? (true, "Deleted successfully")
                : (false, "Not found");
        }
    }
}
