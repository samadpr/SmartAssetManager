using SAMS.Models;
using SAMS.Models.CommonModels.Abstract;

namespace SAMS.Services.ManageUserRoles.DTOs
{
    public class ManageUserRolesDto : TenantEntityBase
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string ApplicationUserId { get; set; }
        public List<ManageUserRolesDetailsDto>? RolePermissions { get; set; }
    }
}
