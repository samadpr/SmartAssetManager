namespace SAMS.API.UserProfileAPIs.RequestObject
{
    public class UpdateUPRequestObject
    {
        public string? FirstName { get; set; }

        public string? LastName { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public long? Designation { get; set; }

        public long? Department { get; set; }

        public long? SubDepartment { get; set; }

        public long? Site { get; set; }

        public long? Location { get; set; }

        public DateTime? JoiningDate { get; set; }

        public DateTime? LeavingDate { get; set; }

        public string? PhoneNumber { get; set; }

        public string? Email { get; set; }

        public string? Address { get; set; }

        public string? Country { get; set; }

        public string? ProfilePicture { get; set; }

        public int? IsApprover { get; set; }

        public bool? Level1Approval { get; set; }

        public bool? Level2Approval { get; set; }

        public bool? Level3Approval { get; set; }
    }
}
