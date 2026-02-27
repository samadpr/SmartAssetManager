using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.API.AssetIssueAPIs.RequestObject
{
    public class AssetIssueRequestObject
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

        public IFormFile? InvoiceFile { get; set; }

        public string? InvoicePath { get; set; }

        public string? Comment { get; set; }
    }
}
