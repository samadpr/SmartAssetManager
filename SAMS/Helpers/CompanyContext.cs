namespace SAMS.Helpers
{
    public interface ICompanyContext
    {
        Guid OrganizationId { get; }
    }

    public class CompanyContext : ICompanyContext
    {
        private readonly IHttpContextAccessor _accessor;

        public CompanyContext(IHttpContextAccessor accessor)
        {
            _accessor = accessor;
        }

        public Guid OrganizationId
        {
            get
            {
                var claim = _accessor.HttpContext?.User?.FindFirst("OrganizationId")?.Value;
                return Guid.TryParse(claim, out var org) ? org : Guid.Empty;
            }
        }
    }
}
