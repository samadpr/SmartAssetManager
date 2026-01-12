using SAMS.Data;
using SAMS.Helpers;
using SAMS.Helpers.Enum;
using SAMS.Models;
using SAMS.Services.Common.DTOs;
using SAMS.Services.Common.Interface;
using SAMS.Services.Profile.Interface;
using SAMS.Services.Roles.PagesModel;
using System.Net;
using UAParser;

namespace SAMS.Services.Common
{
    public class CommonService : ICommonService
    {
        private readonly ILogger<CommonService> _logger;
        private readonly ICommonRepository _commonRepository;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly ICompanyContext _companyContext;

        public CommonService(ILogger<CommonService> logger, ICommonRepository commonRepository, IUserProfileRepository userProfileRepository, ICompanyContext companyContext)
        {
            _logger = logger;
            _commonRepository = commonRepository;
            _userProfileRepository = userProfileRepository;
            _companyContext = companyContext;
        }

        public async Task<CreatorDto> GetAdminOrCreatorInfoAsync(string currentUserEmail)
        {
            try
            {
                var user = await _userProfileRepository.GetProfileData(currentUserEmail);
                if (user == null)
                    return (null!);

                if (user.RoleId == ((long)RolesEnum.Admin) && user.CreatedBy == RolesEnum.Admin.ToString()) // assume AdminRoleId = 2
                    return (new CreatorDto { CreatorId = user.UserProfileId, CreatorEmail = user.Email!, IsCreator = true });

                var creator = await _userProfileRepository.GetProfileData(user.CreatedBy);
                if (creator == null)
                    return (null!);

                if (creator != null && creator.RoleId == ((long)RolesEnum.Admin)) // assume AdminRoleId = 2
                    return (new CreatorDto { CreatorId = creator.UserProfileId, CreatorEmail = creator.Email!, IsCreator = true });

                return (null!);
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin or creator info for user: {Email}", currentUserEmail);
                return null!;
            }
        }

        public async Task<List<string>> GetEmailsUnderAdminAsync(string targetUserEmail)
        {
            try
            {
                return await _commonRepository.GetEmailsUnderAdminAsync(targetUserEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving emails under admin for user: {Email}", targetUserEmail);
                return new List<string>();
            }
        }

        public async Task<Guid> GetOrganizationIdAsync(string createdBy)
        {
            try
            {
                var userProfile = await _userProfileRepository.GetProfileData(createdBy);
                if(userProfile == null && userProfile.OrganizationId == Guid.Empty)
                {
                    return Guid.Empty;
                }

                return userProfile.OrganizationId;
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Error retrieving organization ID for user: {Email}", createdBy);
                return Guid.Empty;
            }
        }

        public async Task<bool> InsertToLoginHistory(LoginHistory history)
        {
            try
            {
                history.CreatedDate = DateTime.Now;
                history.ModifiedDate = DateTime.Now;
                await _commonRepository.InsertLoginHistory(history);


                _logger.LogInformation("Login history added for user: {UserName}", history.UserName);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to insert login history for user: {UserName}", history.UserName);
                return false;
            }
        }

        public async Task<(bool IsAdmin, UserProfile? UserProfile)> GetUserWithRoleCheck(string email)
        {
            try
            {
                var user = await _userProfileRepository.GetProfileData(email);
                if (user == null || user.RoleId == null)
                    return (false, null);
                if (!user.RoleId.HasValue)
                    throw new Exception("User role is not assigned.");

                var role = await _commonRepository.GetUserRoleIdWithRoleDetailsByOrgIdAsync(user.RoleId.Value);
                if (role == null)
                    return (false, null);

                if(role.RolePermissions!.Any(p => p.RoleName == "Admin" && p.IsAllowed == true))
                {
                    return (true, user);
                }

                return (false, user);
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin or creator info for user: {Email}", email);
                return (false, null);
            }
        }
    }
}
