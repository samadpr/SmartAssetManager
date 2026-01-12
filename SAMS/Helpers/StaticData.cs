using System.ComponentModel.DataAnnotations;

namespace SAMS.Helpers
{
    public class StaticData
    {
        public static string RandomDigits(int length)
        {
            var random = new Random();
            string s = string.Empty;
            for (int i = 0; i < length; i++)
                s = String.Concat(s, random.Next(10).ToString());
            return s;
        }

        public static class ConnectionStrings
        {
            public const string connMSSQLNoCred = "connMSSQLNoCred";
            public const string connMSSQL = "connMSSQL";
            public const string connPostgreSQL = "connPostgreSQL";
            public const string connMySQL = "connMySQL";
            public const string connDockerBase = "connDockerBase";
            public const string connMSSQLProd = "connMSSQLProd";
            public const string connOthers = "connOthers";
        }

    }
}
