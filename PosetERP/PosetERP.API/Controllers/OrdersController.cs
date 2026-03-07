using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PosetERP.Application.Interfaces;

namespace PosetERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost("{id}/start-production")]
    public async Task<IActionResult> StartProduction(Guid id)
    {
        try
        {
            await _orderService.StartProductionAsync(id);
            return Ok(new { Message = "Production started successfully.", OrderId = id });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }
}
