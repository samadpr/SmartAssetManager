using System;
using System.Collections.Generic;

namespace SAMS.Models;

public class SubscriptionRequest : EntityBase
{
    public long Id { get; set; }

    public string? Email { get; set; }

    public string? TimeZone { get; set; }
}
