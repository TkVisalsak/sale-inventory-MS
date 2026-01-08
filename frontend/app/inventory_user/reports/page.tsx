"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  Calendar,
  TrendingUp,
  Loader2,
  Plus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { api as saleApi } from "@/lib/sale-api";
import { apiRequest } from "@/lib/api";
import {
  buildInvoiceHtml,
  buildInventoryHtml,
  buildSalesSummaryHtml,
  buildCustomerReportHtml,
  buildFinancialStatementHtml,
  buildCustomReportHtml,
  downloadHtmlFile,
} from "@/lib/invoice-html";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("all");
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [newReportType, setNewReportType] = useState("");
  const [newReportName, setNewReportName] = useState("");
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [sales, setSales] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [generatedReports, setGeneratedReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Build report list from fetched data (generated reports show first)
  const reports = [
    ...generatedReports,
    // Sales reports (one per recent sale)
    ...sales.slice(0, 6).map((s: any) => ({
      id: `sale-${s.id}`,
      name: `Sale ${s.invoice_number || s.id}`,
      type: "Sales",
      date: s.sale_date || s.created_at || "-",
      status: s.order_status === "reserved" ? "completed" : "processing",
      size: "-",
      saleObj: s,
    })),
    // Inventory valuation summary
    {
      id: "inventory-valuation",
      name: "Inventory Valuation",
      type: "Inventory",
      date: new Date().toISOString().split("T")[0],
      status: batches.length ? "completed" : "processing",
      size: "-",
    },
  ];

  const quickReports = [
    {
      title: "Sales Summary",
      description: "Daily, weekly, and monthly sales overview",
      icon: TrendingUp,
      type: "Sales",
    },
    {
      title: "Inventory Status",
      description: "Current stock levels and valuations",
      icon: FileText,
      type: "Inventory",
    },
    {
      title: "Customer Report",
      description: "Customer purchase history and trends",
      icon: FileText,
      type: "Customers",
    },
    {
      title: "Financial Statement",
      description: "Revenue, expenses, and profit analysis",
      icon: FileText,
      type: "Financial",
    },
  ];

  const filteredReports =
    reportType === "all"
      ? reports
      : reports.filter((r) => r.type === reportType);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const s = await saleApi.sales.getAll();
        const b = await apiRequest("/batches");
        if (!mounted) return;
        setSales(Array.isArray(s) ? s : []);
        setBatches(Array.isArray(b) ? b : []);
      } catch (err) {
        console.error("Reports fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  function getSaleAmountLocal(s: any) {
    return (
      (s && (s.grand_total ?? s.total ?? s.total_amount ?? s.amount ?? 0)) || 0
    );
  }

  function escapeHtmlLocal(str: any) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function handleDownloadSale(saleObj: any) {
    try {
      const res = await saleApi.sales.generateInvoice(saleObj.id, {
        fulfill: true,
      });
      const invoice = res?.invoice || res;
      const blob = new Blob([JSON.stringify(invoice, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoice_number || `sale-${saleObj.id}`}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download invoice failed", err);
      alert("Failed to download report. Please try again.");
    }
  }

  async function handleDownloadSaleHtml(saleObj: any) {
    try {
      const res = await saleApi.sales.generateInvoice(saleObj.id, {
        fulfill: true,
      });
      const invoice = res?.invoice || res;
      const html = buildInvoiceHtml(invoice);
      downloadHtmlFile(
        `${invoice.invoice_number || `sale-${saleObj.id}`}.html`,
        html
      );
    } catch (err) {
      console.error("Download invoice HTML failed", err);
      alert("Failed to download HTML report. Please try again.");
    }
  }

  async function handleDownloadReport(report: any) {
    try {
      if (report.saleObj) {
        await handleDownloadSale(report.saleObj);
      } else if (report.html) {
        // Download the report's HTML (printable)
        downloadHtmlFile(
          `${report.name.replace(/\s+/g, "-")}-${report.date}.html`,
          report.html
        );
      } else {
        // Generate and download other report types
        if (report.id === "inventory-valuation") {
          const html = buildInventoryHtml({
            batches,
            generatedAt: report.date,
          });
          downloadHtmlFile(
            `${report.name.replace(/\s+/g, "-")}-${report.date}.html`,
            html
          );
        } else if (report.data) {
          const blob = new Blob([JSON.stringify(report.data, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${report.name.replace(
            /\s+/g,
            "-"
          )}-$\{report.date}.json`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        } else {
          const reportData = {
            type: report.type,
            name: report.name,
            date: report.date,
          };
          const blob = new Blob([JSON.stringify(reportData, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${report.name.replace(
            /\s+/g,
            "-"
          )}-$\{report.date}.json`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }
      }
    } catch (err) {
      console.error("Download report failed", err);
      alert("Failed to download report. Please try again.");
    }
  }

  function handleViewReport(report: any) {
    if (!report || !report.html) {
      alert("No printable view available for this report.");
      return;
    }
    const w = window.open();
    if (!w) {
      alert("Popup blocked. Please allow popups or use Download.");
      return;
    }
    w.document.open();
    w.document.write(report.html);
    w.document.close();
    w.focus();
  }

  async function handleGenerateQuickReport(reportType: string) {
    try {
      setGeneratingReport(true);
      setGeneratingType(reportType);
      setGenerateError(null);

      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const date = new Date().toISOString().split("T")[0];

      // Build a small payload for the generated report
      let data: any = { generatedAt: date };
      if (reportType === "Sales") {
        const totalSales = sales.reduce(
          (acc, s) => acc + getSaleAmountLocal(s),
          0
        );
        data = {
          generatedAt: date,
          summary: { totalSales, count: sales.length },
          sales: sales.slice(0, 50),
        };
      } else if (reportType === "Inventory") {
        data = { generatedAt: date, batches };
      }

      // Create a new report entry (we'll attach html/data and add to state after building it)
      const newReport: any = {
        id: `generated-${Date.now()}`,
        name: `${reportType} Report - ${new Date().toLocaleDateString()}`,
        type: reportType,
        date,
        status: "completed",
        size: "-",
        data,
      };

      // Build HTML and download it for a printable report
      let html: string | null = null;
      if (reportType === "Sales") {
        html = buildSalesSummaryHtml({ sales, generatedAt: date });
      } else if (reportType === "Inventory") {
        html = buildInventoryHtml({ batches, generatedAt: date });
      } else if (reportType === "Customers") {
        html = buildCustomerReportHtml({ sales, generatedAt: date });
      } else if (reportType === "Financial") {
        const revenue = sales.reduce(
          (acc, s) => acc + getSaleAmountLocal(s),
          0
        );
        html = buildFinancialStatementHtml({
          financial: { revenue, expenses: 0 },
          generatedAt: date,
        });
      }

      if (html) {
        // attach html to report so it can be viewed/downloaded later
        newReport.html = html;
        setGeneratedReports((prev) => [newReport, ...prev]);
        downloadHtmlFile(
          `${newReport.name.replace(/\s+/g, "-")}-${newReport.date}.html`,
          html
        );
      } else {
        // fallback to json download
        await handleDownloadReport(newReport);
      }

      alert(`${reportType} report generated successfully!`);
    } catch (err: any) {
      console.error("Generate report failed", err);
      setGenerateError(err.message || "Failed to generate report");
    } finally {
      setGeneratingReport(false);
      setGeneratingType(null);
    }
  }

  async function handleGenerateNewReport() {
    if (!newReportType || !newReportName) {
      setGenerateError("Please fill in all fields");
      return;
    }

    try {
      setGeneratingReport(true);
      setGenerateError(null);

      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const date = new Date().toISOString().split("T")[0];
      const content = `<p>This is a custom report created by the user.</p><p>Type: ${escapeHtmlLocal(
        newReportType
      )}</p>`;

      const html = buildCustomReportHtml({
        title: newReportName,
        type: newReportType,
        content,
        generatedAt: date,
      });

      const newReport = {
        id: `generated-${Date.now()}`,
        name: newReportName,
        type: newReportType,
        date,
        status: "completed",
        size: "-",
        html,
      };

      setGeneratedReports((prev) => [newReport, ...prev]);
      downloadHtmlFile(
        `${newReport.name.replace(/\s+/g, "-")}-${newReport.date}.html`,
        html
      );

      alert(`Report "${newReportName}" generated successfully!`);
      setGenerateDialogOpen(false);
      setNewReportType("");
      setNewReportName("");
    } catch (err: any) {
      console.error("Generate report failed", err);
      setGenerateError(err.message || "Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Reports</h1>
          <p className="text-muted-foreground">
            Generate and download business reports
          </p>
        </div>
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate New Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
              <DialogDescription>
                Create a custom report with specific parameters
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {generateError && (
                <Alert variant="destructive">
                  <AlertDescription>{generateError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="report-name">Report Name</Label>
                <Input
                  id="report-name"
                  placeholder="Enter report name"
                  value={newReportName}
                  onChange={(e) => setNewReportName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={newReportType} onValueChange={setNewReportType}>
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Inventory">Inventory</SelectItem>
                    <SelectItem value="Customers">Customers</SelectItem>
                    <SelectItem value="Financial">Financial</SelectItem>
                    <SelectItem value="Suppliers">Suppliers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setGenerateDialogOpen(false)}
                disabled={generatingReport}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateNewReport}
                disabled={generatingReport}
              >
                {generatingReport ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Reports */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Reports</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickReports.map((report) => (
            <Card
              key={report.title}
              className="cursor-pointer transition-colors hover:bg-accent/50"
            >
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <report.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="mt-4 space-y-1">
                  <p className="font-medium">{report.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {report.description}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-8 px-2"
                    onClick={() => handleGenerateQuickReport(report.type)}
                    disabled={
                      generatingReport && generatingType !== report.type
                    }
                  >
                    {generatingReport && generatingType === report.type ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Reports</CardTitle>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Inventory">Inventory</SelectItem>
                <SelectItem value="Customers">Customers</SelectItem>
                <SelectItem value="Financial">Financial</SelectItem>
                <SelectItem value="Suppliers">Suppliers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date Generated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{report.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{report.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {report.date}
                    </div>
                  </TableCell>
                  <TableCell>
                    {report.status === "completed" ? (
                      <Badge variant="secondary">Completed</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-yellow-500 text-yellow-500"
                      >
                        Processing
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {report.size}
                  </TableCell>
                  <TableCell className="text-right">
                    {report.status === "completed" && (
                      <div className="flex justify-end gap-2">
                        {"saleObj" in report && report.saleObj ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDownloadSale((report as any).saleObj)
                              }
                            >
                              <Download className="mr-2 h-4 w-4" />
                              JSON
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDownloadSaleHtml((report as any).saleObj)
                              }
                            >
                              HTML
                            </Button>
                          </>
                        ) : report.html ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReport(report)}
                            >
                              View/Print
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadReport(report)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadReport(report)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                name: "Weekly Sales Summary",
                frequency: "Every Monday at 9:00 AM",
                nextRun: "2024-02-05",
              },
              {
                name: "Monthly Inventory Report",
                frequency: "1st of every month",
                nextRun: "2024-02-01",
              },
              {
                name: "Quarterly Financial Report",
                frequency: "Every 3 months",
                nextRun: "2024-04-01",
              },
            ].map((schedule, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="space-y-1">
                  <p className="font-medium">{schedule.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {schedule.frequency}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Next Run</p>
                  <p className="text-sm text-muted-foreground">
                    {schedule.nextRun}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
