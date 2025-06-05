namespace SAMS.API.ManageUserRolesAPIs.RequestObject
{
    public class ManageUserRoleRequest
    {
        public int? Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public List<ManageRoleDetailsRequest>? RolePermissions { get; set; }
    }

    public class UserRoleRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
    }
}
