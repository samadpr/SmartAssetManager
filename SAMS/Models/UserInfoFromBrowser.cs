using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class UserInfoFromBrowser : EntityBase
{
    public long Id { get; set; }

    public string? BrowserUniqueId { get; set; }

    public string? Lat { get; set; }

    public string? Long { get; set; }

    public string? TimeZone { get; set; }

    public string? BrowserMajor { get; set; }

    public string? BrowserName { get; set; }

    public string? BrowserVersion { get; set; }

    public string? CPUArchitecture { get; set; }

    public string? DeviceModel { get; set; }

    public string? DeviceType { get; set; }

    public string? DeviceVendor { get; set; }

    public string? EngineName { get; set; }

    public string? EngineVersion { get; set; }

    public string? OSName { get; set; }

    public string? OSVersion { get; set; }

    public string? UA { get; set; }

    public DateTime CreatedDate { get; set; }

    public DateTime ModifiedDate { get; set; }

    public string? CreatedBy { get; set; }

    public string? ModifiedBy { get; set; }

    public bool Cancelled { get; set; }
}
