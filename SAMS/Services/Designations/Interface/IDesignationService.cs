using SAMS.Models;
using SAMS.Services.DesignationServices.DTOs;

namespace SAMS.Services.DesignationServices.Interface
{
    public interface IDesignationService
    {
        Task<DesignationDto> AddDesignationAsync(DesignationDto dto, string createdBy);

        Task<DesignationDto?> UpdateDesignationAsync(DesignationDto dto, string modifiedBy);

        Task<List<Designation>> GetDesignationAsync(string targetUserEmail);

        Task<IEnumerable<Designation>> GetAllDesignationAsync();

        Task<bool> DeleteDesignationAsync(int id, string modifiedBy);

        Task<IEnumerable<Designation>> GetUserDesignationsAsync(string email);

        Task<Designation?> GetDesignationByIdAsync(int id, string email);
    }
}
