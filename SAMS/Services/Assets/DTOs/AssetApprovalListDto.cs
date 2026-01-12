using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.Services.Assets.DTOs
{
    public class AssetApprovalListDto
    {
        public long AssignmentId { get; set; }
        public long AssetRowId { get; set; }
        public string AssetId { get; set; }

        public AssetType AssetType { get; set; }          // Transferred / Disposed
        public AssignToType AssignTo { get; set; }

        public string RequestedByEmail { get; set; }
        public string? RequestedByName { get; set; }
        public string? RequestedByProfilePicture { get; set; }
        public DateTime RequestedDate { get; set; }

        public long? AssignUserId { get; set; }
        public string? AssignUserName { get; set; }
        public string? AssignProfilePicture { get; set; }

        public long? SiteId { get; set; }
        public string? SiteName { get; set; }

        public long? AreaId { get; set; }
        public string? AreaName { get; set; }

        public TransferApprovalStatus ApprovalStatus { get; set; }
        public string Status { get; set; }                // Hold
        public string? AssetImageUrl { get; set; }
    }
}
