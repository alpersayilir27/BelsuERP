using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosetERP.Domain.Entities;
using PosetERP.Infrastructure;

namespace PosetERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetUsers()
        {
            var users = _context.Users.Select(u => new
            {
                u.Id,
                u.Username,
                u.Role
            }).ToList();

            return Ok(users);
        }

        [HttpPost]
        public IActionResult CreateUser([FromBody] UserDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Role))
            {
                return BadRequest(new { message = "Kullanıcı adı ve rol zorunludur." });
            }

            if (_context.Users.Any(u => u.Username == dto.Username))
            {
                return BadRequest(new { message = "Bu kullanıcı adı zaten kullanılıyor." });
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = dto.Username,
                PasswordHash = dto.Password, // Simple plain text for now as per prompt
                Role = dto.Role
            };

            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok(new { message = "Kullanıcı başarıyla eklendi." });
        }

        [HttpPut("{id}")]
        public IActionResult UpdateUser(Guid id, [FromBody] UserDto dto)
        {
            var user = _context.Users.Find(id);
            if (user == null) return NotFound(new { message = "Kullanıcı bulunamadı." });

            // Aynı kullanıcı hariç, büyük/küçük harf fark etmeksizin duplicate kontrol
            if (_context.Users.Any(u => u.Id != id && u.Username.ToLower() == dto.Username.ToLower()))
            {
                return BadRequest(new { message = "Bu kullanıcı adı başka bir kullanıcı tarafından kullanılıyor." });
            }

            user.Username = dto.Username;
            user.Role = dto.Role;
            
            if (!string.IsNullOrEmpty(dto.Password))
            {
                user.PasswordHash = dto.Password;
            }

            _context.SaveChanges();
            return Ok(new { message = "Kullanıcı başarıyla güncellendi." });
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteUser(Guid id)
        {
            var user = _context.Users.Find(id);
            if (user == null) return NotFound(new { message = "Kullanıcı bulunamadı." });

            _context.Users.Remove(user);
            _context.SaveChanges();

            return Ok(new { message = "Kullanıcı başarıyla silindi." });
        }
    }

    public class UserDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
