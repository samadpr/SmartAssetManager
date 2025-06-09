using SAMS.Models;

namespace SAMS.Services.DesignationServices.Interface
{
    public interface IDesignationRepository
    {
        Task<Designation> AddAsync(Designation designation, string createdByEmail);

        Task<Designation> UpdateAsync(Designation designation);

        Task<Designation?> GetByIdAsync(long id);

        Task<IEnumerable<Designation>> GetAllAsync();

        Task<IEnumerable<Designation>> GetDesignationsCreatedByAsync(string createdByEmail);
    }
}
