using SAMS.Models;

namespace SAMS.Services.Company.DTOs
{
    public class CompanyWithUserInfoDto : EntityBase
    {
        public long Id { get; set; }

        public Guid OrganizationId { get; set; }

        public long? IndustriesId { get; set; }

        public string? Name { get; set; }

        public string? Logo { get; set; }

        public string? Currency { get; set; }

        public string? Address { get; set; }

        public string? City { get; set; }

        public string? Country { get; set; }

        public string? Phone { get; set; }

        public string? Email { get; set; }

        public string? Fax { get; set; }

        public string? Website { get; set; }

        // NEW SUBSCRIPTION FIELDS

        public long? SubscriptionId { get; set; }

        public DateTime? SubscriptionDate { get; set; }

        public DateTime? SubscriptionExpiryDate { get; set; }

        public bool IsActive { get; set; }

        public SubscriptionPlan? SubscriptionPlan { get; set; }

        public UserProfileInfo? UserInfo { get; set; }

    }
    public class UserProfileInfo
    {
        public long UserProfileId { get; set; }

        public string? EmployeeId { get; set; }

        public string? ApplicationUserId { get; set; }

        public string? FirstName { get; set; }

        public string? LastName { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public long? Designation { get; set; }

        public long? Department { get; set; }

        public long? SubDepartment { get; set; }

        public long? Site { get; set; }

        public long? Area { get; set; }

        public long? RoleId { get; set; }

        public string? DesignationName { get; set; }

        public string? DepartmentName { get; set; }

        public string? SubDepartmentName { get; set; }

        public string? SiteName { get; set; }

        public string? AreaName { get; set; }

        public string? RoleName { get; set; }

        public string? PhoneNumber { get; set; }

        public string? Email { get; set; }

        public bool? IsEmailConfirmed { get; set; }

        public string? Address { get; set; }

        public string? Country { get; set; }

        public string? ProfilePicture { get; set; }

        public int? IsApprover { get; set; }
    }
}
