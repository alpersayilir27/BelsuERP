using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PosetERP.Application.Interfaces;
using PosetERP.Domain.Entities;
using PosetERP.Domain.Enums;
using PosetERP.Infrastructure;

namespace PosetERP.Application.Services;

public class OrderService : IOrderService
{
    private readonly AppDbContext _context;
    private readonly ILogger<OrderService> _logger;

    public OrderService(AppDbContext context, ILogger<OrderService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task StartProductionAsync(Guid orderId)
    {
        try
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null)
            {
                _logger.LogWarning($"Order with ID {orderId} not found.");
                return;
            }

            if (order.Status != OrderStatus.Pending)
            {
                _logger.LogWarning($"Order with ID {orderId} is not in Pending status. Current status: {order.Status}");
                return;
            }

            // Update order status
            order.Status = OrderStatus.InProduction;

            // Create production stages conditionally
            var stagesList = new List<ProductionStage>
            {
                new ProductionStage
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    StageType = StageType.Extruder,
                    Status = ProductionStatus.NotStarted,
                    ConsumedMaterialKg = 0,
                    WasteKg = 0
                }
            };

            if (order.BagType != BagType.Baskisiz)
            {
                stagesList.Add(new ProductionStage
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    StageType = StageType.Printing,
                    Status = ProductionStatus.NotStarted,
                    ConsumedMaterialKg = 0,
                    WasteKg = 0
                });
            }

            stagesList.Add(new ProductionStage
            {
                Id = Guid.NewGuid(),
                OrderId = orderId,
                StageType = StageType.Cutting,
                Status = ProductionStatus.NotStarted,
                ConsumedMaterialKg = 0,
                WasteKg = 0
            });

            var stages = stagesList.ToArray();

            await _context.ProductionStages.AddRangeAsync(stages);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Production started successfully for Order ID: {orderId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to start production for Order ID: {orderId}");
            throw; // Re-throw to handle it appropriately in controllers or callers
        }
    }
}
