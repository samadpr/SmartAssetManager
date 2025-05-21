using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class CompanyInfo : EntityBase
{
    public long Id { get; set; }

    public string? Name { get; set; }

    public string? Logo { get; set; }

    public string? Currency { get; set; }

    public string? Address { get; set; }

    public string? City { get; set; }

    public string? Country { get; set; }

    public string? Phone { get; set; }

    public string? Email { get; set; }

    public string? Fax { get; set; }

    public string? Website { get; set; }
}
