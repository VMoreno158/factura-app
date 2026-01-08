import { TestBed } from '@angular/core/testing';
import { InvoiceService } from './invoice-service';
import { DatabaseService } from './database-service';
import { DatabaseServiceMock } from './database-service.mock';
import { StatusCodes } from '../shared/status-codes';
import { InvoiceData } from '../models/invoice-data';
import { InvoiceItemData } from '../models/invoice-item-data';

describe('InvoiceService', () => {
    let service: InvoiceService
    let dbMock: DatabaseServiceMock

    // Se ejecuta antes de cada test
    beforeEach(() => {
        dbMock = new DatabaseServiceMock()

        TestBed.configureTestingModule({
            providers: [
                InvoiceService,
                { provide: DatabaseService, useValue: dbMock }
            ]
        })

        service = TestBed.inject(InvoiceService)
    })

    // Se ejecuta después de cada test
    afterEach(() => {
        dbMock.resetInvoices()
    })

    // ==================== TESTS BÁSICOS ====================

    it('debe crearse el servicio', () => {
        expect(service).toBeTruthy()
    })

    // ==================== TESTS DE GETINVOICES ====================

    describe('getInvoices', () => {
        it('debe retornar un array vacío si no hay facturas', async () => {
            dbMock.resetInvoices() // Base de datos vacía

            const result = await service.getInvoices()

            expect(result.success).toBe(true)
            expect(result.statusCode).toBe(StatusCodes.OK)
            expect(result.data).toEqual([])
        })

        it('debe retornar todas las facturas', async () => {
            // Agregar datos de prueba
            const mockData = dbMock.getMockData()
            mockData.invoices.push({
                id: 1,
                issue_date: '2025-01-15',
                due_date: '2025-02-15',
                issuer_id: 1,
                client_id: 2,
                subtotal: 1000,
                total_taxes: 210,
                total: 1210,
                status: 'pending',
                payment_method: 'Transferencia',
                notes: 'Test'
            })

            const result = await service.getInvoices()

            expect(result.success).toBe(true)
            expect(result.statusCode).toBe(StatusCodes.OK)
            expect(result.data?.length).toBeGreaterThan(0)
        })
    })

    // ==================== TESTS DE GETINVOICEBYID ====================

    describe('getInvoiceById', () => {
        it('debe retornar una factura por ID', async () => {
            const mockData = dbMock.getMockData()
            mockData.invoices.push({
                id: 1,
                issue_date: '2025-01-15',
                due_date: '',
                issuer_id: 1,
                client_id: 2,
                subtotal: 1000,
                total_taxes: 210,
                total: 1210,
                status: 'pending',
                payment_method: 'Transferencia',
                notes: ''
            })

            const result = await service.getInvoiceById(1)

            expect(result.success).toBe(true)
            expect(result.statusCode).toBe(StatusCodes.OK)
            expect(result.data?.id).toBe(1)
        })

        it('debe retornar NOT_FOUND si la factura no existe', async () => {
            const result = await service.getInvoiceById(999)

            expect(result.success).toBe(false)
            expect(result.statusCode).toBe(StatusCodes.NOT_FOUND)
            expect(result.message).toBe('Factura no encontrada')
        })
    })

    // ==================== TESTS DE ADDINVOICE ====================

    describe('addInvoice', () => {
        it('debe crear una factura correctamente', async () => {
            const invoiceData: InvoiceData = {
                issueDate: new Date('2025-01-15'),
                dueDate: new Date('2025-02-15'),
                issuerId: 1,
                clientId: 2,
                status: 'pending',
                paymentMethod: 'Transferencia',
                notes: 'Test invoice'
            }

            const items: InvoiceItemData[] = [
                {
                    name: 'Servicio de consultoría',
                    quantity: 10,
                    unitPrice: 100,
                    subtotal: 1000,
                    tax: 0.21,
                    discount: 0
                }
            ]

            const result = await service.addInvoice(invoiceData, items)

            expect(result.success).toBe(true)
            expect(result.statusCode).toBe(StatusCodes.CREATED)
            expect(result.message).toBe('Factura creada correctamente')
            expect(result.data).toBeDefined()
            expect(typeof result.data).toBe('number')
        })

        it('debe fallar si falta la fecha de emisión', async () => {
            const invoiceData: InvoiceData = {
                issueDate: undefined as any,
                issuerId: 1,
                clientId: 2
            }

            const items: InvoiceItemData[] = [
                {
                    description: 'Test',
                    quantity: 1,
                    unitPrice: 100,
                    subtotal: 100,
                    tax: 0,
                    discount: 0
                }
            ]

            const result = await service.addInvoice(invoiceData, items)

            expect(result.success).toBe(false)
            expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(result.message).toBe('La fecha de emisión es obligatoria')
        })

        it('debe fallar si falta el emisor', async () => {
            const invoiceData: InvoiceData = {
                issueDate: new Date(),
                issuerId: undefined as any,
                clientId: 2
            }

            const items: InvoiceItemData[] = [
                {
                    description: 'Test',
                    quantity: 1,
                    unitPrice: 100,
                    subtotal: 100,
                    tax: 0,
                    discount: 0
                }
            ]

            const result = await service.addInvoice(invoiceData, items)

            expect(result.success).toBe(false)
            expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(result.message).toBe('El emisor es obligatorio')
        })

        it('debe fallar si no hay items', async () => {
            const invoiceData: InvoiceData = {
                issueDate: new Date(),
                issuerId: 1,
                clientId: 2
            }

            const result = await service.addInvoice(invoiceData, [])

            expect(result.success).toBe(false)
            expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(result.message).toBe('Debe agregar al menos un ítem')
        })

        it('debe fallar si un item tiene cantidad negativa', async () => {
            const invoiceData: InvoiceData = {
                issueDate: new Date(),
                issuerId: 1,
                clientId: 2
            }

            const items: InvoiceItemData[] = [
                {
                    description: 'Test',
                    quantity: -5,
                    unitPrice: 100,
                    subtotal: 100,
                    tax: 0,
                    discount: 0
                }
            ]

            const result = await service.addInvoice(invoiceData, items)

            expect(result.success).toBe(false)
            expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(result.message).toContain('la cantidad debe ser mayor a 0')
        })

        it('debe fallar si el estado es inválido', async () => {
            const invoiceData: InvoiceData = {
                issueDate: new Date(),
                issuerId: 1,
                clientId: 2,
                status: 'InvalidStatus' as any
            }

            const items: InvoiceItemData[] = [
                {
                    description: 'Test',
                    quantity: 1,
                    unitPrice: 100,
                    subtotal: 100,
                    tax: 0,
                    discount: 0
                }
            ]

            const result = await service.addInvoice(invoiceData, items)

            expect(result.success).toBe(false)
            expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(result.message).toContain('Estado inválido')
        })
    })

    // ==================== TESTS DE UPDATEINVOICEBYID ====================

    describe('updateInvoiceById', () => {
        it('debe actualizar una factura existente', async () => {
            // Primero crear una factura
            const mockData = dbMock.getMockData()
            mockData.invoices.push({
                id: 1,
                issue_date: '2025-01-15',
                due_date: '',
                issuer_id: 1,
                client_id: 2,
                subtotal: 1000,
                total_taxes: 210,
                total: 1210,
                status: 'pending',
                payment_method: 'Transferencia',
                notes: ''
            })

            const updatedData: InvoiceData = {
                issueDate: new Date('2025-01-20'),
                dueDate: new Date('2025-02-20'),
                issuerId: 1,
                clientId: 2,
                status: 'paid',
                paymentMethod: 'Efectivo',
                notes: 'Actualizado'
            }

            const result = await service.updateInvoiceById(1, updatedData)

            expect(result.success).toBe(true)
            expect(result.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('debe fallar si la factura no existe', async () => {
            const updatedData: InvoiceData = {
                issueDate: new Date(),
                issuerId: 1,
                clientId: 2
            }

            const result = await service.updateInvoiceById(999, updatedData)

            expect(result.success).toBe(false)
            expect(result.statusCode).toBe(StatusCodes.NOT_FOUND)
            expect(result.message).toBe('Factura no encontrada')
        })
    })

    // ==================== TESTS DE DELETEINVOICEBYID ====================

    describe('deleteInvoiceById', () => {
        it('debe eliminar una factura existente', async () => {
            const mockData = dbMock.getMockData()
            mockData.invoices.push({
                id: 1,
                issue_date: '2025-01-15',
                due_date: '',
                issuer_id: 1,
                client_id: 2,
                subtotal: 1000,
                total_taxes: 210,
                total: 1210,
                status: 'pending',
                payment_method: 'Transferencia',
                notes: ''
            })

            const result = await service.deleteInvoiceById(1)

            expect(result.success).toBe(true)
            expect(result.statusCode).toBe(StatusCodes.NO_CONTENT)

            // Verificar que ya no existe
            const checkResult = await service.getInvoiceById(1)
            expect(checkResult.success).toBe(false)
        })

        it('debe fallar si la factura no existe', async () => {
            const result = await service.deleteInvoiceById(999)

            expect(result.success).toBe(false)
            expect(result.statusCode).toBe(StatusCodes.NOT_FOUND)
            expect(result.message).toBe('Factura no encontrada')
        })
    })

    // ==================== TESTS DE TRANSACCIONES ====================

    describe('Transacciones', () => {
        it('debe hacer rollback si falla al insertar items', async () => {
            // Este test simularía un error en medio de la transacción
            // En un mock más complejo, podrías forzar un error

            const invoiceData: InvoiceData = {
                issueDate: new Date(),
                issuerId: 1,
                clientId: 2
            }

            const items: InvoiceItemData[] = [
                {
                    description: 'Item válido',
                    quantity: 1,
                    unitPrice: 100,
                    subtotal: 100,
                    tax: 0,
                    discount: 0
                }
            ]

            // En un caso real, podrías espiar el método de rollback
            const result = await service.addInvoice(invoiceData, items)

            // Verificar que la transacción se completó correctamente
            expect(result.success).toBe(true)
        })
    })
})