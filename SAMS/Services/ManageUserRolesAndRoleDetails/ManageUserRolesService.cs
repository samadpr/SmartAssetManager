using AutoMapper;
using SAMS.Helpers;
using SAMS.Models;
using SAMS.Services.Common.Interface;
using SAMS.Services.ManageUserRoles.DTOs;
using SAMS.Services.ManageUserRoles.Interface;
using SAMS.Services.ManageUserRolesAndRoleDetails.DTOs;
using SAMS.Services.Profile.Interface;
using SAMS.Services.Roles.Interface;

namespace SAMS.Services.ManageUserRoles
{
    public class ManageUserRolesService : IManageUserRolesService
    {
        private readonly IManageUserRolesRepository _manageUserRolesRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<ManageUserRolesService> _logger;
        //private readonly IUserProfileService _userProfileService;
        private readonly IRolesService _rolesService;
        private readonly ICommonService _commonService;
        private readonly ICompanyContext _companyContext;

        public ManageUserRolesService(
            IManageUserRolesRepository manageUserRolesRepository,
            IMapper mapper,
            ILogger<ManageUserRolesService> logger,
            //IUserProfileService userProfileService,
            IRolesService roles,
            ICommonService commonService,
            ICompanyContext companyContext)
        {
            _manageUserRolesRepository = manageUserRolesRepository;
            _mapper = mapper;
            _logger = logger;
            //_userProfileService = userProfileService;
            _rolesService = roles;
            _commonService = commonService;
            _companyContext = companyContext;
        }

        public async Task<ManageUserRolesDto> CreateRoleWithRoleDetailsAsync(ManageUserRolesDto request, string createdBy)
        {
            try
            {
                var roleEntity = new ManageUserRole
                {
                    Name = request.Name,
                    Description = request.Description,
                    CreatedDate = DateTime.UtcNow,
                    ModifiedDate = DateTime.UtcNow,
                    CreatedBy = createdBy,
                    ModifiedBy = createdBy
                };

                var permissions = request.RolePermissions!.Select(p => new ManageUserRolesDetail
                {
                    RoleId = p.RoleId,
                    RoleName = p.RoleName,
                    IsAllowed = p.IsAllowed,
                    CreatedBy = createdBy,
                    ModifiedBy = createdBy,
                    CreatedDate = DateTime.UtcNow,
                    ModifiedDate = DateTime.UtcNow
                }).ToList();

                var result = await _manageUserRolesRepository.CreateRoleWithRoleDetailsAsync(roleEntity, permissions);
                if (result == null)
                    return null!;
                return _mapper.Map<ManageUserRolesDto>(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while creating the user role with role details.");
                throw new Exception("An error occurred while creating the user role with role details.", ex);
            }

        }

        public async Task<ManageUserRolesDto> CreateUserRolesAsync(ManageUserRolesDto request, string createdBy)
        {
            try
            {
                var roleEntity = new ManageUserRole
                {
                    Name = request.Name,
                    Description = request.Description,
                    CreatedDate = DateTime.UtcNow,
                    ModifiedDate = DateTime.UtcNow,
                    CreatedBy = createdBy,
                    ModifiedBy = createdBy
                };

                var result = await _manageUserRolesRepository.CreateUserRolesAsync(roleEntity);
                return _mapper.Map<ManageUserRolesDto>(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while creating the user role.");
                throw new Exception("An error occurred while creating the user role.", ex);
            }
        }

        public async Task<IEnumerable<ManageUserRolesDetailsDto>> CreateUserRolesDetailsAsync(IEnumerable<ManageUserRolesDetailsDto> request, string modifiedBy)
        {
            try
            {
                var userRolesDetails = await _manageUserRolesRepository.GetRoleDetailsByManagedRoleIdAsync(request.First().ManageRoleId);
                if (userRolesDetails != null)
                    return null!;
                var roleDetails = new List<ManageUserRolesDetail>();
                foreach (var detail in request)
                {
                    roleDetails.Add(new ManageUserRolesDetail
                    {
                        ManageRoleId = detail.ManageRoleId,
                        RoleId = detail.RoleId,
                        RoleName = detail.RoleName,
                        IsAllowed = detail.IsAllowed,
                        CreatedBy = modifiedBy,
                        ModifiedBy = modifiedBy,
                        CreatedDate = DateTime.UtcNow,
                        ModifiedDate = DateTime.UtcNow
                    });
                }

                var result = await _manageUserRolesRepository.CreateUserRolesDetailsAsync(roleDetails);
                return _mapper.Map<IEnumerable<ManageUserRolesDetailsDto>>(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while creating user role details.");
                throw new Exception("An error occurred while creating user role details.", ex);
            }
        }

        public Task<IEnumerable<ManageUserRole>> GetAllRolesAsync()
        {
            try
            {
                var result = _manageUserRolesRepository.GetAllRolesAsync();
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting all user roles.");
                throw new Exception("An error occurred while getting all user roles.", ex);
            }
        }

        public Task<IEnumerable<ManageUserRolesDto>> GetAllRolesWithRoleDetailsAsync()
        {
            try
            {
                var result = _manageUserRolesRepository.GetAllRolesWithRoleDetailsAsync();
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting all user roles with role details.");
                throw new Exception("An error occurred while getting all user roles with role details.", ex);
            }
        }

        public async Task<IEnumerable<ManageUserRolesDetail>> GetRoleDetailsByManagedRoleIdAsync(long managedRoleId, string user)
        {
            try
            {
                var emails = await _commonService.GetEmailsUnderAdminAsync(user);

                var result = await _manageUserRolesRepository.GetRoleDetailsByManagedRoleIdAsync(managedRoleId);
                if (result == null || result.Any(rd => !emails.Contains(rd.CreatedBy)))
                    return null!;
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting role details by managed role id.");
                throw new Exception("An error occurred while getting role details by managed role id.", ex);
            }
        }

        public async Task<ManageUserRole> GetUserRoleByIdAsync(int id, string user)
        {
            try
            {
                var emails = await _commonService.GetEmailsUnderAdminAsync(user);

                var result = await _manageUserRolesRepository.GetUserRoleByIdAsync(id, emails);
                if (result == null)
                    return null!;
                _logger.LogInformation("User role found.");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting user role by id.");
                throw new Exception("An error occurred while getting user role by id.", ex);
            }
        }

        public async Task<ManageUserRolesDto> GetUserRoleByIdWithRoleDetailsAsync(long id)
        {
            try
            {
                var result = await _manageUserRolesRepository.GetUserRoleByIdWithRoleDetailsAsync(id);
                return result; // can be null if not found
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting user role by id with role details.");
                throw new Exception("An error occurred while getting user role by id with role details.", ex);
            }
        }

        //public async Task<ManageUserRolesDto?> GetUserRoleByRoleIdInDetailsAsync( long roleId, Guid? organizationId)
        //{
        //    try
        //    {
        //        if (organizationId == null)
        //            return null!;
        //        return await _manageUserRolesRepository.GetUserRoleByRoleIdInDetailsAsync(roleId, organizationId);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error fetching managed role by identity roleId: {RoleId}", roleId);
        //        throw;
        //    }
        //}

        public async Task<ManageUserRolesDetail> GetUserRoleDetailsByIdAsync(int id, string user)
        {
            try
            {
                var emails = await _commonService.GetEmailsUnderAdminAsync(user);

                var result = await _manageUserRolesRepository.GetUserRoleDetailsByIdAsync(id, emails);
                if (result == null)
                    return null!;
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting user role details by id.");
                throw new Exception("An error occurred while getting user role details by id.", ex);
            }
        }

        public async Task<IEnumerable<ManageUserRole>> GetUserRolesAsync(string userEmail)
        {
            try
            {
                var emails = await _commonService.GetEmailsUnderAdminAsync(userEmail);
                var result = await _manageUserRolesRepository.GetUserRolesAsync(emails);
                if (result == null)
                    return null!;
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting user roles.");
                throw new Exception("An error occurred while getting user roles.", ex);
            }
        }

        public async Task<IEnumerable<ManageUserRolesDto>> GetUserRolesWithRoleDetailsAsync(string userEmail)
        {
            try
            {
                var emails = await _commonService.GetEmailsUnderAdminAsync(userEmail);

                var result = await _manageUserRolesRepository.GetUserRolesWithRoleDetailsAsync(emails);
                if (result == null)
                    return null!;
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting user roles with role details.");
                throw new Exception("An error occurred while getting user roles with role details.", ex);
            }
        }

        public async Task<(bool isSuccess, string message)> UpdateUserRolesWithRoleDetailsAsync(ManageUserRolesDto request, string modifiedBy)
        {
            try
            {
                //var orgId = _companyContext.OrganizationId;

                var emails = await _commonService.GetEmailsUnderAdminAsync(modifiedBy);
                ManageUserRole manageUserRole = new();
                if (request.Id > 0)
                {
                    manageUserRole = await _manageUserRolesRepository.GetUserRoleByIdAsync(request.Id, emails);
                    if (manageUserRole.CreatedBy != modifiedBy)
                    {
                        _logger.LogError("User does not have permission to update this role.");
                        return (false, "User does not have permission to update this role.");
                    }

                    request.ModifiedBy = modifiedBy;
                    request.ModifiedDate = DateTime.UtcNow;
                    request.CreatedBy = manageUserRole.CreatedBy;
                    request.CreatedDate = manageUserRole.CreatedDate;
                    request.OrganizationId = manageUserRole.OrganizationId;
                    var result = await _manageUserRolesRepository.UpdateUserRoleWithRoleDetailsAsync(manageUserRole, request);
                    if (!result)
                    {
                        _logger.LogError("An error occurred while updating user roles.");
                        return (false, "An error occurred while updating user roles.");
                    }

                    var userRoleDetails = await _manageUserRolesRepository.GetRoleDetailsByManagedRoleIdAsync(request.Id);

                    foreach (var item in userRoleDetails)
                    {
                        var manageUserRoleDetails = await _manageUserRolesRepository.GetUserRoleDetailsByIdAsync(item.Id, emails);

                        var rolePermission = request.RolePermissions!
                            .FirstOrDefault(x => x.RoleId == item.RoleId && x.ManageRoleId == item.ManageRoleId);

                        if (rolePermission != null && rolePermission.RoleId == item.RoleId && rolePermission.ManageRoleId == item.ManageRoleId && rolePermission.RoleName == item.RoleName)
                        {
                            manageUserRoleDetails.IsAllowed = rolePermission.IsAllowed;
                            manageUserRoleDetails.ModifiedBy = modifiedBy;
                            manageUserRoleDetails.ModifiedDate = DateTime.UtcNow;

                            var updateResult = await _manageUserRolesRepository.UpdateUserRoleDetailsAsync(manageUserRoleDetails);
                            if (!updateResult)
                            {
                                _logger.LogError("An error occurred while updating user role details.");
                                return (false, "An error occurred while updating user role details.");
                            }
                        }
                        else
                        {
                            if (rolePermission == null)
                            {
                                _logger.LogError("An error occurred while updating user role details. the role permission is null.");
                                return (false, "An error occurred while updating user role details. the role permission is null.");
                            }
                        }
                    }

                    // Get users using this role
                    var usersWithThisRole = await _rolesService.GetUsersUsedByRoleIdAsync(manageUserRole.Id, emails);

                    // Loop through users and update their roles
                    foreach (var userProfile in usersWithThisRole)
                    {
                        var updatedRolesInUser = new ManageUserRolesDto
                        {
                            ApplicationUserId = userProfile.ApplicationUserId!,
                            RolePermissions = request.RolePermissions
                        };

                        var updateResult = await _rolesService.UpdateUserRoles(updatedRolesInUser);
                        if (!updateResult.isSuccess)
                        {
                            _logger.LogError("An error occurred while updating user roles." + updateResult.message);
                            return (false, "An error occurred while updating user roles." + updateResult.message);
                        }
                    }
                    _logger.LogInformation("User roles updated successfully with role details for user {UserId}.", manageUserRole.Id);
                    return (true, "User roles updated successfully.");
                }
                else
                {
                    _logger.LogError("An error occurred while updating user roles.");
                    return (false, "An error occurred while updating user roles.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating user roles with role details.");
                throw new Exception("An error occurred while updating user roles with role details.", ex);
            }
        }


        public async Task<(bool isSuccess, string message)> DeleteUserRoleWithRoleDetailsAsync(long id, string modifiedBy)
        {
            try
            {
                var emails = await _commonService.GetEmailsUnderAdminAsync(modifiedBy);

                var manageUserRole = await _manageUserRolesRepository.GetUserRoleByIdAsync(id, emails);
                if (manageUserRole != null)
                {
                    manageUserRole.Cancelled = true;
                    manageUserRole.ModifiedBy = modifiedBy;
                    manageUserRole.ModifiedDate = DateTime.UtcNow;

                    var result = await _manageUserRolesRepository.UpdateUserRolesAsync(manageUserRole);
                    if (result)
                    {
                        var userRoleDetails = await _manageUserRolesRepository.GetRoleDetailsByManagedRoleIdAsync(id);
                        foreach (var item in userRoleDetails)
                        {
                            var manageUserRoleDetails = await _manageUserRolesRepository.GetUserRoleDetailsByIdAsync(item.Id, emails);
                            manageUserRoleDetails.Cancelled = true;
                            manageUserRoleDetails.ModifiedBy = modifiedBy;
                            manageUserRoleDetails.ModifiedDate = DateTime.UtcNow;
                            await _manageUserRolesRepository.UpdateUserRoleDetailsAsync(manageUserRoleDetails);
                        }
                        _logger.LogInformation("User roles deleted successfully with role details for user {UserId}.", manageUserRole.Id);
                    }
                    else
                    {
                        _logger.LogError("An error occurred while deleting user roles.");
                        return (false, "An error occurred while deleting user roles.");
                    }

                    /*//var userProfiles = await _manageUserRolesRepository.GetUsersUsedByRoleIdAsync(manageUserRole.Id);

                    //foreach(var userProfile in userProfiles)
                    //{
                    //    var userProfilesUpdated = await _userProfileService.RevokeLoginAccessForCreatedUserProfile(userProfile.UserProfileId, modifiedBy);
                    //    if (!userProfilesUpdated.Success)
                    //    {
                    //        _logger.LogError("An error occurred while revoking login access for user {UserId}.", userProfile.UserProfileId);
                    //        return (false, "An error occurred while revoking login access for user " + userProfile.UserProfileId);
                    //    }
                    //}*/

                    return (true, "User roles deleted successfully.");

                }
                else
                {
                    _logger.LogError("An error occurred while deleting user roles. User role not found.");
                    return (false, "An error occurred while deleting user roles. User role not found.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while deleting user roles with role details.");
                throw new Exception("An error occurred while deleting user roles with role details.", ex);
            }
        }

        public async Task<IEnumerable<RoleDto>> GetAllAspNetRolesAsync()
        {
            try
            {
                var roles = await _manageUserRolesRepository.GetAllAspNetRolesAsync();

                return roles.Select(r => new RoleDto
                {
                    Id = r.Id,
                    Name = r.Name
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error ocurred while get AspNetRoles");
                throw new Exception("An error ocurred while get AspNetRoles");
            }


        }

        public async Task<ManageUserRole> GetUserRoleByIdWithOrgIdAsync(long id, Guid orgId)
        {
            try
            {
                var result = await _manageUserRolesRepository.GetUserRoleByIdWithOrgIdAsync(id, orgId);
                if (result == null)
                    return null!;
                _logger.LogInformation("User role found.");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting user role by id.");
                throw new Exception("An error occurred while getting user role by id.", ex);
            }
        }
    }
}
