import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2, Download } from "lucide-react";
import { useToast } from "./ToastProvider";
import { authFetch } from "../lib/authFetch";

interface ExportButtonsProps {
  excelUrl?: string; // e.g. "http://localhost:5257/api/Export/excel/customers"
  excelFilename?: string;
  pdfUrl?: string;
  pdfFilename?: string;
}

export function ExportButtons({ excelUrl, excelFilename = "export.xlsx", pdfUrl, pdfFilename = "export.pdf" }: ExportButtonsProps) {
  const [isExcelLoading, setIsExcelLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async (type: "excel" | "pdf") => {
    const url = type === "excel" ? excelUrl : pdfUrl;
    const filename = type === "excel" ? excelFilename : pdfFilename;
    const setLoading = type === "excel" ? setIsExcelLoading : setIsPdfLoading;

    if (!url) return;

    try {
      setLoading(true);
      const response = await authFetch(url);
      
      if (!response.ok) {
        throw new Error("Dışa aktarım başarısız oldu.");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        type: "success",
        title: "Başarılı",
        message: "Dosya başarıyla indirildi."
      });
    } catch (error: any) {
      toast({
        type: "error",
        title: "Hata",
        message: error.message || "Dışa aktarma işlemi sırasında bir hata oluştu."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {excelUrl && (
        <button
          onClick={() => handleExport("excel")}
          disabled={isExcelLoading}
          className="group relative flex items-center justify-center w-10 h-10 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all overflow-hidden"
          title="Excel Olarak İndir"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/10 to-emerald-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          {isExcelLoading ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} className="group-hover:scale-110 transition-transform" />}
        </button>
      )}
      
      {pdfUrl && (
        <button
          onClick={() => handleExport("pdf")}
          disabled={isPdfLoading}
          className="group relative flex items-center justify-center w-10 h-10 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)] hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all overflow-hidden"
          title="PDF Olarak İndir"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-rose-400/0 via-rose-400/10 to-rose-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          {isPdfLoading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} className="group-hover:scale-110 transition-transform" />}
        </button>
      )}
    </div>
  );
}
