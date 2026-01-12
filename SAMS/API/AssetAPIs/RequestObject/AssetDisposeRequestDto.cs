using static SAMS.Helpers.Enum.AssetEnums;

namespace SAMS.API.AssetAPIs.RequestObject
{
    public class AssetDisposeRequestDto
    {
        public long AssetId { get; set; }

        public DateTime DisposalDate { get; set; }

        public DisposalMethod DisposalMethod { get; set; }

        public IFormFile? DisposalDocument { get; set; } // "No file chosen" supported

        public string? Comment { get; set; }
    }
}
