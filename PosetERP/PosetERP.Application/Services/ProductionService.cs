using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PosetERP.Application.Interfaces;
using PosetERP.Infrastructure;

namespace PosetERP.Application.Services;

public class ProductionService : IProductionService
{
    private readonly AppDbContext _context;
    private readonly ILogger<ProductionService> _logger;

    public ProductionService(AppDbContext context, ILogger<ProductionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ConsumeMaterialAsync(Guid stageId, Guid? materialId, decimal consumedAmountKg, decimal wasteKg, decimal producedQuantity)
    {
        try
        {
            var stage = await _context.ProductionStages.Include(s => s.Order).FirstOrDefaultAsync(s => s.Id == stageId);
            if (stage == null)
            {
                _logger.LogWarning($"ProductionStage with ID {stageId} not found.");
                return;
            }

            // Update stage consumed material, waste, and produced quantity
            stage.ConsumedMaterialKg += consumedAmountKg;
            stage.WasteKg += wasteKg;
            stage.ProducedQuantity += producedQuantity;

            if (materialId.HasValue && materialId.Value != Guid.Empty)
            {
                stage.RawMaterialId = materialId.Value;
                var material = await _context.RawMaterials.FindAsync(materialId.Value);
                if (material == null)
                {
                    _logger.LogWarning($"RawMaterial with ID {materialId.Value} not found.");
                    return;
                }

                if (material.StockKg < consumedAmountKg)
                {
                    _logger.LogWarning($"Not enough stock for Material ID {materialId.Value}. Current stock: {material.StockKg}kg, Requested: {consumedAmountKg}kg");
                    throw new InvalidOperationException("Not enough stock in the inventory.");
                }

                // Reduce stock
                material.StockKg -= consumedAmountKg;
                
                // Add Cost to Order
                if (stage.Order != null)
                {
                    stage.Order.TotalCost = (stage.Order.TotalCost ?? 0) + ((consumedAmountKg + wasteKg) * material.AverageCostPerKg);
                }

                _logger.LogInformation($"Consumed {consumedAmountKg}kg of material {material.Name} for stage {stageId}");

                // Check minimum stock alert
                if (material.StockKg < material.MinimumStockAlert)
                {
                    _logger.LogWarning($"STOCK ALERT! Material {material.Name} (ID: {material.Id}) has fallen below the minimum stock alert level. Current Stock: {material.StockKg}kg, Minimum Required: {material.MinimumStockAlert}kg.");
                }
            }
            else
            {
                 _logger.LogInformation($"Stage {stageId} completed with no material consumed. Waste recorded: {wasteKg}kg.");
            }

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error while consuming material for stage ID {stageId} and material ID {materialId}");
            throw;
        }
    }

    public async Task UpdateStageStatusAsync(Guid stageId, PosetERP.Domain.Enums.ProductionStatus newStatus)
    {
        var stage = await _context.ProductionStages
            .Include(s => s.Order)
            .FirstOrDefaultAsync(s => s.Id == stageId);
            
        if (stage == null)
        {
            _logger.LogWarning($"ProductionStage with ID {stageId} not found.");
            throw new InvalidOperationException("Belirtilen üretim aşaması bulunamadı.");
        }

        stage.Status = newStatus;
        
        // If the stage is Cutting and it is Finished, set Order Status to Completed
        if (stage.StageType == PosetERP.Domain.Enums.StageType.Cutting && newStatus == PosetERP.Domain.Enums.ProductionStatus.Finished)
        {
            if (stage.Order != null)
            {
                stage.Order.Status = PosetERP.Domain.Enums.OrderStatus.Completed;
                _logger.LogInformation($"Order {stage.Order.Id} automatically marked as Completed because Cutting stage finished.");
            }
        }

        await _context.SaveChangesAsync();
    }
}
