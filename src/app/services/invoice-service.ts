import { inject, Injectable } from '@angular/core';
import { DatabaseService } from './database-service';
import { ApiResponse } from '../models/api-response';
import { Invoice } from '../models/invoice';
import { StatusCodes } from '../shared/status-codes';
import { environment } from 'src/environments/environment.prod';
import { InvoiceItem } from '../models/invoice-item';
import { InvoiceData } from '../models/invoice-data';
import { InvoiceItemData } from '../models/invoice-item-data';
import { ActionMethods } from '../shared/action-methods';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  dbService = inject(DatabaseService)

  async getInvoices(): Promise<ApiResponse<Invoice[]>> {
    try {
      const db = await this.dbService.getConnection()

      const result = await db.query(`
        SELECT 
          i.*,
          issuer.*,
          client.*
        FROM invoices i
        LEFT JOIN contacts issuer ON i.issuer_id = issuer.id
        LEFT JOIN contacts client ON i.client_id = client.id
        ORDER BY i.issue_date DESC
      `)

      const invoices = this.mapInvoices(result.values)

      return {
        success: true,
        statusCode: StatusCodes.OK,
        data: invoices
      }

    } catch (error) {
      return this.manageSQLExceptions(error)
    }
  }

  async getInvoiceById(id: number): Promise<ApiResponse<Invoice>> {
    try {
      const db = await this.dbService.getConnection()

      const result = await db.query(`
        SELECT 
          i.*,
          issuer.*,
          client.*
        FROM invoices i
        LEFT JOIN contacts issuer ON i.issuer_id = issuer.id
        LEFT JOIN contacts client ON i.client_id = client.id
        WHERE i.id = ?
      `, [id])

      if ((result.values?.length ?? 0) < 1) return {
        success: false,
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Factura no encontrada'
      }

      const invoice = this.mapInvoiceRow(result.values![0])

      return {
        success: true,
        statusCode: StatusCodes.OK,
        data: invoice
      }

    } catch (error) {
      return this.manageSQLExceptions(error)
    }
  }

  async addInvoice(invoice: InvoiceData, invoiceItems: InvoiceItemData[]): Promise<ApiResponse<number>> {
    const invoiceError = this.validateInvoice(ActionMethods.POST, invoice)
    if (invoiceError) return { success: false, statusCode: StatusCodes.BAD_REQUEST, message: invoiceError }
    const itemsError = this.validateInvoiceItems(invoiceItems)
    if (itemsError) return { success: false, statusCode: StatusCodes.BAD_REQUEST, message: itemsError }

    try {
      const db = await this.dbService.getConnection()

      await db.execute('BEGIN TRANSACTION')

      const result = await db.run(`
        INSERT INTO invoices (
          issue_date, due_date, issuer_id, client_id status, payment_method, notes
        ) 
        VALUES ( ?, ?, ?, ?, ?, ?, ?)
      `, [
        invoice.issueDate!.toISOString(),
        invoice.dueDate?.toISOString() || '',
        invoice.issuerId,
        invoice.clientId,
        invoice.status || 'pending',
        invoice.paymentMethod,
        invoice.notes || ''
      ])

      const invoiceId = result.changes?.lastId

      for (const item of invoiceItems) {
        await db.run(`
          INSERT INTO invoice_items (
            invoice_id, description, quantity, unit_price, subtotal, tax, discount
          ) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          invoiceId,
          item.description,
          item.quantity,
          item.unitPrice,
          item.subtotal,
          item.tax || 0,
          item.discount || 0
        ])
      }

      await db.run('COMMIT')

      return {
        success: true,
        statusCode: StatusCodes.CREATED,
        message: 'Factura creada correctamente', 
        data: invoiceId
      }

    } catch (error) {
      try {
        const db = await this.dbService.getConnection()
        await db.execute('ROLLBACK')
      } catch (rollbackErr) {
        if (!environment.production) console.error('Error en el rollback al crear la factura:', rollbackErr)
      }

      return this.manageSQLExceptions(error)
    }
  }

  async updateInvoiceById(id: number, invoice: InvoiceData): Promise<ApiResponse> {
    const invoiceError = this.validateInvoice(ActionMethods.PUT, invoice)
    if (invoiceError) return { success: false, statusCode: StatusCodes.BAD_REQUEST, message: invoiceError }

    try {
      const db = await this.dbService.getConnection()

      const result = await db.run(`
        UPDATE invoices
        SET
            issue_date = ?,
            due_date = ?,
            issuer_id = ?,
            client_id = ?,
            status = ?,
            payment_method = ?,
            notes = ?
        WHERE
            id = ?
      `, [
        invoice.issueDate?.toISOString(),
        invoice.dueDate?.toISOString(),
        invoice.issuerId,
        invoice.clientId,
        invoice.status,
        invoice.paymentMethod,
        invoice.notes,
        id
      ]
      )

      if (result.changes?.changes === 0) return {
        success: false,
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Factura no encontrada'
      }

      return {
        success: true,
        statusCode: StatusCodes.NO_CONTENT
      }

    } catch (error) {
      return this.manageSQLExceptions(error)
    }
  }

  async deleteInvoiceById(id: number): Promise<ApiResponse> {
    try {
      const db = await this.dbService.getConnection()

      const result = await db.run(`
        DELETE FROM invoices
        WHERE id = ?
        `, [
        id
      ]
      )

      if ((result.changes ?? 0) === 0) return {
        success: false,
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Factura no encontrada'
      }

      return {
        success: true,
        statusCode: StatusCodes.NO_CONTENT
      } 


    } catch (error) {
      return this.manageSQLExceptions(error)
    }
  }

  // Funciones internas

  private mapInvoiceRow(row: any): Invoice {
    return {
      id: row.id,
      concept: row.concept,
      issueDate: new Date(row.issue_date),
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      issuer: row.issuer,
      client: row.client,
      subtotal: row.subtotal,
      taxes: row.total_taxes,
      total: row.total,
      status: row.status,
      paymentMethod: row.payment_method,
      notes: row.notes,
      items: []
    }
  }

  private mapInvoices(rows: any[] | undefined): Invoice[] {
    if (!rows || rows.length < 1) return []
    return rows.map(row => this.mapInvoiceRow(row))
  }

  private validateInvoice(action: 'POST' | 'PUT', data: InvoiceData): string | null {
    if (data.issueDate && !(data.issueDate instanceof Date) || data.dueDate && !(data.dueDate instanceof Date)) return 'Formato de fecha inválido'
    const validStatuses = ['pending', 'paid', 'cancelled']
    if (data.status && !validStatuses.includes(data.status)) return 'Estado inválido. Debe ser: pending, paid o cancelled'

    if (action === 'POST') {
      
      if (!data.issueDate) return 'La fecha de emisión es obligatoria'
      if (!data.issuerId) return 'El emisor es obligatorio'
      if (!data.clientId) return 'El cliente es obligatorio'
    }

    return null
  }

  private validateInvoiceItems(items: InvoiceItemData[]): string | null {
    if (!items || items.length === 0) return 'Debe agregar al menos un ítem'

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.name!.trim()) return `Ítem ${i + 1}: el nombre es obligatorio`
      if (item.quantity! <= 0) return `Ítem ${i + 1}: la cantidad debe ser mayor a 0`
      if (item.unitPrice! < 0) return `Ítem ${i + 1}: el precio no puede ser negativo`
      if (item.tax! < 0 || item.tax! > 1) return `Ítem ${i + 1}: el impuesto tiene que tener un valor entre 0 y 1`
      if (item.discount! < 0 || item.discount! > 1) return `Ítem ${i + 1}: el descuento tiene que tener un valor entre 0 y 1`
    }
    return null
  }

  private manageSQLExceptions(error: any) {
    if (!environment.production) console.error('Error:', error)

    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      return {
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'El emisor o cliente especificado no existe'
      }
    }
    if (error.message?.includes('CHECK constraint failed')) {
      return {
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Estado inválido. Debe ser: pending, paid o cancelled'
      }
    }

    return {
      success: false,
      statusCode: StatusCodes.INTERNAL_ERROR
    }
  }
}