using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosetERP.Application.Interfaces;
using PosetERP.Domain.Entities;
using PosetERP.Domain.Enums;
using PosetERP.Infrastructure;
using Microsoft.AspNetCore.Authorization;

namespace PosetERP.API.Controllers;

[Authorize(Roles = "Admin")]
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
    public async Task<IActionResult> GetOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 100, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] string status = "ALL")
    {
        var query = _context.Orders.Include(o => o.Customer).AsQueryable();

        if (startDate.HasValue)
            query = query.Where(o => o.OrderDate >= startDate.Value.Date);

        if (endDate.HasValue)
            query = query.Where(o => o.OrderDate <= endDate.Value.Date.AddDays(1).AddTicks(-1));

        if (!string.IsNullOrEmpty(status) && status != "ALL")
        {
            if (Enum.TryParse<OrderStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(o => o.Status == parsedStatus);
            }
        }

        var totalCount = await query.CountAsync();

        var orders = await query
            .OrderByDescending(o => o.OrderDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
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
                o.TotalPrice,
                Status = o.Status.ToString()
            })
            .ToListAsync();
            
        return Ok(new 
        {
            Items = orders,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
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
            TotalPrice = dto.TotalPrice,
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

    [HttpPost("{id}/deliver")]
    public async Task<IActionResult> DeliverOrder(Guid id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound(new { Error = "Sipariş bulunamadı." });

        if (order.Status != OrderStatus.Completed)
        {
            return BadRequest(new { Error = "Siparişin teslim edilebilmesi için üretimi tamamlanmış (Completed) olması gerekir." });
        }

        order.Status = OrderStatus.Shipped;
        order.NetProfit = (order.TotalPrice ?? 0) - (order.TotalCost ?? 0);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Sipariş teslim edildi ve arşivlendi." });
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
    public decimal TotalPrice { get; set; }
}
