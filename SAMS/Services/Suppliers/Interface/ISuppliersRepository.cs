using SAMS.Models;

namespace SAMS.Services.Suppliers.Interface
{
    public interface ISuppliersRepository
    {
        Task<bool> ExistsAsync(string name, Guid? orgId);
        Task<Supplier?> GetByIdAsync(long id, Guid? orgId);
        Task<Supplier> AddAsync(Supplier supplier);
        Task UpdateAsync(Supplier supplier);
        Task<IEnumerable<Supplier>> GetByOrganizationAsync(Guid? orgId);
        Task<bool> SoftDeleteAsync(long id, Guid? orgId, string deletedBy);
    }
}
