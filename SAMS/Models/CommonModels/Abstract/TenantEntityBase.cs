using SAMS.Models.CommonModels.Interface;

namespace SAMS.Models.CommonModels.Abstract
{
    public class TenantEntityBase : EntityBase, IHasOrganization
    {
        public Guid OrganizationId { get; set; }
    }
}
