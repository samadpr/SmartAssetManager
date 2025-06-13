namespace SAMS.Services.Common.DTOs
{
    public class CreatorDto
    {
        public long CreatorId { get; set; }

        public string CreatorEmail { get; set; } = string.Empty;

        public bool IsCreator { get; set; }
    }
}
