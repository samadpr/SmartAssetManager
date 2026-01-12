namespace SAMS.API.AssetAPIs.RequestObject
{
    public class AssetApprovalRequestDto
    {
        public long AssetId { get; set; }
        public long AssignmentId { get; set; }   // AssetAssigned.Id
        //public string? Comment { get; set; }
    }

}
