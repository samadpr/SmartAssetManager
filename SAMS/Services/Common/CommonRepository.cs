using SAMS.Data;
using SAMS.Models;
using SAMS.Services.Common.Interface;

namespace SAMS.Services.Common
{
    public class CommonRepository : ICommonRepository
    {
        private readonly ApplicationDbContext _context;
        public CommonRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task InsertLoginHistory(LoginHistory loginHistory)
        {
            await _context.LoginHistory.AddAsync(loginHistory);
            await _context.SaveChangesAsync();
        }
    }
}
