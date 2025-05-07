CREATE DATABASE SAMS_DB;
GO
USE SAMS_DB;
Go

-- AssetCategorie table
CREATE TABLE AssetCategorie (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(MAX) NULL,
    Description NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- AssetSubCategorie table
CREATE TABLE AssetSubCategorie (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    AssetCategorieId BIGINT NOT NULL FOREIGN KEY REFERENCES AssetCategorie(Id),
    Name NVARCHAR(MAX) NULL,
    Description NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- AssetCities table
CREATE TABLE AssetCities (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(250) NULL,
    Description NVARCHAR(250) NULL,
    Cancelled BIT NOT NULL
);

-- AssetSite table
CREATE TABLE AssetSite (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(250) NULL,
    Description NVARCHAR(MAX) NULL,
    Location BIGINT NULL FOREIGN KEY REFERENCES AssetCities(Id),
    Address NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NULL,
    ModifiedDate DATETIME2(7) NULL,
    CreatedBy NVARCHAR(200) NULL,
    ModifiedBy NVARCHAR(200) NULL,
    Cancelled BIT NULL
);

-- AssetLocation table
CREATE TABLE AssetLocation (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    SiteId BIGINT NULL FOREIGN KEY REFERENCES AssetSite(Id),
    Name NVARCHAR(MAX) NULL,
    Description NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NULL,
    ModifiedDate DATETIME2(7) NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NULL
);

-- Department table
CREATE TABLE Department (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(MAX) NULL,
    Description NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- SubDepartment table
CREATE TABLE SubDepartment (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    DepartmentId BIGINT NOT NULL FOREIGN KEY REFERENCES Department(Id),
    Name NVARCHAR(MAX) NULL,
    Description NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- AssetStatus table
CREATE TABLE AssetStatus (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(MAX) NULL,
    Description NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- Supplier table
CREATE TABLE Supplier (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(MAX) NULL,
    ContactPerson NVARCHAR(MAX) NULL,
    Email NVARCHAR(MAX) NULL,
    Phone NVARCHAR(MAX) NULL,
    TradeLicense NVARCHAR(MAX) NULL,
    Address NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- Designation table
CREATE TABLE Designation (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(MAX) NULL,
    Description NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- AssetApprovalStatus table
CREATE TABLE AssetApprovalStatus (
    Id INT PRIMARY KEY,
    Description NVARCHAR(250) NULL
);

-- ManageUserRoles table
CREATE TABLE ManageUserRoles (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(MAX) NULL,
    Description NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- ManageUserRolesDetails table
CREATE TABLE ManageUserRolesDetails (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ManageRoleId BIGINT NOT NULL FOREIGN KEY REFERENCES ManageUserRoles(Id),
    RoleId NVARCHAR(MAX) NULL,
    RoleName NVARCHAR(MAX) NULL,
    IsAllowed BIT NOT NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- UserProfile table
CREATE TABLE UserProfile (
    UserProfileId BIGINT IDENTITY(1,1) PRIMARY KEY,
    ApplicationUserId NVARCHAR(MAX) NULL,
    EmployeeId NVARCHAR(100) NULL,
    FirstName NVARCHAR(250) NULL,
    LastName NVARCHAR(250) NULL,
    DateOfBirth DATETIME2(7) NULL,
    Designation BIGINT NULL FOREIGN KEY REFERENCES Designation(Id),
    Department BIGINT NULL FOREIGN KEY REFERENCES Department(Id),
    SubDepartment BIGINT NULL FOREIGN KEY REFERENCES SubDepartment(Id),
    Site BIGINT NULL FOREIGN KEY REFERENCES AssetSite(Id),
    Location BIGINT NULL FOREIGN KEY REFERENCES AssetLocation(id),
    JoiningDate DATETIME2(7) NULL,
    LeavingDate DATETIME2(7) NULL,
    PhoneNumber NVARCHAR(20) NULL,
    Email NVARCHAR(100) NULL,
    Address NVARCHAR(500) NULL,
    Country NVARCHAR(250) NULL,
    ProfilePicture NVARCHAR(MAX) NULL,
    RoleId BIGINT NULL FOREIGN KEY REFERENCES ManageUserRoles(Id),
    IsApprover INT NULL,
    Level1Approval BIT NULL,
    Level2Approval BIT NULL,
    Level3Approval BIT NULL,
    CreatedDate DATETIME2(7) NULL,
    ModifiedDate DATETIME2(7) NULL,
    CreatedBy NVARCHAR(200) NULL,
    ModifiedBy NVARCHAR(200) NULL,
    Cancelled BIT NOT NULL
);

-- Asset table
CREATE TABLE Asset (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    AssetId NVARCHAR(50) NOT NULL,
    AssetBrand NVARCHAR(200) NULL,
    AssetModelNo NVARCHAR(200) NULL,
    AssetSerialNo NVARCHAR(200) NULL,
    Name NVARCHAR(200) NULL,
    Description NVARCHAR(200) NULL,
    Category BIGINT NULL FOREIGN KEY REFERENCES AssetCategorie(Id),
    SubCategory BIGINT NULL FOREIGN KEY REFERENCES AssetSubCategorie(Id),
    Quantity INT NULL,
    UnitPrice FLOAT NULL,
    Supplier BIGINT NULL FOREIGN KEY REFERENCES Supplier(Id),
    SiteId BIGINT NULL FOREIGN KEY REFERENCES AssetSite(Id),
    Location BIGINT NULL FOREIGN KEY REFERENCES AssetLocation(id),
    Department BIGINT NULL FOREIGN KEY REFERENCES Department(Id),
    SubDepartment BIGINT NULL FOREIGN KEY REFERENCES SubDepartment(Id),
    WarranetyInMonth INT NULL,
    IsDepreciable BIT NULL,
    DepreciableCost DECIMAL(18, 2) NULL,
    SalvageValue DECIMAL(18, 2) NULL,
    DepreciationInMonth INT NULL,
    DepreciationMethod INT NULL,
    DateAquired DATETIME NULL,
    ImageURL NVARCHAR(MAX) NULL,
    DeliveryNote NVARCHAR(MAX) NULL,
    PurchaseReceipt NVARCHAR(MAX) NULL,
    Invoice NVARCHAR(MAX) NULL,
    DateOfPurchase DATETIME2(7) NULL,
    DateOfManufacture DATETIME2(7) NULL,
    YearOfValuation DATETIME2(7) NULL,
    AssetAssignedId BIGINT NULL,
    AssetType INT NULL,
    AssignTo INT NULL,
    AssignEmployeeId BIGINT NULL FOREIGN KEY REFERENCES UserProfile(UserProfileId),
    AssetStatus BIGINT NULL FOREIGN KEY REFERENCES AssetStatus(Id),
    ApproverType INT NULL,
    TransferAppStatus INT NULL,
    DisposalAppStatus INT NULL,
    DisposalDate DATETIME NULL,
    DisposalMethod INT NULL,
    DisposalDocument NVARCHAR(MAX) NULL,
    IsAvilable BIT NULL,
    Note NVARCHAR(MAX) NULL,
    Barcode NVARCHAR(MAX) NULL,
    QRCode NVARCHAR(MAX) NULL,
    QRCodeImage NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NULL,
    ModifiedDate DATETIME2(7) NULL,
    CreatedBy NVARCHAR(200) NULL,
    ModifiedBy NVARCHAR(200) NULL,
    Cancelled BIT NOT NULL
);

-- AssetAssigned table
CREATE TABLE AssetAssigned (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    AssetId BIGINT NOT NULL FOREIGN KEY REFERENCES Asset(Id),
    AssignedFrom BIGINT NULL,
    EmployeeIdFrom BIGINT NULL,
    SiteIdFrom BIGINT NULL,
    LocationIdFrom BIGINT NULL,
    AssetType INT NULL,
    AssignTo INT NULL,
    EmployeeId BIGINT NOT NULL FOREIGN KEY REFERENCES UserProfile(UserProfileId),
    SiteId BIGINT NULL FOREIGN KEY REFERENCES AssetSite(Id),
    LocationId BIGINT NULL FOREIGN KEY REFERENCES AssetLocation(id),
    Status NVARCHAR(MAX) NULL,
    TransferDate DATETIME NULL,
    DueDate DATETIME NULL,
    ApproverType INT NULL,
    ApprovalStatus INT NULL,
    Level1Approvedby NVARCHAR(MAX) NULL,
    Level2Approvedby NVARCHAR(MAX) NULL,
    Level3Approvedby NVARCHAR(MAX) NULL,
    Level1ApprovedDate DATETIME NULL,
    Level2ApprovedDate DATETIME NULL,
    Level3ApprovedDate DATETIME NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- AssetHistory table
CREATE TABLE AssetHistory (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    AssetId BIGINT NOT NULL FOREIGN KEY REFERENCES Asset(Id),
    AssignEmployeeId BIGINT NOT NULL FOREIGN KEY REFERENCES UserProfile(UserProfileId),
    Action NVARCHAR(MAX) NULL,
    Note NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- AssetIssue table
CREATE TABLE AssetIssue (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    AssetId BIGINT NOT NULL FOREIGN KEY REFERENCES Asset(Id),
    RaisedByEmployeeId BIGINT NOT NULL FOREIGN KEY REFERENCES UserProfile(UserProfileId),
    IssueDescription NVARCHAR(MAX) NULL,
    Status NVARCHAR(200) NULL,
    ExpectedFixDate DATETIME2(7) NULL,
    ResolvedDate DATETIME2(7) NULL,
    RepairCost NUMERIC(18, 2) NULL,
    Invoice NVARCHAR(MAX) NULL,
    Comment NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(200) NULL,
    ModifiedBy NVARCHAR(200) NULL,
    Cancelled BIT NOT NULL
);

-- AssetRequest table
CREATE TABLE AssetRequest (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    AssetId BIGINT NOT NULL FOREIGN KEY REFERENCES Asset(Id),
    RequestedEmployeeId BIGINT NOT NULL FOREIGN KEY REFERENCES UserProfile(UserProfileId),
    ApprovedByEmployeeId BIGINT NOT NULL FOREIGN KEY REFERENCES UserProfile(UserProfileId),
    RequestDetails NVARCHAR(MAX) NULL,
    Status NVARCHAR(MAX) NULL,
    RequestDate DATETIME2(7) NOT NULL,
    ReceiveDate DATETIME2(7) NOT NULL,
    Comment NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- Comment table
CREATE TABLE Comment (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    AssetId BIGINT NOT NULL FOREIGN KEY REFERENCES Asset(Id),
    Message NVARCHAR(MAX) NULL,
    IsDeleted BIT NOT NULL,
    IsAdmin BIT NOT NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    CommentType INT NULL,
    Cancelled BIT NOT NULL
);

-- AssetTransferType table
CREATE TABLE AssetTransferType (
    Id INT PRIMARY KEY,
    Description NVARCHAR(200) NULL
);

-- AuditLogs table
CREATE TABLE AuditLogs (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId NVARCHAR(MAX) NULL,
    Type NVARCHAR(MAX) NULL,
    TableName NVARCHAR(MAX) NULL,
    DateTime DATETIME2(7) NOT NULL,
    OldValues NVARCHAR(MAX) NULL,
    NewValues NVARCHAR(MAX) NULL,
    AffectedColumns NVARCHAR(MAX) NULL,
    PrimaryKey NVARCHAR(MAX) NULL
);

-- CompanyInfo table
CREATE TABLE CompanyInfo (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(MAX) NULL,
    Logo NVARCHAR(MAX) NULL,
    Currency NVARCHAR(MAX) NULL,
    Address NVARCHAR(MAX) NULL,
    City NVARCHAR(MAX) NULL,
    Country NVARCHAR(MAX) NULL,
    Phone NVARCHAR(MAX) NULL,
    Email NVARCHAR(MAX) NULL,
    Fax NVARCHAR(MAX) NULL,
    Website NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- DefaultIdentityOptions table
CREATE TABLE DefaultIdentityOptions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PasswordRequireDigit BIT NOT NULL,
    PasswordRequiredLength INT NOT NULL,
    PasswordRequireNonAlphanumeric BIT NOT NULL,
    PasswordRequireUppercase BIT NOT NULL,
    PasswordRequireLowercase BIT NOT NULL,
    PasswordRequiredUniqueChars INT NOT NULL,
    LockoutDefaultLockoutTimeSpanInMinutes FLOAT NOT NULL,
    LockoutMaxFailedAccessAttempts INT NOT NULL,
    LockoutAllowedForNewUsers BIT NOT NULL,
    UserRequireUniqueEmail BIT NOT NULL,
    SignInRequireConfirmedEmail BIT NOT NULL,
    CookieHttpOnly BIT NOT NULL,
    CookieExpiration FLOAT NOT NULL,
    CookieExpireTimeSpan FLOAT NOT NULL,
    LoginPath NVARCHAR(MAX) NULL,
    LogoutPath NVARCHAR(MAX) NULL,
    AccessDeniedPath NVARCHAR(MAX) NULL,
    SlidingExpiration BIT NOT NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- ItemDropdownListViewModel table
CREATE TABLE ItemDropdownListViewModel (
    Id BIGINT PRIMARY KEY,
    Name NVARCHAR(MAX) NULL
);

-- LoginHistory table
CREATE TABLE LoginHistory (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserName NVARCHAR(MAX) NULL,
    LoginTime DATETIME2(7) NOT NULL,
    LogoutTime DATETIME2(7) NULL,
    Duration FLOAT NOT NULL,
    PublicIP NVARCHAR(MAX) NULL,
    Latitude NVARCHAR(MAX) NULL,
    Longitude NVARCHAR(MAX) NULL,
    Browser NVARCHAR(MAX) NULL,
    OperatingSystem NVARCHAR(MAX) NULL,
    Device NVARCHAR(MAX) NULL,
    Action NVARCHAR(MAX) NULL,
    ActionStatus NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- SendGridSetting table
CREATE TABLE SendGridSetting (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SendGridUser NVARCHAR(MAX) NULL,
    SendGridKey NVARCHAR(MAX) NULL,
    FromEmail NVARCHAR(MAX) NULL,
    FromFullName NVARCHAR(MAX) NULL,
    IsDefault BIT NOT NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- SMTPEmailSetting table
CREATE TABLE SMTPEmailSetting (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserName NVARCHAR(MAX) NULL,
    Password NVARCHAR(MAX) NULL,
    Host NVARCHAR(MAX) NULL,
    Port INT NOT NULL,
    IsSSL BIT NOT NULL,
    FromEmail NVARCHAR(MAX) NULL,
    FromFullName NVARCHAR(MAX) NULL,
    IsDefault BIT NOT NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- SubscriptionRequest table
CREATE TABLE SubscriptionRequest (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(MAX) NULL,
    TimeZone NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

-- UserInfoFromBrowser table
CREATE TABLE UserInfoFromBrowser (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    BrowserUniqueID NVARCHAR(MAX) NULL,
    Lat NVARCHAR(MAX) NULL,
    Long NVARCHAR(MAX) NULL,
    TimeZone NVARCHAR(MAX) NULL,
    BrowserMajor NVARCHAR(MAX) NULL,
    BrowserName NVARCHAR(MAX) NULL,
    BrowserVersion NVARCHAR(MAX) NULL,
    CPUArchitecture NVARCHAR(MAX) NULL,
    DeviceModel NVARCHAR(MAX) NULL,
    DeviceType NVARCHAR(MAX) NULL,
    DeviceVendor NVARCHAR(MAX) NULL,
    EngineName NVARCHAR(MAX) NULL,
    EngineVersion NVARCHAR(MAX) NULL,
    OSName NVARCHAR(MAX) NULL,
    OSVersion NVARCHAR(MAX) NULL,
    UA NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NOT NULL,
    CreatedBy NVARCHAR(MAX) NULL,
    ModifiedBy NVARCHAR(MAX) NULL,
    Cancelled BIT NOT NULL
);

CREATE TABLE emp_data (
    Sno FLOAT NULL,
    EmpId FLOAT NULL,
    EmployeeName NVARCHAR(255) NULL,
    Designation NVARCHAR(255) NULL,
    Department NVARCHAR(255) NULL
);



-- Books table
/*CREATE TABLE Books (
    BookID INT IDENTITY(1,1) PRIMARY KEY,
    BookTitle VARCHAR(200) NULL,
    ISBN VARCHAR(50) NULL,
    AuthorID INT NULL,
    DepartmentID INT NULL FOREIGN KEY REFERENCES Department(Id),
    NoOfPage INT NULL,
    PublisherID INT NULL,
    ImageUrl VARCHAR(100) NULL
);*/