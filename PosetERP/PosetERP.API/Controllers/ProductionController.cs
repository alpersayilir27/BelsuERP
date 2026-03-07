using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PosetERP.Application.Interfaces;

namespace PosetERP.API.Controllers;

[ApiController]
[Route("api/production")]
public class ProductionController : ControllerBase
{
    private readonly IProductionService _productionService;

    public ProductionController(IProductionService productionService)
    {
        _productionService = productionService;
    }

    [HttpPost("{stageId}/consume-material")]
    public async Task<IActionResult> ConsumeMaterial(Guid stageId, [FromBody] ConsumeMaterialDto request)
    {
        try
        {
            await _productionService.ConsumeMaterialAsync(stageId, request.MaterialId, request.ConsumedAmountKg);
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
}

public class ConsumeMaterialDto
{
    public Guid MaterialId { get; set; }
    public decimal ConsumedAmountKg { get; set; }
}
