using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosetERP.Domain.Entities;
using PosetERP.Infrastructure;

namespace PosetERP.API.Controllers;

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
}
