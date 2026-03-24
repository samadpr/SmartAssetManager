using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;

namespace SAMS.Models;

[Index(nameof(Email), IsUnique = true)]
public class CompanyInfo : EntityBase
{
    public long Id { get; set; }

    public Guid OrganizationId { get; set; }

    public long? IndustriesId { get; set; }

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

    // NEW SUBSCRIPTION FIELDS

    public long? SubscriptionId { get; set; }

    public DateTime? SubscriptionDate { get; set; }

    public DateTime? SubscriptionExpiryDate { get; set; }

    public bool IsActive { get; set; }

    public SubscriptionPlan? SubscriptionPlan { get; set; }

    public Industries? Industry { get; set; }
}
