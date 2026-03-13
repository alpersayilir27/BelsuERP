using System;
using System.Collections.Generic;

namespace PosetERP.Domain.Entities
{
    public class Supplier : AuditableEntity
    {
        public Guid Id { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? ContactPerson { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        
        public ICollection<RawMaterialPurchase> Purchases { get; set; } = new List<RawMaterialPurchase>();
    }
}
