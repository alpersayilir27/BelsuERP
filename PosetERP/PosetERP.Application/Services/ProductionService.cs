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

    public async Task ConsumeMaterialAsync(Guid stageId, Guid materialId, decimal consumedAmountKg)
    {
        try
        {
            var stage = await _context.ProductionStages.FindAsync(stageId);
            if (stage == null)
            {
                _logger.LogWarning($"ProductionStage with ID {stageId} not found.");
                return;
            }

            var material = await _context.RawMaterials.FindAsync(materialId);
            if (material == null)
            {
                _logger.LogWarning($"RawMaterial with ID {materialId} not found.");
                return;
            }

            if (material.StockKg < consumedAmountKg)
            {
                _logger.LogWarning($"Not enough stock for Material ID {materialId}. Current stock: {material.StockKg}kg, Requested: {consumedAmountKg}kg");
                // For simplicity, we can let it go negative or stop it. Here we throw or warn.
                // Assuming it's allowed but logs a warning, or it throws an exception.
                // Let's throw an exception to prevent negative stock.
                throw new InvalidOperationException("Not enough stock in the inventory.");
            }

            // Update stage consumed material
            stage.ConsumedMaterialKg += consumedAmountKg;

            // Reduce stock
            material.StockKg -= consumedAmountKg;

            await _context.SaveChangesAsync();
            
            _logger.LogInformation($"Consumed {consumedAmountKg}kg of material {material.Name} for stage {stageId}");

            // Check minimum stock alert
            if (material.StockKg < material.MinimumStockAlert)
            {
                _logger.LogWarning($"STOCK ALERT! Material {material.Name} (ID: {material.Id}) has fallen below the minimum stock alert level. Current Stock: {material.StockKg}kg, Minimum Required: {material.MinimumStockAlert}kg.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error while consuming material for stage ID {stageId} and material ID {materialId}");
            throw;
        }
    }
}
