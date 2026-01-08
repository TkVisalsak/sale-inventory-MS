"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api as saleApi } from "@/lib/sale-api";
import { useToast } from "@/hooks/use-toast";

interface SaleItemRow {
  id: number;
  product?: { id?: number; name?: string } | null;
  batch_id?: number | null;
  quantity: number;
  unit_price: number;
  discount?: number;
}

interface SaleRow {
  id: number;
  invoice_number: string;
  user?: { id?: number; name?: string } | null;
  customer?: { id?: number; name?: string } | null;
  order_status?: string;
  reservations?: Array<{ id?: number; status?: string }>
  note?: string | null;
  created_at?: string;
  items: SaleItemRow[];
}

export default function ViewSalePage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [sale, setSale] = useState<SaleRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const fetchSale = async () => {
      if (!id) {
        setError("Sale ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await saleApi.sales.getById(id);
        setSale(data as SaleRow);
      } catch (err: any) {
        console.error("Error loading sale:", err);
        setError(err.message || "Failed to load sale");
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id]);

  const formatDate = (dateString?: string) =>
    dateString ? new Date(dateString).toLocaleDateString() : "N/A";

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/sale_user/sale-orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-balance">View Sale</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/sale_user/sale-orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-balance">View Sale</h1>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error || "Sale not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const total = sale.items.reduce(
    (sum, item) =>
      sum + (item.quantity * item.unit_price - (item.discount || 0)),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sale_user/sale-orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-balance">
            Sale {sale.invoice_number}
          </h1>
          <p className="text-muted-foreground">
            Created by {sale.user?.name || `User #${sale.user?.id ?? "-"}`} on{" "}
            {formatDate(sale.created_at)}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {sale.order_status === "draft" && (
            <>
              <Link href={`/sale_user/sale-orders/edit?id=${sale.id}`}>
                <Button variant="outline">Edit</Button>
              </Link>
              <Button
                variant="secondary"
                onClick={async () => {
                  const ok =
                    typeof window !== "undefined"
                      ? window.confirm(
                          "Submit this order? Once submitted it will be locked for editing."
                        )
                      : true;
                  if (!ok) return;
                  const t = toast.toast({ title: "Submitting order..." });
                  try {
                    const res = await saleApi.sales.update(String(sale.id), {
                      order_status: "submitted",
                    });
                    toast.update(t.id, { title: "Order submitted" });
                    setSale({
                      ...(sale as SaleRow),
                      order_status: "submitted",
                    });
                    router.push("/sale_user/sale-orders");
                  } catch (err: any) {
                    toast.update(t.id, {
                      title: "Submit failed",
                      description: err?.message || "Failed to submit",
                    });
                  }
                }}
              >
                Submit
              </Button>
            </>
          )}
          {sale.order_status === "submitted" && (
            <Button
              variant="outline"
              onClick={async () => {
                const t = useToast().toast({ title: "Reopening order..." });
                try {
                  await saleApi.sales.update(String(sale.id), {
                    order_status: "draft",
                  });
                  useToast().update(t.id, { title: "Order reopened" });
                  router.push(`/sale_user/sale-orders/edit?id=${sale.id}`);
                } catch (err: any) {
                  useToast().update(t.id, {
                    title: "Reopen failed",
                    description: err?.message || "Failed to reopen",
                  });
                }
              }}
            >
              Reopen
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={async () => {
              const toast = useToast().toast({
                title: "Generating invoice...",
                description: "Please wait",
              });
              try {
                // Request server to fulfill (deduct stock) immediately
                const res = await saleApi.sales.generateInvoice(
                  String(sale.id),
                  { fulfill: true }
                );
                useToast().update(toast.id, {
                  title: "Invoice generated",
                  description: "Stock allocated",
                });
                console.log("invoice", res);
                // refresh sale so UI shows updated reservations/status
                try {
                  const refreshed = await saleApi.sales.getById(
                    String(sale.id)
                  );
                  setSale(refreshed as SaleRow);
                } catch (err) {
                  console.warn(
                    "Failed to refresh sale after generateInvoice",
                    err
                  );
                }
              } catch (err: any) {
                useToast().update(toast.id, {
                  title: "Invoice failed",
                  description: err?.message || "Failed to generate invoice",
                });
              }
            }}
          >
            Generate Invoice
          </Button>
          {/* Delivered button: only show when there are reservations present */}
          {sale.reservations && sale.reservations.length > 0 && sale.order_status !== "delivered" && (
            <Button
              variant="secondary"
              onClick={async () => {
                const ok = typeof window !== "undefined" ? window.confirm("Mark this sale as delivered?") : true
                if (!ok) return
                const t = toast.toast({ title: "Marking delivered..." })
                try {
                  await saleApi.sales.update(String(sale.id), { order_status: "delivered" })
                  toast.update(t.id, { title: "Sale marked delivered" })
                  setSale({ ...(sale as SaleRow), order_status: "delivered" })
                  router.refresh()
                } catch (err: any) {
                  toast.update(t.id, { title: "Deliver failed", description: err?.message || "Failed to mark delivered" })
                }
              }}
            >
              Delivered
            </Button>
          )}

          <Button
            variant="outline"
            onClick={async () => {
              const t = toast.toast({ title: "Generating invoice (HTML)...", description: "Please wait" })
              try {
                // Request server to fulfill (deduct stock) then download HTML
                const res = await saleApi.sales.generateInvoice(String(sale.id), { fulfill: true })
                const invoice = res?.invoice || res
                const html = (await import("@/lib/invoice-html")).buildInvoiceHtml(invoice)
                ;(await import("@/lib/invoice-html")).downloadHtmlFile(
                  `${invoice.invoice_number || `invoice-${sale.id}`}.html`,
                  html
                )
                toast.update(t.id, { title: "Download started", description: "HTML invoice downloaded" })
                // refresh sale after fulfillment
                try {
                  const refreshed = await saleApi.sales.getById(String(sale.id))
                  setSale(refreshed as SaleRow)
                } catch (err) {
                  console.warn("Failed to refresh sale after downloading invoice", err)
                }
              } catch (err: any) {
                toast.update(t.id, { title: "Invoice failed", description: err?.message || "Failed to generate invoice" })
              }
            }}
          >
            Download HTML
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Sale Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Invoice
                  </p>
                  <p className="font-mono text-sm">{sale.invoice_number}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Order Status
                  </p>
                  <Badge>{sale.order_status}</Badge>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Customer
                  </p>
                  <p className="font-medium">
                    {sale.customer?.name || "Walk-in"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Created At
                  </p>
                  <p>{formatDate(sale.created_at)}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Note
                </p>
                <p>{sale.note || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              {sale.items.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">
                  No items found for this sale.
                </p>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.items.map((item) => {
                        const subtotal =
                          item.quantity * item.unit_price -
                          (item.discount || 0);
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {item.product?.name ||
                                    `Product #${item.product?.id ?? "-"}`}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{item.batch_id ?? "-"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.quantity}</Badge>
                            </TableCell>
                            <TableCell>
                              {item.unit_price > 0
                                ? formatCurrency(item.unit_price)
                                : "-"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {subtotal > 0 ? formatCurrency(subtotal) : "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end pt-4 border-t">
                    <div className="text-lg font-semibold">
                      Total: {formatCurrency(total)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Items
                </span>
                <span className="font-medium">{sale.items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Grand Total
                </span>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
