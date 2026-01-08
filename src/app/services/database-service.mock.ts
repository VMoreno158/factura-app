export class DatabaseServiceMock {
    private mockData!: {
        invoices: any[];
        invoice_items: any[];
        contacts: any[];
    }

    private nextInvoiceId!: number
    private nextItemId!: number
    private nextContactId!: number

    private transactionActive = false;
    private transactionData: { invoices: any[]; items: any[]} | null = null;

    constructor() {
        this.resetInvoices();
    }

    // ================== RESET / MOCK DATA ==================
    resetInvoices() {
        this.mockData = {
            invoices: [],
            invoice_items: [],
            contacts: [
                {
                    id: 1,
                    name: 'Emisor Test',
                    identification: 'B12345678',
                    address: 'Calle Test 1',
                    phone: '123456789',
                    email: 'emisor@test.com'
                },
                {
                    id: 2,
                    name: 'Cliente Test',
                    identification: 'A87654321',
                    address: 'Calle Test 2',
                    phone: '987654321',
                    email: 'cliente@test.com'
                }
            ]
        };
        this.nextInvoiceId = 1;
        this.nextItemId = 1;
        this.transactionActive = false;
        this.transactionData = null;
        this.nextContactId = 3
    }

    resetContacts() {
        this.mockData = {
            invoices: [],
            invoice_items: [],
            contacts: []
        };
        this.nextInvoiceId = 1;
        this.nextItemId = 1;
        this.transactionActive = false;
        this.transactionData = null;
    }

    getMockData() {
        return this.mockData;
    }

    // ================== CONNECTION SIMULADA ==================
    async getConnection() {
        return {
            query: this.mockQuery.bind(this),
            run: this.mockRun.bind(this),
            execute: this.mockExecute.bind(this)
        };
    }

    // ================== SIMULACIÓN SELECT ==================
    private async mockQuery(sql: string, params?: any[]) {
        if (sql.includes('SELECT') && sql.includes('invoices')) {
            // Filtrar por ID si params existe
            let invoices = [...this.mockData.invoices];
            if (params && params.length > 0) {
                const id = params[0];
                invoices = invoices.filter(i => i.id === id);
            }

            // Simular join con contacts (issuer y client)
            const rows = invoices.map(i => {
                const issuer = this.mockData.contacts.find(c => c.id === i.issuer_id)!;
                const client = this.mockData.contacts.find(c => c.id === i.client_id)!;

                return {
                    ...i,
                    issuer: issuer,
                    client: client
                };
            });

            return { values: rows };
        }

        if (sql.includes('SELECT') && sql.includes('invoice_items')) {
            const invoiceId = params?.[0];
            const items = this.mockData.invoice_items.filter(
                item => item.invoice_id === invoiceId
            );
            return { values: items };
        }

        if (sql.includes('SELECT') && sql.includes('contacts')) {
            let contacts = [...this.mockData.contacts]

            if (params && params.length > 0) {
                const id = params[0]
                contacts = contacts.filter(c => c.id === id)
            }

            return { values: contacts }
        }

        return { values: [] };
    }


    // ================== SIMULACIÓN INSERT / UPDATE / DELETE ==================
    private async mockRun(sql: string, params?: any[]) {
        // ---------------- INSERT FACTURA ----------------
        if (sql.includes('INSERT INTO invoices')) {
            const newInvoice = {
                id: this.nextInvoiceId++,
                issue_date: params![0],
                due_date: params![1] || '',
                issuer_id: params![2],
                client_id: params![3],
                status: params![4] || 'pending',
                payment_method: params![5] || '',
                notes: params![6] || '',
                subtotal: 0,
                total_taxes: 0,
                total: 0
            };

            if (!this.transactionActive) {
                this.mockData.invoices.push(newInvoice);
            } else {
                if (!this.transactionData) this.transactionData = { invoices: [], items: [] };
                this.transactionData.invoices.push(newInvoice);
            }

            return { changes: { lastId: newInvoice.id, changes: 1 } };
        }

        // ---------------- INSERT ITEM ----------------
        if (sql.includes('INSERT INTO invoice_items')) {
            const newItem = {
                id: this.nextItemId++,
                invoice_id: params![0],
                description: params![1],
                quantity: params![2],
                unit_price: params![3],
                subtotal: params![4],
                tax: params![5],
                discount: params![6]
            };

            if (!this.transactionActive) {
                this.mockData.invoice_items.push(newItem);
            } else {
                if (!this.transactionData) this.transactionData = { invoices: [], items: [] };
                this.transactionData.items.push(newItem);
            }

            return { changes: { lastId: newItem.id, changes: 1 } };
        }

        // INSERT CONTACT
        if (sql.includes('INSERT INTO contact')) {
            const newContact = {
                id: this.nextContactId++,
                name: params![0],
                identification: params![1],
                address: params![2],
                phone: params![3],
                email: params![4]
            }

            this.mockData.invoice_items.push(newContact)

            return { changes: { lastId: newContact.id, changes: 1 } };
        }

        // ---------------- UPDATE FACTURA ----------------
        if (sql.includes('UPDATE invoices')) {
            const id = params![params!.length - 1];
            const index = this.mockData.invoices.findIndex(i => i.id === id);
            if (index === -1) return { changes: 0 };

            this.mockData.invoices[index] = {
                ...this.mockData.invoices[index],
                issue_date: params![0],
                due_date: params![1] || '',
                issuer_id: params![2],
                client_id: params![3],
                status: params![4] || 'pending',
                payment_method: params![5] || '',
                notes: params![6] || ''
            };

            return { changes: 1 };
        }

        // ---------------- DELETE FACTURA ----------------
        if (sql.includes('DELETE FROM invoices')) {
            const id = params![0];
            const index = this.mockData.invoices.findIndex(i => i.id === id);
            if (index === -1) return { changes: 0 };

            this.mockData.invoices.splice(index, 1);
            this.mockData.invoice_items = this.mockData.invoice_items.filter(
                item => item.invoice_id !== id
            );

            return { changes: 1 };
        }

        return { changes: 0 };
    }

    // ================== SIMULACIÓN TRANSACCIONES ==================
    private async mockExecute(sql: string) {
        if (sql === 'BEGIN TRANSACTION') {
            this.transactionActive = true;
            this.transactionData = { invoices: [], items: [] };
            return;
        }

        if (sql === 'COMMIT') {
            if (this.transactionData) {
                this.mockData.invoices.push(...this.transactionData.invoices);
                this.mockData.invoice_items.push(...this.transactionData.items);
            }
            this.transactionActive = false;
            this.transactionData = null;
            return;
        }

        if (sql === 'ROLLBACK') {
            this.transactionActive = false;
            this.transactionData = null;
            return;
        }
    }
}

