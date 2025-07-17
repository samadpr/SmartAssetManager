using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class SMTPEmailSetting : EntityBase
{
    public int Id { get; set; }

    public string? UserName { get; set; }

    public string? Password { get; set; }

    public string? Host { get; set; }

    public int Port { get; set; }

    public bool IsSSl { get; set; }

    public string? FromEmail { get; set; }

    public string? FromFullName { get; set; }

    public bool IsDefault { get; set; }
}
