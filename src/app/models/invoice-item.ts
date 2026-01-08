export interface InvoiceItem {
    id: number
    invoiceId: number
    name: string
    description?: string
    quantity: number
    unitPrice: number
    subtotal: number
    tax: number
    discount: number
}
