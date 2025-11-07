using SAMS.Services.Industries.Interface;

namespace SAMS.Services.Industries
{
    public class IndustriesService : IIndustriesService
    {
        private readonly IIndustriesRepository _industriesRepository;
        private readonly ILogger<IndustriesService> _logger;

        public IndustriesService(IIndustriesRepository industriesRepository, ILogger<IndustriesService> logger)
        {
            _industriesRepository = industriesRepository;
            _logger = logger;
        }

        public async Task<(bool IsSuccess, string message, List<Models.Industries> Industries)> GetAllIndustries()
        {
            try
            {
                List<Models.Industries> industries = new List<Models.Industries>();
                industries = await _industriesRepository.GetAllIndustries();
                if(industries.Count == 0)
                    return (false, "No industries found.", industries);
                return (true, "Industries retrieved successfully.", industries);
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving industries.");
                return (false, "Error occurred while retrieving industries.", new List<Models.Industries>());
            }
        }
    }
}
