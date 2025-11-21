using AutoMapper;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.AssetCategory.DTOs;
using SAMS.Services.AssetCategory.Interface;

namespace SAMS.Services.AssetCategory
{
    public class AssetCategoriesService : IAssetCategoriesService
    {
        private readonly IAssetCategoriesRepository _repo;
        private readonly ILogger<AssetCategoriesService> _logger;
        private readonly IMapper _mapper;
        private readonly ICompanyContext _companyContext;

        public AssetCategoriesService(
            IAssetCategoriesRepository repo,
            ILogger<AssetCategoriesService> logger,
            IMapper mapper,
            ICompanyContext companyContext)
        {
            _repo = repo;
            _logger = logger;
            _mapper = mapper;
            _companyContext = companyContext;
        }

        public async Task<(bool success, string message, AssetCategoryDto? data)> CreateAsync(AssetCategoryDto dto, string createdBy)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                if (await _repo.ExistsAsync(dto.Name!, orgId))
                    return (false, $"Asset Category '{dto.Name}' already exists.", null);

                var entity = _mapper.Map<AssetCategorie>(dto);
                entity.CreatedBy = createdBy;
                entity.ModifiedBy = createdBy;
                entity.CreatedDate = DateTime.Now;
                entity.ModifiedDate = DateTime.Now;

                var result = await _repo.AddAsync(entity);
                return (true, "Created Successfully", _mapper.Map<AssetCategoryDto>(result));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating asset category");
                return (false, "Error creating asset category", null);
            }
        }

        public async Task<(bool success, string message, AssetCategoryDto? data)> UpdateAsync(AssetCategoryDto dto, string modifiedBy)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                var entity = await _repo.GetByIdAsync(dto.Id!.Value, orgId);

                if (entity == null)
                    return (false, "Not found in your organization", null);

                entity.Name = dto.Name;
                entity.Description = dto.Description;
                entity.ModifiedBy = modifiedBy;
                entity.ModifiedDate = DateTime.Now;

                await _repo.UpdateAsync(entity);

                return (true, "Updated Successfully", _mapper.Map<AssetCategoryDto>(entity));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating asset category");
                return (false, "Error updating asset category", null);
            }
        }

        public async Task<(bool success, string message, IEnumerable<AssetCategorie>? data)> GetAllAsync()
        {
            var list = await _repo.GetAllAsync();
            return (true, "Fetched Successfully", list);
        }

        public async Task<(bool success, string message, IEnumerable<AssetCategorie>? data)> GetByOrganizationAsync()
        {
            var orgId = _companyContext.OrganizationId;
            var list = await _repo.GetByOrganizationAsync(orgId);

            return (true, "Fetched Successfully", list);
        }

        public async Task<(bool success, string message)> DeleteAsync(long id, string deletedBy)
        {
            var orgId = _companyContext.OrganizationId;
            var result = await _repo.SoftDeleteAsync(id, orgId, deletedBy);

            return result
                ? (true, "Deleted Successfully")
                : (false, "Not Found");
        }
    }
}
