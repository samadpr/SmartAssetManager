using SAMS.Models.CommonModels;
using static SAMS.Helpers.StaticData;

namespace SAMS.Helpers
{
    public class ControllerExtensions
    {
        public static string GetConnectionString(IConfiguration Configuration)
        {
            var _ApplicationInfo = Configuration.GetSection("ApplicationInfo").Get<ApplicationInfo>()!;
            string _GetConnStringName = String.Empty;
            if (_ApplicationInfo.DBConnectionStringName == ConnectionStrings.connMSSQLNoCred)
            {
                _GetConnStringName = Configuration.GetConnectionString(ConnectionStrings.connMSSQLNoCred)!;
            }
            else if (_ApplicationInfo.DBConnectionStringName == ConnectionStrings.connMSSQL)
            {
                _GetConnStringName = Configuration.GetConnectionString(ConnectionStrings.connMSSQL)!;
            }
            else if (_ApplicationInfo.DBConnectionStringName == ConnectionStrings.connPostgreSQL)
            {
                _GetConnStringName = Configuration.GetConnectionString(ConnectionStrings.connPostgreSQL)!;
            }
            else if (_ApplicationInfo.DBConnectionStringName == ConnectionStrings.connMySQL)
            {
                _GetConnStringName = Configuration.GetConnectionString(ConnectionStrings.connMySQL)!;
            }
            else if (_ApplicationInfo.DBConnectionStringName == ConnectionStrings.connDockerBase)
            {
                _GetConnStringName = Configuration.GetConnectionString(ConnectionStrings.connDockerBase)!;
            }
            else if (_ApplicationInfo.DBConnectionStringName == ConnectionStrings.connMSSQLProd)
            {
                _GetConnStringName = Configuration.GetConnectionString(ConnectionStrings.connMSSQLProd)!;
            }
            else if (_ApplicationInfo.DBConnectionStringName == ConnectionStrings.connOthers)
            {
                _GetConnStringName = Configuration.GetConnectionString(ConnectionStrings.connOthers)!;
            }

            return _GetConnStringName;
        }
    }
}
