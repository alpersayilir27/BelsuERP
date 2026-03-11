using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosetERP.Application.Interfaces;
using PosetERP.Infrastructure;
using Microsoft.AspNetCore.Authorization;

namespace PosetERP.API.Controllers;

[Authorize(Roles = "Admin,Usta")]
[ApiController]
[Route("api/production")]
public class ProductionController : ControllerBase
{
    private readonly IProductionService _productionService;
    private readonly AppDbContext _context;

    public ProductionController(IProductionService productionService, AppDbContext context)
    {
        _productionService = productionService;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetProductionStages()
    {
        var stages = await _context.ProductionStages
            .Include(ps => ps.Order)
                .ThenInclude(o => o.Customer)
            .Include(ps => ps.RawMaterial)
            .Select(ps => new
            {
                ps.Id,
                ps.OrderId,
                CustomerName = ps.Order != null && ps.Order.Customer != null ? ps.Order.Customer.CompanyName : "Bilinmeyen",
                BagType = ps.Order != null ? ps.Order.BagType.ToString() : "",
                RequestedAmountKg = ps.Order != null ? ps.Order.RequestedAmountKg : 0,
                TargetDeliveryDate = ps.Order != null ? ps.Order.TargetDeliveryDate : (DateTime?)null,
                OrderStatus = ps.Order != null ? ps.Order.Status.ToString() : "Unknown",
                StageType = ps.StageType.ToString(),
                Status = ps.Status.ToString(),
                ps.ConsumedMaterialKg,
                ps.WasteKg,
                RawMaterialName = ps.RawMaterial != null ? ps.RawMaterial.Name : "",
                ps.ProducedQuantity
            })
            .ToListAsync();

        return Ok(stages);
    }

    [HttpPost("{stageId}/consume-material")]
    public async Task<IActionResult> ConsumeMaterial(Guid stageId, [FromBody] ConsumeMaterialDto request)
    {
        try
        {
            await _productionService.ConsumeMaterialAsync(stageId, request.MaterialId, request.ConsumedAmountKg, request.WasteKg, request.ProducedQuantity);
            return Ok(new { Message = "Material consumed successfully.", StageId = stageId });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = "An unexpected error occurred: " + ex.Message });
        }
    }

    [HttpPut("{stageId}/status")]
    public async Task<IActionResult> UpdateStageStatus(Guid stageId, [FromBody] PosetERP.Domain.Enums.ProductionStatus status)
    {
        try
        {
            await _productionService.UpdateStageStatusAsync(stageId, status);
            return Ok(new { Message = "Stage status updated successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = "An unexpected error occurred: " + ex.Message });
        }
    }
}

public class ConsumeMaterialDto
{
    public Guid? MaterialId { get; set; }
    public decimal ConsumedAmountKg { get; set; }
    public decimal WasteKg { get; set; }
    public decimal ProducedQuantity { get; set; }
}
