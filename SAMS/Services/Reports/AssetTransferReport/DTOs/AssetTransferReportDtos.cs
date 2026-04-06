using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.Services.Reports.AssetTransferReport.DTOs
{
    // ─────────────────────────────────────────────────────────────────────────────
    // Holder details
    // ─────────────────────────────────────────────────────────────────────────────

    /// <summary>Basic profile info for any user involved in a transfer.</summary>
    public class TransferUserDto
    {
        public long? UserProfileId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? FullName => $"{FirstName} {LastName}".Trim();
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ProfilePicture { get; set; }
        public string? DesignationDisplay { get; set; }
        public string? DepartmentDisplay { get; set; }
    }

    /// <summary>Area details that belong to a site/branch holder.</summary>
    public class TransferAreaDto
    {
        public long? AreaId { get; set; }
        public string? AreaName { get; set; }
        public string? AreaDescription { get; set; }
    }

    /// <summary>Site/Branch details when an asset is held at a location.</summary>
    public class TransferSiteDto
    {
        public long? SiteId { get; set; }
        public string? SiteName { get; set; }
        public string? SiteDescription { get; set; }
        public string? SiteAddress { get; set; }
        public string? SiteType { get; set; }   // "Site" or "Branch"
        public string? CityName { get; set; }
        public TransferAreaDto? Area { get; set; }   // Area within this site
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // One leg in the transfer chain
    // ─────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Represents a single step in the full asset transfer chain.
    /// Each leg answers: who held it, how long, who moved it, and was it approved.
    /// </summary>
    public class AssetTransferLegDto
    {
        // ── Which assignment row this is ──────────────────────────────────────────
        public long AssignmentId { get; set; }
        public long? PreviousAssignmentId { get; set; }  // Points to the leg before this one

        // ── What type of movement happened ───────────────────────────────────────
        public AssetType AssetType { get; set; }
        public string AssetTypeDisplay { get; set; } = string.Empty;  // "Created", "Transferred", "Disposed"
        public AssignToType AssignTo { get; set; }
        public string AssignToDisplay { get; set; } = string.Empty;  // "User", "SiteOrBranch", "Disposed"

        // ── Approval info (who approved this transfer) ────────────────────────────
        public TransferApprovalStatus ApprovalStatus { get; set; }
        public string ApprovalStatusDisplay { get; set; } = string.Empty;
        public string? ApprovedByLevel1 { get; set; }
        public string? ApprovedByLevel2 { get; set; }
        public string? ApprovedByLevel3 { get; set; }
        public DateTime? Level1ApprovedDate { get; set; }
        public DateTime? Level2ApprovedDate { get; set; }
        public DateTime? Level3ApprovedDate { get; set; }

        // ── Assignment status ("Assigned", "ReAssigned", "UnAssigned", "Hold", "Disposed") ──
        public string? Status { get; set; }

        // ── Dates ─────────────────────────────────────────────────────────────────
        public DateTime? TransferDate { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        // ── How long this holder kept the asset ───────────────────────────────────
        public DateTime? HoldStart { get; set; }  // When this leg started
        public DateTime? HoldEnd { get; set; }  // When the next transfer happened (null = still holding)
        public int? HoldDays { get; set; }  // Calculated number of days held

        // ── The holder (only one of these will be populated) ─────────────────────
        public TransferUserDto? HolderUser { get; set; }  // Set when AssignTo == User
        public TransferSiteDto? HolderSite { get; set; }  // Set when AssignTo == SiteOrBranch

        // ── Who triggered this transfer ───────────────────────────────────────────
        public string? TransferredByEmail { get; set; }
        public TransferUserDto? TransferredByUser { get; set; }

        // ── Disposal details (only set when this is a disposal leg) ──────────────
        public bool IsDisposalLeg { get; set; }
        public DateTime? DisposalDate { get; set; }
        public string? DisposalMethod { get; set; }
        public string? DisposalDocument { get; set; }

        // ── Is this the active leg right now? ────────────────────────────────────
        public bool IsCurrent { get; set; }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Per-asset report
    // ─────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Complete transfer history for one asset — from creation to current holder.
    /// The TransferChain is ordered oldest → newest.
    /// </summary>
    public class AssetTransferHistoryDto
    {
        // Asset identity & snapshot
        public long AssetRowId { get; set; }
        public string AssetId { get; set; } = string.Empty;
        public string? AssetName { get; set; }
        public string? AssetBrand { get; set; }
        public string? AssetModelNo { get; set; }
        public string? AssetSerialNo { get; set; }
        public string? CategoryDisplay { get; set; }
        public string? SubCategoryDisplay { get; set; }
        public string? DepartmentDisplay { get; set; }
        public string? ImageUrl { get; set; }
        //public string? Barcode { get; set; }
        //public string? QrcodeImage { get; set; }
        public bool IsDisposed { get; set; }
        public bool IsCancelled { get; set; }

        // Full chain from day one to today
        public List<AssetTransferLegDto> TransferChain { get; set; } = new();

        // Quick access to the active holder without looping
        public AssetTransferLegDto? CurrentHolder =>
            TransferChain.LastOrDefault(leg => leg.IsCurrent);

        // Summary numbers
        public int TotalTransfers { get; set; }
        public DateTime? FirstAssignedDate { get; set; }
        public DateTime? LastTransferDate { get; set; }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Organisation-level summary (no per-leg detail)
    // ─────────────────────────────────────────────────────────────────────────────

    /// <summary>High-level counts for the whole organisation. Used for dashboards.</summary>
    public class OrganisationTransferSummaryDto
    {
        public Guid OrganizationId { get; set; }
        public int TotalAssets { get; set; }
        public int TotalTransferLegs { get; set; }   // Sum of all assignment rows
        public int TotalActiveAssets { get; set; }   // Not disposed, not cancelled
        public int TotalDisposedAssets { get; set; }
        public int TotalPendingApprovals { get; set; }   // Transfers waiting for approval
    }

    /// <summary>
    /// Full organisation report — every asset with its complete chain.
    /// Frontend handles all filtering/searching/pagination client-side.
    /// </summary>
    public class OrganisationTransferReportDto
    {
        public Guid OrganizationId { get; set; }
        public OrganisationTransferSummaryDto Summary { get; set; } = new();
        public List<AssetTransferHistoryDto> Assets { get; set; } = new();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Internal flat row — used only between repository and service. Never exposed.
    // ─────────────────────────────────────────────────────────────────────────────

    public sealed class AssetTransferFlatRow
    {
        // Asset table fields
        public long AssetRowId { get; set; }
        public string AssetId { get; set; } = string.Empty;
        public string? AssetName { get; set; }
        public string? AssetBrand { get; set; }
        public string? AssetModelNo { get; set; }
        public string? AssetSerialNo { get; set; }
        public string? CategoryName { get; set; }
        public string? SubCategoryName { get; set; }
        public string? DepartmentName { get; set; }
        public string? AssetImageUrl { get; set; }
        //public string? Barcode { get; set; }
        //public string? QrcodeImage { get; set; }
        public int? AssetAssignTo { get; set; }
        public int? AssetTypeOnAsset { get; set; }
        public bool AssetCancelled { get; set; }
        public DateTime? DisposalDate { get; set; }
        public int? DisposalMethod { get; set; }
        public string? DisposalDocument { get; set; }

        // AssetAssigned table fields
        public long AssignmentId { get; set; }
        public long? AssignedFrom { get; set; }
        public int? AssetType { get; set; }
        public int? AssignTo { get; set; }
        public int? ApprovalStatus { get; set; }
        public string? AssignmentStatus { get; set; }
        public DateTime? TransferDate { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime AssignmentCreatedDate { get; set; }
        public DateTime AssignmentModifiedDate { get; set; }
        public string? TransferredByEmail { get; set; }
        public string? Level1Approvedby { get; set; }
        public string? Level2Approvedby { get; set; }
        public string? Level3Approvedby { get; set; }
        public DateTime? Level1ApprovedDate { get; set; }
        public DateTime? Level2ApprovedDate { get; set; }
        public DateTime? Level3ApprovedDate { get; set; }

        // Holder user fields (populated when AssignTo == User)
        public long? HolderUserId { get; set; }
        public string? HolderUserFirstName { get; set; }
        public string? HolderUserLastName { get; set; }
        public string? HolderUserEmail { get; set; }
        public string? HolderUserPhone { get; set; }
        public string? HolderUserPicture { get; set; }
        public string? HolderUserDesignation { get; set; }
        public string? HolderUserDepartment { get; set; }

        // Holder site fields (populated when AssignTo == SiteOrBranch)
        public long? HolderSiteId { get; set; }
        public string? HolderSiteName { get; set; }
        public string? HolderSiteDescription { get; set; }
        public string? HolderSiteAddress { get; set; }
        public string? HolderSiteType { get; set; }
        public string? HolderSiteCityName { get; set; }
        public long? HolderAreaId { get; set; }
        public string? HolderAreaName { get; set; }
        public string? HolderAreaDescription { get; set; }

        // Who initiated the transfer — filled in by ResolveTransferredByUsers
        public long? TransferredByUserProfileId { get; set; }
        public string? TransferredByFirstName { get; set; }
        public string? TransferredByLastName { get; set; }
        public string? TransferredByPhone { get; set; }
        public string? TransferredByPicture { get; set; }
        public string? TransferredByDesignation { get; set; }
        public string? TransferredByDepartment { get; set; }
    }
}
