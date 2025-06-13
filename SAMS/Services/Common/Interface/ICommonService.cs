﻿using SAMS.Models;
using SAMS.Services.Common.DTOs;
using UAParser;

namespace SAMS.Services.Common.Interface
{
    public interface ICommonService
    {
        Task<bool> InsertToLoginHistory(LoginHistory history);

        Task<CreatorDto> GetAdminOrCreatorInfoAsync(string currentUserEmail);

        Task<List<string>> GetEmailsUnderAdminAsync(string targetUserEmail);
    }
}
