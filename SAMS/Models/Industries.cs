namespace SAMS.Models
{
    public class Industries : EntityBase
    {
        public long Id { get; set; }

        public string? Name { get; set; }

        public string? Description { get; set; }

        public ICollection<CompanyInfo>? Companies { get; set; }
    }
}
