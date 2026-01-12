using SAMS.Models.CommonModels.Abstract;

namespace SAMS.Services.UserProfiles.DTOs
{
    public class UsersListDto : TenantEntityBase
    {
        public long UserProfileId { get; set; }

        public string? UserId { get; set; }

        public string? ApplicationUserId { get; set; }

        public string? FirstName { get; set; }

        public string? LastName { get; set; }

        public long? Designation { get; set; }
        public string? DesignationDisplay { get; set; }

        public long? Department { get; set; }
        public string? DepartmentDisplay { get; set; }

        public long? SubDepartment { get; set; }
        public string? SubDepartmentDisplay { get; set; }

        public long? Site { get; set; }
        public string? SiteDisplay { get; set; }

        public long? Area { get; set; }
        public string? AreaDisplay { get; set; }

        public long? RoleId { get; set; }
        public string? RoleIdDisplay { get; set; }

        public string? PhoneNumber { get; set; }

        public string? Email { get; set; }

        public bool? IsEmailConfirmed { get; set; }

        public string? ProfilePicture { get; set; }

        public int? IsApprover { get; set; }
    }
}
