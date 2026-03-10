using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosetERP.Domain.Entities;
using PosetERP.Infrastructure;

namespace PosetERP.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class RawMaterialPurchasesController : ControllerBase
{
    private readonly AppDbContext _context;

    public RawMaterialPurchasesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPurchases()
    {
        var purchases = await _context.RawMaterialPurchases
            .Include(p => p.Supplier)
            .Include(p => p.RawMaterial)
            .OrderByDescending(p => p.PurchaseDate)
            .Select(p => new
            {
                p.Id,
                p.PurchaseDate,
                SupplierName = p.Supplier.CompanyName,
                RawMaterialName = p.RawMaterial.Name,
                p.AmountKg,
                p.UnitPrice,
                p.TotalPrice
            })
            .ToListAsync();
        return Ok(purchases);
    }

    [HttpPost]
    public async Task<IActionResult> AddPurchase([FromBody] CreatePurchaseDto dto)
    {
        var material = await _context.RawMaterials.FindAsync(dto.RawMaterialId);
        if (material == null) return NotFound("Hammadde bulunamadı.");

        var supplier = await _context.Suppliers.FindAsync(dto.SupplierId);
        if (supplier == null) return NotFound("Tedarikçi bulunamadı.");

        // Calculate new average cost
        decimal oldTotalValue = material.StockKg * material.AverageCostPerKg;
        decimal newPurchaseValue = dto.AmountKg * dto.UnitPrice;
        decimal newTotalStock = material.StockKg + dto.AmountKg;

        if (newTotalStock > 0)
        {
            material.AverageCostPerKg = (oldTotalValue + newPurchaseValue) / newTotalStock;
        }
        
        // Update Stock
        material.StockKg = newTotalStock;

        var purchase = new RawMaterialPurchase
        {
            Id = Guid.NewGuid(),
            SupplierId = dto.SupplierId,
            RawMaterialId = dto.RawMaterialId,
            AmountKg = dto.AmountKg,
            UnitPrice = dto.UnitPrice,
            TotalPrice = newPurchaseValue,
            PurchaseDate = dto.PurchaseDate ?? DateTime.Now
        };

        _context.RawMaterialPurchases.Add(purchase);
        await _context.SaveChangesAsync();

        return Ok(purchase);
    }
}

public class CreatePurchaseDto
{
    public Guid SupplierId { get; set; }
    public Guid RawMaterialId { get; set; }
    public decimal AmountKg { get; set; }
    public decimal UnitPrice { get; set; }
    public DateTime? PurchaseDate { get; set; }
}
