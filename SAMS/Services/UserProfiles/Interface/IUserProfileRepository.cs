﻿using SAMS.Models;
using SAMS.Services.UserProfiles.DTOs;

namespace SAMS.Services.Profile.Interface;

public interface IUserProfileRepository
{
    Task<UserProfile> GetProfileDetails(string userEmail);

    Task<bool> UpdateProfileAsync(UserProfile user);

    Task<int> GetCreatedUsersCount(List<string> emails);

    Task<(bool isSuccess, string message)> CreateUserProfileAsync(UserProfile userProfile);

    Task<IEnumerable<UserProfile>> GetCreatedUsersProfile(List<string> emails);

    Task<(UserProfile user, string message)> GetUserProfileByProfileId(long profileId, List<string> emails);

    Task<(bool success, string message)> UpdateUserProfileAsync(UserProfile user);
}
