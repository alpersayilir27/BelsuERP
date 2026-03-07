using PosetERP.Domain.Enums;

namespace PosetERP.Domain.Entities;

public class Order
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public DateTime OrderDate { get; set; }
    public DateTime TargetDeliveryDate { get; set; }
    public BagType BagType { get; set; }
    public string? Dimensions { get; set; }
    public int ThicknessMicron { get; set; }
    public decimal RequestedAmountKg { get; set; }
    public OrderStatus Status { get; set; }

    public Customer? Customer { get; set; }
    public ICollection<ProductionStage> ProductionStages { get; set; } = new List<ProductionStage>();
}
