import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/invoices-list/invoices-list.page').then( m => m.InvoicesListPage)
  },
  {
    path: 'invoice-details',
    loadComponent: () => import('./pages/invoice-details/invoice-details.page').then( m => m.InvoiceDetailsPage)
  },
  {
    path: 'invoice-form',
    loadComponent: () => import('./pages/invoice-form/invoice-form.page').then( m => m.InvoiceFormPage)
  },
]
