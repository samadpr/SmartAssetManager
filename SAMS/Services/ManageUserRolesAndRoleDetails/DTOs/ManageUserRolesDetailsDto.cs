using SAMS.Models;
using SAMS.Models.CommonModels.Abstract;

namespace SAMS.Services.ManageUserRoles.DTOs
{
    public class ManageUserRolesDetailsDto : TenantEntityBase
    {
        public long Id { get; set; }
        public long ManageRoleId { get; set; }
        public string? RoleId { get; set; }
        public string? RoleName { get; set; }
        public bool IsAllowed { get; set; }
    }
}
