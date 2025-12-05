using SAMS.Models;
using SAMS.Services.Suppliers.DTOs;

namespace SAMS.Services.Suppliers.Interface
{
    public interface ISuppliersService
    {
        Task<(bool success, string message, SupplierDto? data)> CreateAsync(SupplierDto dto, string createdBy);
        Task<(bool success, string message, SupplierDto? data)> UpdateAsync(SupplierDto dto, string modifiedBy);
        Task<(bool success, string message, IEnumerable<Supplier>? data)> GetByOrganizationAsync();
        Task<(bool success, string message)> DeleteAsync(long id, string deletedBy);
        Task<SupplierDto> GetByIdAsync(long? id, Guid organizationId);
    }
}
