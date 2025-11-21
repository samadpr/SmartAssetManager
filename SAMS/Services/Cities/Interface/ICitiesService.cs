using SAMS.Services.Cities.DTOs;

namespace SAMS.Services.Cities.Interface
{
    public interface ICitiesService
    {
        Task<(bool isSuccess, string message, AssetCityDto? data)> AddCityAsync(AssetCityDto dto, string createdBy);
        Task<(bool isSuccess, string message, IEnumerable<AssetCityDto>? data)> GetCitiesAsync();
        Task<(bool isSuccess, string message, AssetCityDto? data)> UpdateCityAsync(AssetCityDto dto, string modifiedBy);
        Task<(bool isSuccess, string message)> DeleteCityAsync(long id, string modifiedBy);
        Task<(bool isSuccess, string message, IEnumerable<AssetCityDto>? data)> GetCitiesByOrganizationAsync();
    }
}
