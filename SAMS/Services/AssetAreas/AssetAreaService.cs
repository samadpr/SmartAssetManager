using AutoMapper;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.AssetAreas.DTOs;
using SAMS.Services.AssetAreas.Interface;

namespace SAMS.Services.AssetAreas
{
    public class AssetAreaService : IAssetAreaService
    {
        private readonly IAssetAreaRepository _repo;
        private readonly ILogger<AssetAreaService> _logger;
        private readonly IMapper _mapper;
        private readonly ICompanyContext _companyContext;

        public AssetAreaService(
            IAssetAreaRepository repo,
            ILogger<AssetAreaService> logger,
            IMapper mapper,
            ICompanyContext companyContext)
        {
            _repo = repo;
            _logger = logger;
            _mapper = mapper;
            _companyContext = companyContext;
        }

        public async Task<(bool success, string message, AssetAreaDto? data)> CreateAsync(AssetAreaDto dto, string createdBy)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                if (await _repo.ExistsAsync(dto.Name!, dto.SiteId!.Value, orgId))
                    return (false, $"Area '{dto.Name}' already exists.", null);

                var entity = _mapper.Map<AssetArea>(dto);
                entity.CreatedBy = createdBy;
                entity.ModifiedBy = createdBy;
                entity.CreatedDate = DateTime.Now;
                entity.ModifiedDate = DateTime.Now;

                var result = await _repo.AddAsync(entity);

                return (true, "Created successfully", _mapper.Map<AssetAreaDto>(result));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating AssetArea");
                return (false, "Error while creating asset area", null);
            }
        }

        public async Task<(bool success, string message, AssetAreaDto? data)> UpdateAsync(AssetAreaDto dto, string modifiedBy)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                var entity = await _repo.GetByIdAsync(dto.Id!.Value, orgId);
                if (entity == null)
                    return (false, "Not found in your organization", null);

                entity.Name = dto.Name;
                entity.Description = dto.Description;
                entity.SiteId = dto.SiteId;
                entity.ModifiedBy = modifiedBy;
                entity.ModifiedDate = DateTime.Now;

                await _repo.UpdateAsync(entity);

                return (true, "Updated successfully", _mapper.Map<AssetAreaDto>(entity));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating AssetArea");
                return (false, "Error while updating asset area", null);
            }
        }

        public async Task<(bool success, string message, IEnumerable<AssetArea>? data)> GetAllAsync()
        {
            var list = await _repo.GetAllAsync();
            return (true, "Fetched successfully", list);
        }

        public async Task<(bool success, string message, IEnumerable<AssetAreaDto>? data)> GetByOrganizationAsync()
        {
            var orgId = _companyContext.OrganizationId;
            var list = await _repo.GetByOrganizationAsync(orgId);

            return (true, "Fetched successfully", list);
        }

        public async Task<(bool success, string message, IEnumerable<AssetAreaDto>? data)> GetBySiteIdAsync(long siteId)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                var list = await _repo.GetBySiteIdAsync(siteId, orgId);

                if (!list.Any())
                    return (false, "No areas found for this site.", null);

                return (true, "Fetched successfully", _mapper.Map<IEnumerable<AssetAreaDto>>(list));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching areas by site id");
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
