import { TestBed } from '@angular/core/testing';

import { ContactService } from './contact-service';
import { DatabaseServiceMock } from './database-service.mock';
import { DatabaseService } from './database-service';
import { StatusCodes } from '../shared/status-codes';

describe('ContactService', () => {
  let service: ContactService
  let dbMock: DatabaseServiceMock

  beforeEach(() => {
    dbMock = new DatabaseServiceMock()

    TestBed.configureTestingModule({
      providers: [
        ContactService,
        { provide: DatabaseService, useValue: dbMock }
      ]
    })

    service = TestBed.inject(ContactService)
  })

  afterEach(() => {
    dbMock.resetContacts()
  })

  it('ContactService creado correctamente', () => {
    expect(service).toBeTruthy()
  })

  describe('getContacts', () => {
    it('Devuelve --> Success: true, StatusCode: OK y array vacío de contactos', async () => {
      dbMock.resetContacts()

      const results = await service.getContacts()

      expect(results.success).toBe(true)
      expect(results.statusCode).toBe(StatusCodes.OK)
      expect(results.data).toEqual([])
    })

    it('Devuelve --> Success: true, StatusCode: OK y array de contactos', async () => {
      const results = await service.getContacts()

      expect(results.success).toBe(true)
      expect(results.statusCode).toBe(StatusCodes.OK)
      expect(results.data?.length).toBeGreaterThan(0)
    })
  })

  describe('getContactById', () => {
    it('Devuelve --> Success: false y StatusCode: NOT_FOUND', async () => {
      const result = await service.getContactById(200)

      expect(result.success).toBe(false)
      expect(result.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('Devuelve --> Success: true, StatusCode: OK y contacto con id = 1', async () => {
      const result = await service.getContactById(1)

      expect(result.success).toBe(true)
      expect(result.statusCode).toBe(StatusCodes.OK)
      expect(result.data?.id).toEqual(1)
    })
  })

  describe('addContact', () => {
    it('Añade el contacto y devuelve --> Success: true, StatusCode: CREATED y el contacto con id = 3', async () => {
      const newContact = {
        name: 'Juan Perez',
        identification: '12345678A',
        address: 'Calle Test 1',
        phone: '123456789',
        email: 'emisor@test.com'
      }

      const result = await service.addContact(newContact)

      expect(result.success).toBe(true)
      expect(result.statusCode).toBe(StatusCodes.CREATED)
      expect(result.data).toEqual(3)
    })
  })
})

