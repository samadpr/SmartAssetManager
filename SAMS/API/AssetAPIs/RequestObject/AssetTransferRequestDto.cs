using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.API.AssetAPIs.RequestObject
{
    public class AssetTransferRequestDto
    {
        public long AssetId { get; set; }

        public DateTime TransferDate { get; set; }
        public DateTime? DueDate { get; set; }

        public AssignToType AssignTo { get; set; }

        // TO (new assignment)
        public long? AssignUserId { get; set; }
        public long? SiteId { get; set; }
        public long? AreaId { get; set; }

        public string? Note { get; set; }
    }
}
