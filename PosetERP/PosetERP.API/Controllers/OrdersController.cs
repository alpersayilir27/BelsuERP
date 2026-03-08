using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosetERP.Application.Interfaces;
using PosetERP.Domain.Entities;
using PosetERP.Domain.Enums;
using PosetERP.Infrastructure;

namespace PosetERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly AppDbContext _context;

    public OrdersController(IOrderService orderService, AppDbContext context)
    {
        _orderService = orderService;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetOrders()
    {
        var orders = await _context.Orders
            .Include(o => o.Customer)
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new 
            {
                o.Id,
                o.CustomerId,
                CustomerName = o.Customer != null ? o.Customer.CompanyName : "Bilinmeyen",
                o.OrderDate,
                o.TargetDeliveryDate,
                BagType = o.BagType.ToString(),
                o.Dimensions,
                o.ThicknessMicron,
                o.RequestedAmountKg,
                Status = o.Status.ToString()
            })
            .ToListAsync();
            
        return Ok(orders);
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
    {
        if (dto == null) return BadRequest("Invalid data");
        
        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = dto.CustomerId,
            OrderDate = DateTime.Now,
            TargetDeliveryDate = dto.TargetDeliveryDate,
            BagType = dto.BagType,
            Dimensions = dto.Dimensions,
            ThicknessMicron = dto.ThicknessMicron,
            RequestedAmountKg = dto.RequestedAmountKg,
            Status = OrderStatus.Pending
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return Ok(order);
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

public class CreateOrderDto
{
    public Guid CustomerId { get; set; }
    public DateTime TargetDeliveryDate { get; set; }
    public BagType BagType { get; set; }
    public string? Dimensions { get; set; }
    public int ThicknessMicron { get; set; }
    public decimal RequestedAmountKg { get; set; }
}
