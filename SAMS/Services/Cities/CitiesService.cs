using AutoMapper;
using Humanizer;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.Cities.DTOs;
using SAMS.Services.Cities.Interface;

namespace SAMS.Services.Cities
{
    public class CitiesService : ICitiesService
    {
        readonly ICitiesRepository _repository;
        readonly ILogger<CitiesService> _logger;
        private readonly IMapper _mapper;
        private readonly ICompanyContext _companyContext;

        public CitiesService(ICitiesRepository repository, ILogger<CitiesService> logger, IMapper mapper, ICompanyContext companyContext)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
            _companyContext = companyContext;
        }

        public async Task<(bool isSuccess, string message, AssetCityDto? data)> AddCityAsync(AssetCityDto dto, string createdBy)
        {
            try
            {
                var organizationId = _companyContext.OrganizationId;
                if (await _repository.ExistsAsync(dto.Name!, organizationId))
                    return (false, $"City '{dto.Name}' already exists in your organization.", null);

                var entity = _mapper.Map<AssetCity>(dto);
                entity.CreatedBy = createdBy;
                entity.ModifiedBy = createdBy;
                entity.CreatedDate = DateTime.Now;
                entity.ModifiedDate = DateTime.Now;

                var result = await _repository.AddAsync(entity);
                return (true, "City created successfully", _mapper.Map<AssetCityDto>(result));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while adding city");
                return (false, "Error while adding city", null);
            }
        }

        public async Task<(bool isSuccess, string message, IEnumerable<AssetCityDto>? data)> GetCitiesAsync()
        {
            try
            {
                var result = await _repository.GetAllAsync();
                return (true, "Fetched successfully", _mapper.Map<IEnumerable<AssetCityDto>>(result));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while fetching cities");
                return (false, "Error while fetching cities", null);
            }
        }

        public async Task<(bool isSuccess, string message, AssetCityDto? data)> UpdateCityAsync(AssetCityDto dto, string modifiedBy)
        {
            try
            {
                var existing = await _repository.GetByIdAsync(dto.Id);
                if (existing == null)
                    return (false, $"City not found with ID: {dto.Id}", null);

                existing.Name = dto.Name;
                existing.Description = dto.Description;
                existing.ModifiedBy = modifiedBy;
                existing.ModifiedDate = DateTime.Now;

                var updated = await _repository.UpdateAsync(existing);
                return (true, "City updated successfully", _mapper.Map<AssetCityDto>(updated.city));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while updating city");
                return (false, "Error while updating city", null);
            }
        }

        public async Task<(bool isSuccess, string message)> DeleteCityAsync(long id, string modifiedBy)
        {
            try
            {
                var existing = await _repository.GetByIdAsync(id);
                if (existing == null)
                    return (false, $"City not found with ID: {id}");

                existing.ModifiedBy = modifiedBy;
                existing.ModifiedDate = DateTime.Now;
                existing.Cancelled = true;

                var updated = await _repository.UpdateAsync(existing);
                if (!updated.success)
                    return (false, "Failed to update city before deletion");
                return (true, "City deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting city");
                return (false, "Error while deleting city");
            }
        }

        public async Task<(bool isSuccess, string message, IEnumerable<AssetCityDto>? data)> GetCitiesByOrganizationAsync()
        {
            try
            {
                var organizationId = _companyContext.OrganizationId;
                 var result = await _repository.GetByOrganizationAsync(organizationId);
                return (true, "Fetched successfully", _mapper.Map<IEnumerable<AssetCityDto>>(result));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while fetching cities by organization");
                return (false, "Error while fetching cities by organization", null);
            }
        }
    }
}
