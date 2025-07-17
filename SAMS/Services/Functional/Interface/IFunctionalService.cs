using SAMS.Models;

namespace SAMS.Services.Functional.Interface
{
    public interface IFunctionalService
    {
        Task CreateDefaultIdentitySettings();

        Task<DefaultIdentityOptions> GetDefaultIdentitySettings();

        Task GenerateUserUserRole();

        Task CreateDefaultSuperAdminAsync();

        Task CreateDefaultEmailSettings();
    }
}
