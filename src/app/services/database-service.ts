import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private sqlite!: SQLiteConnection
  private db: SQLiteDBConnection | null = null
  private DB_NAME = 'facturapp.db'
  private isInitialized = false

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite)
  }

  async initializeDatabase(): Promise<void> {
    if (this.isInitialized) {
      if (!environment.production) console.log('Base de datos ya inicializada')
      return
    }

    try {
      this.db = await this.sqlite.createConnection(
        this.DB_NAME,
        false,
        'no-encryption',
        1,
        false
      )

      await this.db.open()
      await this.createTables()
      this.isInitialized = true
      if (!environment.production) console.log('Base de datos inicializada correctamente')

    } catch (error) {
      if (!environment.production) console.error('Error al iniciar la base de datos:', error)
      throw error
    }
  }

  private async createTables() {
    const sql = `
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        identification TEXT NOT NULL UNIQUE,
        address TEXT,
        phone TEXT,
        email TEXT
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        concept TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        due_date TEXT,
        issuer_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        subtotal REAL NOT NULL DEFAULT 0,
        total_taxes REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT NOT NULL DEFAULT 'bank transfer',
        notes TEXT,
        FOREIGN KEY (issuer_id) REFERENCES contacts(id) ON DELETE RESTRICT,
        FOREIGN KEY (client_id) REFERENCES contacts(id) ON DELETE RESTRICT,
        CHECK (status IN ('pending','paid','cancelled')),
        CHECK (payment_method IN ('bank transfer','cash'))
      );

      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        tax REAL NOT NULL DEFAULT 0,
        discount REAL NOT NULL DEFAULT 0,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_invoices_issuer ON invoices(issuer_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
      CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
      CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
    `
    await this.db?.execute(sql)
  }

  async getConnection(): Promise<SQLiteDBConnection> {
    if (!this.isInitialized) await this.initializeDatabase()
    return this.db!
  }

  async closeDatabase(): Promise<void> {
    try {
      if (this.db) {
        await this.sqlite.closeConnection(this.DB_NAME, false)
        this.db = null
        this.isInitialized = false
        if (!environment.production) console.log('Base de datos cerrada correctamente')
      }
    } catch (error) {
      if (!environment.production) console.error('Error al cerrar la base de datos:', error)
      throw error
    }
  }

  // Insertar datos de prueba
  async seedDatabase(): Promise<void> {
  if (!this.db) await this.initializeDatabase();

  await this.db?.run(`
    INSERT OR IGNORE INTO contacts (id, name, identification, address, phone, email)
    VALUES
    (1, 'Empresa A', '12345678A', 'Calle Falsa 123', '600123456', 'a@example.com'),
    (2, 'Cliente B', '87654321B', 'Avenida Siempre Viva 742', '600654321', 'b@example.com')
  `);

  await this.db?.run(`
    INSERT OR IGNORE INTO invoices (id, concept, issue_date, due_date, issuer_id, client_id, subtotal, total_taxes, total, status, payment_method, notes)
    VALUES
    (1, 'Factura de ejemplo 1', '2026-01-07', '2026-01-21', 1, 2, 100, 21, 121, 'pending', 'bank transfer', 'Factura de prueba'),
    (2, 'Factura de ejemplo 2', '2026-01-05', '2026-01-20', 1, 2, 200, 42, 242, 'paid', 'cash', 'Segunda factura de prueba')
  `);

  await this.db?.run(`
    INSERT OR IGNORE INTO invoice_items (invoice_id, name, description, quantity, unit_price, subtotal, tax, discount)
    VALUES
    (1, 'Item A', 'Descripción item A', 2, 50, 100, 21, 0),
    (2, 'Item B', 'Descripción item B', 4, 50, 200, 42, 0)
  `);

  if (!environment.production) console.log('Datos de prueba insertados correctamente');
}

}
