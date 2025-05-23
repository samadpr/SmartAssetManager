using SAMS.Services.DesignationServices.DTOs;

namespace SAMS.Services.DesignationServices.Interface
{
    public interface IDesignationService
    {
        Task<DesignationDto> AddDesignationAsync(DesignationDto dto, string createdBy);

        Task<DesignationDto?> UpdateDesignationAsync(DesignationDto dto, string modifiedBy);

        Task<IEnumerable<DesignationDto>> GetDesignationAsync();

        Task<bool> DeleteDesignationAsync(int id, string modifiedBy);

        Task<IEnumerable<DesignationDto>> GetUserDesignationsAsync(string email);
    }
}
