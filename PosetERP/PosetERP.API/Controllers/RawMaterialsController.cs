using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosetERP.Domain.Entities;
using PosetERP.Infrastructure;
using Microsoft.AspNetCore.Authorization;

namespace PosetERP.API.Controllers;

[Authorize(Roles = "Admin,Yonetici,Usta")]
[ApiController]
[Route("api/rawmaterials")]
public class RawMaterialsController : ControllerBase
{
    private readonly AppDbContext _context;

    public RawMaterialsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetRawMaterials()
    {
        try
        {
            var materials = await _context.RawMaterials.ToListAsync();
            return Ok(materials);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = "An unexpected error occurred: " + ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateRawMaterial([FromBody] RawMaterial rawMaterial)
    {
        try
        {
            if (rawMaterial == null || string.IsNullOrWhiteSpace(rawMaterial.Name))
            {
                return BadRequest("Material Name is required.");
            }

            rawMaterial.Id = Guid.NewGuid();
            _context.RawMaterials.Add(rawMaterial);
            await _context.SaveChangesAsync();

            return Ok(rawMaterial);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = "An unexpected error occurred: " + ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRawMaterial(Guid id, [FromBody] RawMaterial updateDto)
    {
        try
        {
            if (id != updateDto.Id)
            {
                return BadRequest("ID mismatch");
            }

            var material = await _context.RawMaterials.FindAsync(id);
            if (material == null)
            {
                return NotFound();
            }

            if (string.IsNullOrWhiteSpace(updateDto.Name))
            {
                return BadRequest("Material Name is required.");
            }

            material.Name = updateDto.Name;
            material.StockKg = updateDto.StockKg;
            material.MinimumStockAlert = updateDto.MinimumStockAlert;
            material.Category = updateDto.Category ?? "Granül";

            await _context.SaveChangesAsync();
            return Ok(material);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = "An unexpected error occurred: " + ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRawMaterial(Guid id)
    {
        try
        {
            var material = await _context.RawMaterials.FindAsync(id);
            if (material == null)
            {
                return NotFound();
            }

            // Hammaddenin kullanılıp kullanılmadığını kontrol et (Ön kontrol)
            var isUsedInProduction = await _context.ProductionStages.AnyAsync(ps => ps.RawMaterialId == id);
            if (isUsedInProduction)
            {
                return BadRequest("Bu hammadde üretim geçmişinde kullanıldığı için silinemez.");
            }

            var isUsedInPurchases = await _context.RawMaterialPurchases.AnyAsync(rp => rp.RawMaterialId == id);
            if (isUsedInPurchases)
            {
                return BadRequest("Bu hammadde satın alma geçmişinde (faturalarda) kullanıldığı için silinemez.");
            }

            _context.RawMaterials.Remove(material);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (DbUpdateException)
        {
            // Eğer veritabanı seviyesinde bir kısıtlamaya takılırsa (Constraint Error)
            return BadRequest("Bu hammadde üretim veya satın alma geçmişinde kullanıldığı için silinemez.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = "An unexpected error occurred: " + ex.Message });
        }
    }
}
