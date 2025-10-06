﻿namespace SAMS.API.UserProfileAPIs.RequestObject
{
    public class UserProfileRequestObject
    {
        public long UserProfileId { get; set; }

        public string? FirstName { get; set; }

        public string? LastName { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public long? Designation { get; set; }  

        public long? Department { get; set; }

        public long? SubDepartment { get; set; }

        public long? Site { get; set; }

        public long? Location { get; set; }

        public long? RoleId { get; set; }

        public DateTime? JoiningDate { get; set; }

        public DateTime? LeavingDate { get; set; }

        public string? PhoneNumber { get; set; }

        public string? Email { get; set; }

        public bool? IsEmailConfirmed { get; set;}

        public string? Address { get; set; }

        public string? Country { get; set; }

        public string? ProfilePicture { get; set; }
    }
}
