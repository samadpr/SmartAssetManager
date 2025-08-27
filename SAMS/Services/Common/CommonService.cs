using SAMS.Data;
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

        public CommonService(ILogger<CommonService> logger, ICommonRepository commonRepository, IUserProfileRepository userProfileRepository)
        {
            _logger = logger;
            _commonRepository = commonRepository;
            _userProfileRepository = userProfileRepository;
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
    }
}
