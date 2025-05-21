using SAMS.Models;

namespace SAMS.Data
{
    public class SeedData
    {
        public IEnumerable<ManageUserRole> GetManageRoleList()
        {
            return new List<ManageUserRole>
            {
                new ManageUserRole { Name = "Admin", Description = "User Role: New"},
                new ManageUserRole { Name = "General", Description = "User Role: General"},
            };
        }
    }
}
