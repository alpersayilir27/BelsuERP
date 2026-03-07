using PosetERP.Domain.Enums;

namespace PosetERP.Domain.Entities;

public class ProductionStage
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public StageType StageType { get; set; }
    public ProductionStatus Status { get; set; }
    public decimal ConsumedMaterialKg { get; set; }
    public decimal WasteKg { get; set; }
    public DateTime? CompletedAt { get; set; }

    public Order? Order { get; set; }
}
