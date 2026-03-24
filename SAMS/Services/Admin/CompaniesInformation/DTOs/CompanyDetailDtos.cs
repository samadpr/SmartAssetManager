namespace SAMS.Services.Admin.CompaniesInformation.DTOs
{
    // ── Full page load response ───────────────────────────────────────────────
    public class CompanyDetailDto
    {
        public CompanyFullInfoDto Company { get; set; } = null!;
        public AdminUserDetailDto? AdminUser { get; set; }
        public SubscriptionDetailDto? Subscription { get; set; }
        public CompanyStatsDto Stats { get; set; } = null!;
        public List<LoginAccessUserDto> LoginAccessUsers { get; set; } = new();
    }

    // ── Company ───────────────────────────────────────────────────────────────
    public class CompanyFullInfoDto
    {
        public long Id { get; set; }
        public string OrganizationId { get; set; } = null!;
        public string? Name { get; set; }
        public string? Logo { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Fax { get; set; }
        public string? Website { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? Currency { get; set; }
        public long? IndustriesId { get; set; }
        public string? IndustryName { get; set; }
        public long? SubscriptionId { get; set; }
        public DateTime? SubscriptionDate { get; set; }
        public DateTime? SubscriptionExpiryDate { get; set; }
        public DateTime CreatedDate { get; set; }
        public bool IsActive { get; set; }
    }

    // ── Admin User ────────────────────────────────────────────────────────────
    public class AdminUserDetailDto
    {
        public long UserProfileId { get; set; }
        public string? ApplicationUserId { get; set; }
        public string? EmployeeId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Address { get; set; }
        public string? Country { get; set; }
        public string? ProfilePicture { get; set; }
        public bool IsEmailConfirmed { get; set; }
        public string? RoleName { get; set; }
        public string? DesignationName { get; set; }
        public string? DepartmentName { get; set; }
        public string? SubDepartmentName { get; set; }
        public string? SiteName { get; set; }
        public string? AreaName { get; set; }
        public DateTime? JoiningDate { get; set; }
        public bool IsApprover { get; set; }
    }

    // ── Subscription ──────────────────────────────────────────────────────────
    public class SubscriptionDetailDto
    {
        public long SubscriptionId { get; set; }
        public string PlanName { get; set; } = null!;
        public decimal PlanAmount { get; set; }
        public int DurationDays { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
        public int DaysRemaining { get; set; }
        public int AssetLimit { get; set; }
        public int TotalUserLimit { get; set; }
        public int SystemUserLimit { get; set; }
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    public class CompanyStatsDto
    {
        public int TotalAssets { get; set; }
        public int TotalUsers { get; set; }
        public int SystemUsers { get; set; }
        public int Departments { get; set; }
        public int SubDepartments { get; set; }
        public int Designations { get; set; }
        public int Roles { get; set; }
        public int Sites { get; set; }
        public int Branches { get; set; }
        public int Areas { get; set; }
        public int Cities { get; set; }
        public int Suppliers { get; set; }
        public int AssetCategories { get; set; }
        public int AssetSubCategories { get; set; }
    }

    // ── Login Access User ─────────────────────────────────────────────────────
    public class LoginAccessUserDto
    {
        public long UserProfileId { get; set; }
        public string? ApplicationUserId { get; set; }
        public string? EmployeeId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ProfilePicture { get; set; }
        public string? RoleName { get; set; }
        public string? DesignationName { get; set; }
        public string? DepartmentName { get; set; }
        public bool IsEmailConfirmed { get; set; }
        public bool IsActive { get; set; }
        public DateTime? LastLoginDate { get; set; }
        public DateTime? LastLogoutDate { get; set; }
        public int TotalLoginCount { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    // ── Toggle Request ────────────────────────────────────────────────────────
    public class ToggleActiveRequestDto
    {
        public long CompanyId { get; set; }
        public string OrgId { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
}
