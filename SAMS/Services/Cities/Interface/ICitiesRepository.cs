using SAMS.Models;

namespace SAMS.Services.Cities.Interface
{
    public interface ICitiesRepository
    {
        Task<IEnumerable<AssetCity>> GetAllAsync();
        Task<AssetCity?> GetByIdAsync(long id);
        Task<AssetCity?> GetByNameAsync(string name);
        Task<AssetCity> AddAsync(AssetCity entity);
        Task<(bool success, AssetCity? city)> UpdateAsync(AssetCity entity);
        Task<bool> DeleteAsync(long id);
        Task<bool> ExistsAsync(string name, Guid organizationId);
        Task<IEnumerable<AssetCity>> GetByOrganizationAsync(Guid organizationId);
    }
}
