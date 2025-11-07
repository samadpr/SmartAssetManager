using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Services.Industries.Interface;

namespace SAMS.Services.Industries
{
    public class IndustriesRepository : IIndustriesRepository
    {
        private readonly ApplicationDbContext _context;

        public IndustriesRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Models.Industries>> GetAllIndustries()
        {
            try
            {
                return await _context.Industries.ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception("Error retrieving industries: " + ex.Message, ex);
            }
        }

    }
}
