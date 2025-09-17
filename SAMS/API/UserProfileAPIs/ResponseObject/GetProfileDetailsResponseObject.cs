namespace SAMS.API.UserProfileAPIs.ResponseObject
{
    public class GetProfileDetailsResponseObject
    {
        public long UserProfileId { get; set; }

        public string? ApplicationUserId { get; set; }

        public string? EmployeeId { get; set; }

        public string? FirstName { get; set; }

        public string? LastName { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public long? Designation { get; set; }

        public string? DesignationDisplay { get; set; }

        public long? Department { get; set; }

        public string? DepartmentDisplay { get; set; }

        public long? SubDepartment { get; set; }

        public string? SubDepartmentDisplay { get; set; }

        public long? Site { get; set; }

        public string? SiteDisplay { get; set; }

        public long? Location { get; set; }

        public string? RoleIdDisplay { get; set; }

        public DateTime? JoiningDate { get; set; }

        public DateTime? LeavingDate { get; set; }

        public string? PhoneNumber { get; set; }

        public string? Email { get; set; }

        public string? Address { get; set; }

        public string? Country { get; set; }

        public string? ProfilePicture { get; set; }
    }
}
