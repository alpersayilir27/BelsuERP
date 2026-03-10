using System;

namespace PosetERP.Domain.Entities
{
    public class RawMaterialPurchase
    {
        public Guid Id { get; set; }
        public Guid SupplierId { get; set; }
        public Supplier? Supplier { get; set; }
        
        public Guid RawMaterialId { get; set; }
        public RawMaterial? RawMaterial { get; set; }
        
        public decimal AmountKg { get; set; }
        public decimal UnitPrice { get; set; } // Fiyat / Kg
        public decimal TotalPrice { get; set; }
        
        public DateTime PurchaseDate { get; set; }
    }
}
