import { inject, Injectable } from '@angular/core';
import { DatabaseService } from './database-service';
import { ApiResponse } from '../models/api-response';
import { Contact } from '../models/contact';
import { StatusCodes } from '../shared/status-codes';
import { environment } from 'src/environments/environment.prod';
import { ContactData } from '../models/contact-data';
import { ActionMethods } from '../shared/action-methods';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  dbService = inject(DatabaseService)

  async getContacts(): Promise<ApiResponse<Contact[]>> {
    try {
      const db = await this.dbService.getConnection()

      const result = await db.query(`
        SELECT *
        FROM contacts
        `)

      return {
        success: true,
        statusCode: StatusCodes.OK,
        data: result.values
      }

    } catch (error) {
      return this.manageSQLExceptions(error)
    }
  }

  async getContactById(id: number): Promise<ApiResponse<Contact>> {
    try {
      const db = await this.dbService.getConnection()

      const result = await db.query(`
        SELECT *
        FROM contacts
        WHERE id = ?
      `, [id])

      if (result.values?.length === 0) return {
        success: false,
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Contacto no encontrado'
      }

      return {
        success: true,
        statusCode: StatusCodes.OK,
        data: result.values![0]
      }

    } catch (error) {
      return this.manageSQLExceptions(error)
    }
  }

  async addContact(contact: ContactData): Promise<ApiResponse<Number>> {
    const contactError = this.validateContact(ActionMethods.POST, contact)
    if (contactError) return {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: contactError
    }
    try {
      const db = await this.dbService.getConnection()

      const result = await db.run(`
        INSERT INTO contacts (
        name, identification, adress, phone, email)
        VALUES (?, ?, ?, ?, ?)  
      `, [
        contact.name,
        contact.identification,
        contact.address,
        contact.phone,
        contact.email
      ])

      return {
        success: true,
        statusCode: StatusCodes.CREATED,
        message: 'Contacto creado correctamente',
        data: result.changes?.lastId
      }

    } catch (error) {
      return this.manageSQLExceptions(error)
    }
  }

  async updateContactById(id: string, contact: ContactData): Promise<ApiResponse> {
    try {
      const db = await this.dbService.getConnection()

      const result = await db.run(`
        UPDATE contacts 
        SET
          name = ?,
          identification = ?,
          address = ?,
          phone = ?,
          email = ?
        WHERE 
          id = ?
        `, [
          contact.name, 
          contact.identification, 
          contact.address, 
          contact.phone, 
          contact.email, 
          id
        ])

      console.log(result)

      if (result.changes?.changes === 0) return {
        success: false,
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Contacto no encontrado'
      }

      return {
        success: true,
        statusCode: StatusCodes.OK,
      }
    } catch (error) {
      return this.manageSQLExceptions(error)
    }
  }

  // Funciones internas

  private validateContact(action: 'POST' | 'PUT', data: ContactData): string | null {
    if (data.phone?.length != 9) return 'Formato de teléfono inválido'
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (data.email && !regex.test(data.email)) return 'Formato de email inválido'

    if (action === 'POST') {
      if (!data.name) return 'El nombre es obligatorio'
    }
    return null
  }

  private manageSQLExceptions(error: any) {
    if (!environment.production) console.error('Error:', error)

    return {
      success: false,
      statusCode: StatusCodes.INTERNAL_ERROR
    }
  }
}
