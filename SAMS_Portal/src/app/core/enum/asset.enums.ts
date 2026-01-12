export enum AssetStatus {
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

export enum DepreciationMethod {
  None = 0,
  StraightLine = 1,
  DecliningBalance = 2,
  DoubleDecliningBalance = 3,
  OneFiftyDecliningBalance = 4,
  SumOfYearsDigits = 5
}

export enum AssignToType {
  NotAssigned = 0,
  User = 1,
  Site = 2,
  Disposed = 3
}

export enum AssetType {
  Created = 1,
  Transferred = 2,
  Disposed = 3
}

export enum TransferApprovalStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3
}

export enum DisposalMethod {
  Sold = 1,
  Donated = 2,
  Recycled = 3,
  Destroyed = 4,
  Other = 5
}
