namespace SAMS.Helpers.Enum
{
    public class AssetEnums
    {
        public enum AssetStatusEnum
        {
            New = 1,
            InUse = 2,
            Available = 3,
            Damaged = 4,
            UnderMaintenance = 5,
            Returned = 6,
            Expired = 7,
            RequiresLicenseUpdate = 8,
            Miscellaneous = 9
        }

        public enum DepreciationMethod
        {
            None = 0,
            StraightLine = 1,
            DecliningBalance = 2,
            DoubleDecliningBalance = 3,
            OneFiftyDecliningBalance = 4,
            SumOfYearsDigits = 5
        }

        public enum AssignToType
        {
            NotAssigned = 0,
            User = 1,
            Location = 2,
            Disposed = 3
        }

        public enum AssetType
        {
            Created = 1,
            Transferred = 2,
            Disposed = 3
        }

        public enum TransferApprovalStatus
        {
            Pending = 1,
            Approved = 2,
            Rejected = 3
        }

        public enum ApproverType
        {
            Level1 = 1,
            Level2 = 2,
            Level3 = 3
        }

        public static class AssetAssignedStatus
        {
            public const string Assigned = "Assigned";
            public const string UnAssigned = "UnAssigned";
            public const string ReAssigned = "ReAssigned";
            public const string Disposed = "Disposed";
            public const string Hold = "Hold";
            public const string Others = "Others";
        }

        public enum DisposalMethod
        {
            Sold = 1,
            Donated = 2,
            Recycled = 3,
            Destroyed = 4,
            Other = 5
        }
    }
}
