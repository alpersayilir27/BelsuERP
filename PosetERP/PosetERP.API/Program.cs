// using Microsoft.EntityFrameworkCore;
// using PosetERP.Application.Interfaces;
// using PosetERP.Application.Services;
// using PosetERP.Infrastructure;

// var builder = WebApplication.CreateBuilder(args);

// // Add services to the container.
// builder.Services.AddDbContext<AppDbContext>(options =>
//     options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// builder.Services.AddScoped<IOrderService, OrderService>();
// builder.Services.AddScoped<IProductionService, ProductionService>();

// builder.Services.AddControllers();

// builder.Services.AddOpenApi();

// var app = builder.Build();

// // Configure the HTTP request pipeline.
// if (app.Environment.IsDevelopment())
// {
//     app.MapOpenApi();
// }

// app.UseHttpsRedirection();

// app.MapControllers();

// var summaries = new[]
// {
//     "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
// };

// app.MapGet("/weatherforecast", () =>
// {
//     var forecast =  Enumerable.Range(1, 5).Select(index =>
//         new WeatherForecast
//         (
//             DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
//             Random.Shared.Next(-20, 55),
//             summaries[Random.Shared.Next(summaries.Length)]
//         ))
//         .ToArray();
//     return forecast;
// })
// .WithName("GetWeatherForecast");

// app.Run();

// record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
// {
//     public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
// }

using Microsoft.EntityFrameworkCore;
using PosetERP.Application.Interfaces;
using PosetERP.Application.Services;
using PosetERP.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Veritabanı Bağlantısı
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Servis Kayıtları (Dependency Injection)
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IProductionService, ProductionService>();

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// Swagger UI için gereken 2 satır
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Tarayıcıda Swagger Görsel Arayüzünü Açmak İçin
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.MapControllers();

app.Run();