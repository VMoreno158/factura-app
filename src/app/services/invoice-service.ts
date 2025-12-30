import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  http = inject(HttpClient)

  getAll() {
    return this.http.get('assets/invoices.json')
  }
}
