using AutoMapper;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.AssetCategory;
using SAMS.Services.AssetSubCategory.DTOs;
using SAMS.Services.AssetSubCategory.Interface;

namespace SAMS.Services.AssetSubCategory
{
    public class AssetSubCategoriesService : IAssetSubCategoriesService
    {
        private readonly IAssetSubCategoriesRepository _repo;
        private readonly ILogger<AssetSubCategoriesService> _logger;
        private readonly IMapper _mapper;
        private readonly ICompanyContext _companyContext;

        public AssetSubCategoriesService(
            IAssetSubCategoriesRepository repo,
            ILogger<AssetSubCategoriesService> logger,
            IMapper mapper,
            ICompanyContext companyContext)
        {
            _repo = repo;
            _logger = logger;
            _mapper = mapper;
            _companyContext = companyContext;
        }

        public async Task<(bool success, string message, AssetSubCategoryDto? data)> CreateAsync(AssetSubCategoryDto dto, string createdBy)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                if (await _repo.ExistsAsync(dto.Name!, dto.AssetCategorieId, orgId))
                    return (false, $"Sub Category '{dto.Name}' already exists under selected Category.", null);

                var entity = _mapper.Map<AssetSubCategorie>(dto);
                entity.CreatedBy = createdBy;
                entity.ModifiedBy = createdBy;
                entity.CreatedDate = DateTime.Now;
                entity.ModifiedDate = DateTime.Now;

                var result = await _repo.AddAsync(entity);

                var mapped = _mapper.Map<AssetSubCategoryDto>(result);
                mapped.AssetCategorieDisplay = result.AssetCategorie?.Name;

                return (true, "Created Successfully", mapped);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating sub category");
                return (false, "Error creating sub category", null);
            }
        }

        public async Task<(bool success, string message, AssetSubCategoryDto? data)> UpdateAsync(AssetSubCategoryDto dto, string modifiedBy)
        {
            try
            {
                var orgId = _companyContext.OrganizationId;

                var entity = await _repo.GetByIdAsync(dto.Id!, orgId);

                if (entity == null)
                    return (false, "Sub Category not found", null);

                entity.AssetCategorieId = dto.AssetCategorieId;
                entity.Name = dto.Name;
                entity.Description = dto.Description;
                entity.ModifiedBy = modifiedBy;
                entity.ModifiedDate = DateTime.Now;

                await _repo.UpdateAsync(entity);

                var mapped = _mapper.Map<AssetSubCategoryDto>(entity);
                mapped.AssetCategorieDisplay = entity.AssetCategorie?.Name;

                return (true, "Updated Successfully", mapped);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating sub category");
                return (false, "Error updating sub category", null);
            }
        }

        public async Task<(bool success, string message, IEnumerable<AssetSubCategoryDto>? data)> GetAllAsync()
        {
            var list = await _repo.GetAllAsync();
            var mapped = list.Select(x =>
            {
                var dto = _mapper.Map<AssetSubCategoryDto>(x);
                dto.AssetCategorieDisplay = x.AssetCategorie?.Name;
                return dto;
            });

            return (true, "Fetched Successfully", mapped);
        }

        public async Task<(bool success, string message, IEnumerable<AssetSubCategoryDto>? data)> GetByOrganizationAsync()
        {
            var orgId = _companyContext.OrganizationId;
            var list = await _repo.GetByOrganizationAsync(orgId);

            var mapped = list.Select(x =>
            {
                var dto = _mapper.Map<AssetSubCategoryDto>(x);
                dto.AssetCategorieDisplay = x.AssetCategorie?.Name;
                return dto;
            });

            return (true, "Fetched Successfully", mapped);
        }

        public async Task<(bool success, string message, IEnumerable<AssetSubCategoryDto>? data)> GetByCategoryIdAsync(long categoryId)
        {
            try
            {
                if (categoryId <= 0)
                    return (false, "Invalid category id", null);

                var orgId = _companyContext.OrganizationId;
                var list = await _repo.GetByCategoryIdAsync(categoryId, orgId);

                // map and inject AssetCategorieDisplay from navigation property
                var mapped = list.Select(x =>
                {
                    var dto = _mapper.Map<AssetSubCategoryDto>(x);
                    dto.AssetCategorieDisplay = x.AssetCategorie?.Name;
                    return dto;
                });

                return (true, "Fetched successfully", mapped);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while fetching subcategories by category id");
                return (false, "Error while fetching subcategories", null);
            }
        }

        public async Task<(bool success, string message)> DeleteAsync(long id, string deletedBy)
        {
            var orgId = _companyContext.OrganizationId;

            bool result = await _repo.SoftDeleteAsync(id, orgId, deletedBy);

            return result
                ? (true, "Deleted Successfully")
                : (false, "Not Found");
        }
    }
}
