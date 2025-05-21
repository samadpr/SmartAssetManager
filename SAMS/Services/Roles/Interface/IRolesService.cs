using SAMS.Models;

namespace SAMS.Services.Roles.Interface
{
    public interface IRolesService
    {
        Task GenerateRolesFromPageListAsync();
        Task AddToRolesAsync(ApplicationUser user);
    }
}
