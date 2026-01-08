export interface InvoiceData {
    concept?: string
    issueDate?: Date
    dueDate?: Date
    status?: 'pending' | 'paid' | 'cancelled'
    paymentMethod?: string
    notes?: string
    issuerId?: number
    clientId?: number
}