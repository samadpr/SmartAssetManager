using Microsoft.EntityFrameworkCore;
using SAMS.Services.Functional.Interface;

namespace SAMS.Data
{
    public static class DbInitializer
    {
        public static async Task Initialize(ApplicationDbContext context, IFunctionalService functional)
        {
            context.Database.Migrate();
            var result = await functional.GetDefaultIdentitySettings();

            if (result == null)
            {
                await functional.CreateDefaultIdentitySettings();
            }

            if (context.ApplicationUsers.Any())
            {
                return; 
            }
            else
            {
                await functional.GenerateUserUserRole();
                await functional.CreateDefaultSuperAdminAsync();

            }
        }
    }
}
