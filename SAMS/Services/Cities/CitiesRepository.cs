using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Models;
using SAMS.Services.Cities.Interface;

namespace SAMS.Services.Cities
{
    public class CitiesRepository : ICitiesRepository
    {
        private readonly ApplicationDbContext _context;
        public CitiesRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<AssetCity>> GetAllAsync()
        {
            return await _context.AssetCities
                .OrderByDescending(c => c.CreatedDate)
                .ToListAsync();
        }

        public async Task<AssetCity?> GetByIdAsync(long id)
        {
            return await _context.AssetCities.FindAsync(id);
        }

        public async Task<AssetCity?> GetByNameAsync(string name)
        {
            return await _context.AssetCities
                .FirstOrDefaultAsync(c => c.Name!.ToLower() == name.ToLower());
        }

        public async Task<AssetCity> AddAsync(AssetCity entity)
        {
            _context.AssetCities.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<(bool,AssetCity?)> UpdateAsync(AssetCity entity)
        {
            var existing = await _context.AssetCities.FindAsync(entity.Id);
            if (existing == null) return (false,null);

            _context.Entry(existing).CurrentValues.SetValues(entity);

            await _context.SaveChangesAsync();
            return (true,existing);
        }

        public async Task<bool> DeleteAsync(long id)
        {
            var entity = await _context.AssetCities.FindAsync(id);
            if (entity == null) return false;

            _context.AssetCities.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(string name, Guid organizationId)
        {
            return await _context.AssetCities.AnyAsync(c =>
            c.OrganizationId == organizationId &&
            !c.Cancelled &&
            c.Name!.ToLower() == name.ToLower());
        }

        public async Task<IEnumerable<AssetCity>> GetByOrganizationAsync(Guid organizationId)
        {
            return await _context.AssetCities
                .Where(c => c.OrganizationId == organizationId && !c.Cancelled)
                .ToListAsync();
        }
    }
}
