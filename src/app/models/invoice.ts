import { InvoiceItem } from "./invoice-item"
import { Contact } from "./contact"

export interface Invoice {
    id: number
    concept: string
    issueDate: Date
    dueDate?: Date
    subtotal: number
    taxes: number
    total: number
    status?: 'pending' | 'paid' | 'cancelled'
    paymentMethod?: string
    notes?: string
    items: InvoiceItem[]
    issuer: Contact
    client: Contact
}

export type UpdateInvoice = Partial<Omit<Invoice, 'id'>>


