using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.Asset_Status.Interface;

namespace SAMS.Services.Asset_Status
{
    public class AssetStatusRepository : IAssetStatusRepository
    {
        private readonly ApplicationDbContext _context;

        public AssetStatusRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> AnySystemStatusesAsync(Guid orgId)
        {
            return await _context.AssetStatuses
                .AnyAsync(x => x.OrganizationId == orgId && x.IsSystem);
        }

        public async Task AddRangeAsync(List<AssetStatus> statuses)
        {
            await _context.AssetStatuses.AddRangeAsync(statuses);
            await _context.SaveChangesAsync();
        }

        public async Task<List<AssetStatus>> GetAllAsync(Guid orgId)
        {
            return await _context.AssetStatuses
                .Where(x => x.OrganizationId == orgId)
                .OrderBy(x => x.Name)
                .ToListAsync();
        }
    }
}
