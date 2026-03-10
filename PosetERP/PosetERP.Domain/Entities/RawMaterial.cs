namespace PosetERP.Domain.Entities;

public class RawMaterial
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal StockKg { get; set; }
    public decimal MinimumStockAlert { get; set; }
    public decimal AverageCostPerKg { get; set; } = 0;
    public string Category { get; set; } = "Granül";

    public ICollection<RawMaterialPurchase> Purchases { get; set; } = new List<RawMaterialPurchase>();
}
