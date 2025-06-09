namespace SAMS.API.ManageUserRolesAPIs.RequestObject
{
    public class ManageRoleDetailsRequest
    {
        public long? ManageRoleId { get; set; }
        public string? RoleId { get; set; }
        public string? RoleName { get; set; }
        public bool IsAllowed { get; set; }
    }
}
