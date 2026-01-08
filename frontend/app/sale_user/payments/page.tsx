"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api as saleApi } from "@/lib/sale-api"
import { Loader2, DollarSign, Eye } from "lucide-react"

export default function PaymentsPage(){
  const [loading, setLoading] = useState(true)
  const [unpaid, setUnpaid] = useState([])
  const [paid, setPaid] = useState([])
  const [selectedSale, setSelectedSale] = useState(null)
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState('cash')
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(()=>{
    const load = async ()=>{
      try{
        setLoading(true)
        const [u,p] = await Promise.all([
          saleApi.sales.getUnpaid(),
          saleApi.sales.getPaid(),
        ])
        setUnpaid(Array.isArray(u)?u:[])
        setPaid(Array.isArray(p)?p:[])
      }catch(e){
        console.error(e)
      }finally{setLoading(false)}
    }
    load()
  },[])

  const openRecord = (sale:any)=>{
    setSelectedSale(sale)
    setAmount(sale.outstanding || sale.grand_total || 0)
    setMethod('cash')
  }

  const submitPayment = async ()=>{
    if(!selectedSale) return
    try{
      const payload = { amount: Number(amount), payment_method: method, user_id: 1 }
      await saleApi.payments.createForSale(selectedSale.id, payload)
      // refresh lists
      const [u,p] = await Promise.all([saleApi.sales.getUnpaid(), saleApi.sales.getPaid()])
      setUnpaid(u)
      setPaid(p)
      setSelectedSale(null)
    }catch(err){
      console.error(err)
      alert(err?.message || 'Failed to record payment')
    }
  }

  const viewHistory = async (customerId:number)=>{
    try{
      setHistoryLoading(true)
      const h = await saleApi.payments.byCustomer(customerId)
      setHistory(Array.isArray(h)?h:[])
    }catch(e){
      console.error(e)
    }finally{setHistoryLoading(false)}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Manage payments, unpaid/paid lists and customer history</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Unpaid / Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Grand Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unpaid.map((s:any)=> (
                    <TableRow key={s.id}>
                      <TableCell>{s.invoice_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{s.customer?.name || 'Walk-in'}</span>
                          {s.customer?.id && (
                            <Button size="sm" variant="ghost" onClick={()=>viewHistory(s.customer.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{s.grand_total}</TableCell>
                      <TableCell>{s.paid_amount}</TableCell>
                      <TableCell>{s.outstanding}</TableCell>
                      <TableCell>
                        <Button onClick={()=>openRecord(s)} size="sm"><DollarSign className="h-4 w-4 mr-2"/> Record</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Grand Total</TableHead>
                  <TableHead>Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paid.map((s:any)=> (
                  <TableRow key={s.id}>
                    <TableCell>{s.invoice_number}</TableCell>
                    <TableCell>{s.customer?.name || 'Walk-in'}</TableCell>
                    <TableCell>{s.grand_total}</TableCell>
                    <TableCell>{s.paid_amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {selectedSale && (
        <Card>
          <CardHeader>
            <CardTitle>Record Payment for {selectedSale.invoice_number}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Input value={amount} onChange={(e)=>setAmount(e.target.value)} />
              <select className="input" value={method} onChange={(e)=>setMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank">Bank</option>
                <option value="ewallet">E-wallet</option>
              </select>
              <Button onClick={submitPayment}>Submit</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Customer Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? <div className="p-4"><Loader2 className="animate-spin"/></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h:any)=> (
                  <TableRow key={h.id}>
                    <TableCell>{h.sale?.invoice_number}</TableCell>
                    <TableCell>{h.amount}</TableCell>
                    <TableCell>{h.payment_method}</TableCell>
                    <TableCell>{new Date(h.paid_at || h.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
