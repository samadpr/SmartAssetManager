using SAMS.Data;
using SAMS.Models;
using SAMS.Services.Common.Interface;
using System.Net;
using UAParser;

namespace SAMS.Services.Common
{
    public class CommonService : ICommonService
    {
        private readonly ILogger<CommonService> _logger;
        private readonly ICommonRepository _commonRepository;

        public CommonService(ILogger<CommonService> logger, ICommonRepository commonRepository)
        {
            _logger = logger;
            _commonRepository = commonRepository;
        }

        public async Task<bool> InsertToLoginHistory(LoginHistory history)
        {
            try
            {
                history.CreatedDate = DateTime.Now;
                history.ModifiedDate = DateTime.Now;
                await _commonRepository.InsertLoginHistory(history);


                _logger.LogInformation("Login history added for user: {UserName}", history.UserName);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to insert login history for user: {UserName}", history.UserName);
                return false;
            }
        }
    }
}
