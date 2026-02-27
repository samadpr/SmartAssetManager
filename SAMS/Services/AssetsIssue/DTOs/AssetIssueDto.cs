using SAMS.Models.CommonModels.Abstract;
using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.Services.AssetsIssue.DTOs
{
    public class AssetIssueDto : TenantEntityBase
    {
        public long? Id { get; set; }

        public long AssetId { get; set; }

        public long RaisedByUserId { get; set; }

        public string? IssueTitle { get; set; }

        public string? IssueDescription { get; set; }

        public AssetIssueStatus? Status { get; set; }

        public DateTime? ExpectedFixDate { get; set; }

        public DateTime? ResolvedDate { get; set; }

        public decimal? RepairCost { get; set; }

        public string? Invoice { get; set; }

        public string? Comment { get; set; }
    }

    public class AssetIssueDetailsDto : AssetIssueDto
    {
        public string? AssetName { get; set; }

        public string? RaisedByUserName { get; set; }

        public string? AssetImageUrl { get; set; }

        public string? UserImageUrl { get; set; }

    }
}
