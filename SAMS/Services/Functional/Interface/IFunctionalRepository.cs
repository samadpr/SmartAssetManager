using SAMS.Models;

namespace SAMS.Services.Functional.Interface
{
    public interface IFunctionalRepository
    {
        Task<DefaultIdentityOptions?> GetDefaultIdentitySettingsAsync();

        Task CreateDefaultIdentitySettingsAsync();

        Task<List<ManageUserRole>> GetAllManageRolesAsync();

        Task AddManageUserRoleDetailsAsync(ManageUserRolesDetail detail);

        Task SaveUserProfileAsync(UserProfile profile);

        Task CreateDefaultEmailSettingsAsync();
    }
}
