using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class UserProfile : EntityBase
{
    public long UserProfileId { get; set; }

    public string? ApplicationUserId { get; set; }

    public string? UserId { get; set; }

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public long? Designation { get; set; }

    public long? Department { get; set; }

    public long? SubDepartment { get; set; }

    public long? Site { get; set; }

    public long? Area { get; set; }

    public DateTime? JoiningDate { get; set; }

    public DateTime? LeavingDate { get; set; }

    public string? PhoneNumber { get; set; }

    public string? Email { get; set; }

    public string? Address { get; set; }

    public string? Country { get; set; }

    public string? ProfilePicture { get; set; }

    public long? RoleId { get; set; }

    public bool? IsAllowLoginAccess { get; set; }

    public int? IsApprover { get; set; }

    public bool? Level1Approval { get; set; }

    public bool? Level2Approval { get; set; }

    public bool? Level3Approval { get; set; }

    public Guid OrganizationId { get; set; }

    public virtual ICollection<AssetAssigned> AssetAssigneds { get; set; } = new List<AssetAssigned>();

    public virtual ICollection<AssetHistory> AssetHistories { get; set; } = new List<AssetHistory>();

    public virtual ICollection<AssetIssue> AssetIssues { get; set; } = new List<AssetIssue>();

    public virtual ICollection<AssetRequest> AssetRequestApprovedByUsers { get; set; } = new List<AssetRequest>();

    public virtual ICollection<AssetRequest> AssetRequestRequestedUsers { get; set; } = new List<AssetRequest>();

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();

    public virtual Department? DepartmentNavigation { get; set; }

    public virtual Designation? DesignationNavigation { get; set; }

    public virtual AssetArea? AreaNavigation { get; set; }

    public virtual ManageUserRole? Role { get; set; }

    public virtual AssetSite? SiteNavigation { get; set; }

    public virtual SubDepartment? SubDepartmentNavigation { get; set; }
}
