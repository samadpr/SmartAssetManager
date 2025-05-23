using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using SAMS.Data;
using SAMS.Helpers;
using SAMS.Models.CommonModels;
using SAMS.Services.Account;
using SAMS.Services.Account.Interface;
using SAMS.Services.Common;
using SAMS.Services.Common.Interface;
using SAMS.Services.DesignationServices;
using SAMS.Services.DesignationServices.Interface;
using SAMS.Services.Functional;
using SAMS.Services.Functional.Interface;
using SAMS.Services.Profile;
using SAMS.Services.Profile.Interface;
using SAMS.Services.Roles;
using SAMS.Services.Roles.Interface;
using static SAMS.Helpers.StaticData;

namespace SAMS.Extensions
{
    public static class ApplicationServiceExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration config)
        {
            services.AddScoped<ApplicationDbContext>();
            var _ApplicationInfo = config.GetSection("ApplicationInfo").Get<ApplicationInfo>();
            string _GetConnStringName = ControllerExtensions.GetConnectionString(config);
            if (_ApplicationInfo.DBConnectionStringName == ConnectionStrings.connMySQL)
            {
                services.AddDbContextPool<ApplicationDbContext>(options => options.UseMySql(_GetConnStringName, ServerVersion.AutoDetect(_GetConnStringName)));
            }
            else if (_ApplicationInfo.DBConnectionStringName == ConnectionStrings.connPostgreSQL)
            {
                services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(_GetConnStringName));
            }
            else
            {
                services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(_GetConnStringName));
            }

            services.AddAutoMapper(typeof(AutoMapperProfiles).Assembly);

            services.AddScoped<IFunctionalService, FunctionalService>();
            services.AddScoped<IFunctionalRepository, FunctionalRepository>();

            services.AddScoped<IRolesService, RolesService>();
            services.AddScoped<IRolesRepository, RolesRepository>();

            services.AddScoped<IAccountService, AccountService>();
            services.AddScoped<IAccountRepository, AccountRepository>();

            services.AddScoped<ICommonService, CommonService>();
            services.AddScoped<ICommonRepository, CommonRepository>();

            services.AddScoped<IUserProfileService, UserProfileService>();
            services.AddScoped<IUserProfileRepository, UserProfileRepository>();

            services.AddScoped<IDesignationService, DesignationService>();
            services.AddScoped<IDesignationRepository, DesignationRepository>();

            return services;
        }
    }
}
