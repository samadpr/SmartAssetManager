using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore;
using SAMS.Helpers;

namespace SAMS.Data
{
    public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            IConfigurationRoot configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory()) // Adjust if your .csproj isn't in root
                .AddJsonFile("appsettings.json")
                .Build();

            var dbConnName = configuration["ApplicationInfo:DBConnectionStringName"];
            var connString = ControllerExtensions.GetConnectionString(configuration);

            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();

            if (dbConnName == StaticData.ConnectionStrings.connMySQL)
            {
                optionsBuilder.UseMySql(connString, ServerVersion.AutoDetect(connString));
            }
            else if (dbConnName == StaticData.ConnectionStrings.connPostgreSQL)
            {
                optionsBuilder.UseNpgsql(connString);
            }
            else
            {
                optionsBuilder.UseSqlServer(connString);
            }

            return new ApplicationDbContext(optionsBuilder.Options, new DesignTimeCompanyContext());
        }
    }

    // Used only at design time (migrations)
    public class DesignTimeCompanyContext : ICompanyContext
    {
        public Guid OrganizationId => Guid.Empty;
    }
}
