using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosetERP.Infrastructure;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PosetERP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ExportController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExportController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("excel/customers")]
        public async Task<IActionResult> ExportCustomersExcel()
        {
            var customers = await _context.Customers.ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Müşteriler");

            worksheet.Cell(1, 1).Value = "Firma Adı";
            worksheet.Cell(1, 2).Value = "Yetkili";
            worksheet.Cell(1, 3).Value = "Telefon";
            worksheet.Cell(1, 4).Value = "Bakiye";

            // Header styling
            var headerRow = worksheet.Row(1);
            headerRow.Style.Font.Bold = true;
            headerRow.Style.Fill.BackgroundColor = XLColor.AirForceBlue;
            headerRow.Style.Font.FontColor = XLColor.White;

            for (int i = 0; i < customers.Count; i++)
            {
                var row = i + 2;
                var customer = customers[i];
                worksheet.Cell(row, 1).Value = customer.CompanyName;
                worksheet.Cell(row, 2).Value = customer.ContactPerson;
                worksheet.Cell(row, 3).Value = customer.PhoneNumber;
                worksheet.Cell(row, 4).Value = customer.Balance;
                worksheet.Cell(row, 4).Style.NumberFormat.Format = "#,##0.00 ₺";
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Müsteriler.xlsx");
        }

        [HttpGet("excel/orders")]
        public async Task<IActionResult> ExportOrdersExcel([FromQuery] string status = "")
        {
            var query = _context.Orders.Include(o => o.Customer).AsQueryable();
            if (!string.IsNullOrEmpty(status) && Enum.TryParse<PosetERP.Domain.Enums.OrderStatus>(status, out var parsedStatus))
            {
                query = query.Where(o => o.Status == parsedStatus);
            }

            var orders = await query.ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Siparişler");

            worksheet.Cell(1, 1).Value = "Sipariş No";
            worksheet.Cell(1, 2).Value = "Firma";
            worksheet.Cell(1, 3).Value = "Poşet Tipi";
            worksheet.Cell(1, 4).Value = "Miktar (Kg)";
            worksheet.Cell(1, 5).Value = "Kalınlık (Mikron)";
            worksheet.Cell(1, 6).Value = "Tutar";
            worksheet.Cell(1, 7).Value = "Durum";
            worksheet.Cell(1, 8).Value = "Sipariş Tarihi";

            var headerRow = worksheet.Row(1);
            headerRow.Style.Font.Bold = true;
            headerRow.Style.Fill.BackgroundColor = XLColor.AirForceBlue;
            headerRow.Style.Font.FontColor = XLColor.White;

            for (int i = 0; i < orders.Count; i++)
            {
                var row = i + 2;
                var order = orders[i];
                worksheet.Cell(row, 1).Value = order.Id.ToString().Substring(0, 8);
                worksheet.Cell(row, 2).Value = order.Customer != null ? order.Customer.CompanyName : "Bilinmiyor";
                worksheet.Cell(row, 3).Value = order.BagType.ToString();
                worksheet.Cell(row, 4).Value = order.RequestedAmountKg;
                worksheet.Cell(row, 4).Style.NumberFormat.Format = "#,##0.00";
                worksheet.Cell(row, 5).Value = order.ThicknessMicron;
                worksheet.Cell(row, 6).Value = order.TotalPrice ?? 0;
                worksheet.Cell(row, 6).Style.NumberFormat.Format = "#,##0.00 ₺";
                worksheet.Cell(row, 7).Value = order.Status.ToString();
                worksheet.Cell(row, 8).Value = order.OrderDate.ToString("dd.MM.yyyy");
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Siparisler_{DateTime.Now:yyyyMMdd}.xlsx");
        }

        [HttpGet("pdf/invoice/{orderId}")]
        public async Task<IActionResult> ExportInvoicePdf(Guid orderId)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null) return NotFound("Sipariş bulunamadı.");

            // Basic QuestPDF Document Generation
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));

                    page.Header().Element(compose => ComposeHeader(compose, order));
                    page.Content().Element(compose => ComposeContent(compose, order));
                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Sayfa ");
                        x.CurrentPageNumber();
                        x.Span(" / ");
                        x.TotalPages();
                    });
                });
            });

            var pdfStream = new MemoryStream();
            document.GeneratePdf(pdfStream);
            pdfStream.Position = 0;

            return File(pdfStream.ToArray(), "application/pdf", $"Irsaliye_{order.Id.ToString().Substring(0, 8)}.pdf");
        }

        private void ComposeHeader(IContainer container, PosetERP.Domain.Entities.Order order)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("BELSU ERP").FontSize(24).SemiBold().FontColor(Colors.Blue.Darken2);
                    column.Item().Text("Sipariş Teslimat İrsaliyesi").FontSize(14).FontColor(Colors.Grey.Medium);
                    column.Item().PaddingTop(5).Text($"Tarih: {DateTime.Now:dd.MM.yyyy HH:mm}");
                });

                row.ConstantItem(150).Column(column =>
                {
                    column.Item().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).Text("Müşteri Bilgileri").SemiBold();
                    column.Item().Text(order.Customer?.CompanyName).Bold();
                    column.Item().Text(order.Customer?.ContactPerson ?? "");
                    column.Item().Text(order.Customer?.PhoneNumber ?? "");
                });
            });
        }

        private void ComposeContent(IContainer container, PosetERP.Domain.Entities.Order order)
        {
            container.PaddingVertical(1, Unit.Centimetre).Column(column =>
            {
                column.Spacing(5);

                column.Item().Row(row =>
                {
                    row.RelativeItem().Text("Sipariş No:");
                    row.RelativeItem(3).Text($"#{order.Id}").SemiBold();
                });

                column.Item().Row(row =>
                {
                    row.RelativeItem().Text("Hedef Tarih:");
                    row.RelativeItem(3).Text(order.TargetDeliveryDate.ToString("dd.MM.yyyy"));
                });

                column.Item().PaddingTop(15).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(3);
                        columns.RelativeColumn(1);
                        columns.RelativeColumn(1);
                    });

                    table.Header(header =>
                    {
                        header.Cell().BorderBottom(1).Padding(2).Text("Poşet Tipi / Ebat").SemiBold();
                        header.Cell().BorderBottom(1).Padding(2).AlignRight().Text("Kalınlık").SemiBold();
                        header.Cell().BorderBottom(1).Padding(2).AlignRight().Text("Miktar").SemiBold();
                    });

                    table.Cell().Padding(2).Text($"{order.BagType} / {order.Dimensions}");
                    table.Cell().Padding(2).AlignRight().Text($"{order.ThicknessMicron} Mikron");
                    table.Cell().Padding(2).AlignRight().Text($"{order.RequestedAmountKg} Kg");
                });

                column.Item().PaddingTop(25).AlignRight().Text($"Genel Toplam Tutar: {order.TotalPrice?.ToString("N2")} TL").FontSize(14).SemiBold();
            });
        }
    }
}
