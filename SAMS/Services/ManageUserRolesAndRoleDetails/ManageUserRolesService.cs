using AutoMapper;
using SAMS.Models;
using SAMS.Services.ManageUserRoles.DTOs;
using SAMS.Services.ManageUserRoles.Interface;
using SAMS.Services.Profile.Interface;
using SAMS.Services.Roles.Interface;

namespace SAMS.Services.ManageUserRoles
{
    public class ManageUserRolesService : IManageUserRolesService
    {
        private readonly IManageUserRolesRepository _manageUserRolesRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<ManageUserRolesService> _logger;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IRolesService _rolesService;

        public ManageUserRolesService(
            IManageUserRolesRepository manageUserRolesRepository, 
            IMapper mapper, 
            ILogger<ManageUserRolesService> logger,
            IUserProfileRepository userProfileRepository,
            IRolesService roles)
        {
            _manageUserRolesRepository = manageUserRolesRepository;
            _mapper = mapper;
            _logger = logger;
            _userProfileRepository = userProfileRepository;
            _rolesService = roles;
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
            catch(Exception ex)
            {
                _logger.LogError(ex, "An error occurred while creating the user role.");
                throw new Exception("An error occurred while creating the user role.", ex);
            }
        }

        public async Task<IEnumerable<ManageUserRolesDetailsDto>> CreateUserRolesDetailsAsync(IEnumerable<ManageUserRolesDetailsDto> request, string modifiedBy)
        {
            try
            {
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

        public Task<IEnumerable<ManageUserRolesDetail>> GetRoleDetailsByManagedRoleIdAsync(long managedRoleId)
        {
            try
            {
                var result = _manageUserRolesRepository.GetRoleDetailsByManagedRoleIdAsync(managedRoleId);
                if (result == null)
                    return null!;
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting role details by managed role id.");
                throw new Exception("An error occurred while getting role details by managed role id.", ex);
            }
        }

        public Task<ManageUserRole> GetUserRoleByIdAsync(int id)
        {
            try
            {
                var result = _manageUserRolesRepository.GetUserRoleByIdAsync(id);
                if (result == null)
                    return null!;
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting user role by id.");
                throw new Exception("An error occurred while getting user role by id.", ex);
            }
        }

        public Task<ManageUserRolesDto> GetUserRoleByIdWithRoleDetailsAsync(long id)
        {
            try
            {
                var result = _manageUserRolesRepository.GetUserRoleByIdWithRoleDetailsAsync(id);
                if (result == null)
                    return null!;
                return result!;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting user role by id with role details.");
                throw new Exception("An error occurred while getting user role by id with role details.", ex);
            }
        }

        public Task<ManageUserRolesDetail> GetUserRoleDetailsByIdAsync(int id)
        {
            try
            {
                var result = _manageUserRolesRepository.GetUserRoleDetailsByIdAsync(id);
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

        public Task<IEnumerable<ManageUserRole>> GetUserRolesAsync(string userEmail)
        {
            try
            {
                var result = _manageUserRolesRepository.GetUserRolesAsync(userEmail);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting user roles.");
                throw new Exception("An error occurred while getting user roles.", ex);
            }
        }

        public Task<IEnumerable<ManageUserRolesDto>> GetUserRolesWithRoleDetailsAsync(string userEmail)
        {
            try
            {
                var result = _manageUserRolesRepository.GetUserRolesWithRoleDetailsAsync(userEmail);
                return result;
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "An error occurred while getting user roles with role details.");
                throw new Exception("An error occurred while getting user roles with role details.", ex);
            }
        }

        public async Task<(bool isSuccess, string message)> UpdateUserRolesWithRoleDetailsAsync(ManageUserRolesDto request, string modifiedBy)
        {
            try
            {
                ManageUserRole manageUserRole = new();
                if(request.Id > 0)
                {
                    manageUserRole = await _manageUserRolesRepository.GetUserRoleByIdAsync(request.Id);
                    if(manageUserRole.CreatedBy != modifiedBy)
                    {
                        _logger.LogError("User does not have permission to update this role.");
                        return (false, "User does not have permission to update this role.");
                    }
                    request.ModifiedBy = modifiedBy;
                    request.ModifiedDate = DateTime.UtcNow;
                    request.CreatedBy = manageUserRole.CreatedBy;
                    request.CreatedDate = manageUserRole.CreatedDate;

                    var result = await _manageUserRolesRepository.UpdateUserRolesAsync(manageUserRole, request);
                    if (!result)
                    {
                        _logger.LogError("An error occurred while updating user roles.");
                        return (false, "An error occurred while updating user roles.");
                    }
                        
                    foreach(var item in request.RolePermissions!)
                    {
                        var manageUserRoleDetails = await _manageUserRolesRepository.GetUserRoleDetailsByIdAsync(item.Id);
                        manageUserRoleDetails.IsAllowed = item.IsAllowed;
                        manageUserRoleDetails.ModifiedBy = modifiedBy;
                        manageUserRoleDetails.ModifiedDate = DateTime.UtcNow;
                        var updateResult = await _manageUserRolesRepository.UpdateUserRoleDetailsAsync(manageUserRoleDetails);
                        if (!updateResult)
                        {
                            _logger.LogError("An error occurred while updating user role details.");
                            return (false, "An error occurred while updating user role details.");
                        }
                    }

                    // Get users using this role
                    var usersWithThisRole = await _userProfileRepository.GetUsersUsedByRoleIdAsync(manageUserRole.Id);

                    // Loop through users and update their roles
                    foreach(var userProfile in usersWithThisRole)
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
            catch(Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating user roles with role details.");
                throw new Exception("An error occurred while updating user roles with role details.", ex);
            }
        }
    }
}
