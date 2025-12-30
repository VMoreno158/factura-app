import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, IonInfiniteScroll } from '@ionic/angular';

import { addIcons } from 'ionicons';
import { documentTextOutline, ellipse, addSharp, filter, search, arrowDownSharp, arrowUpSharp, infinite } from 'ionicons/icons';

import { InvoiceService } from '../../services/invoice-service';
import { InvoiceFormPage } from '../invoice-form/invoice-form.page';

@Component({
  selector: 'app-invoices-list',
  templateUrl: './invoices-list.page.html',
  styleUrls: ['./invoices-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class InvoicesListPage implements OnInit {
  invoiceService = inject(InvoiceService)
  modalCtrl = inject(ModalController)

  @ViewChild('infiniteScroll') infiniteScroll!: IonInfiniteScroll

  invoiceList: any = []
  filteredInvoiceList: any = []
  component = InvoiceFormPage

  showSearchBar: boolean = false
  searchInputText:string = ''

  page = 0
  pageSize = 8
  results: any = []

  ngOnInit() {
    addIcons({ documentTextOutline, ellipse, addSharp, search, filter, arrowDownSharp, arrowUpSharp })
    this.loadInvoices()
  }

  toggleSearchBar() {
    this.showSearchBar = !this.showSearchBar

    if (!this.showSearchBar) {
    this.loadInvoices()
    console.log('cerrar busqueda')
  } else {
    this.filteredInvoiceList = this.filterInvoices(this.searchInputText)
    this.resetPagination()
    console.log('abrir busqueda')
  }
  }

  loadInvoices() {
    this.invoiceService.getAll().subscribe((data: any) => {
      this.invoiceList = data
      this.filteredInvoiceList = [...this.invoiceList]

      this.resetPagination()
    })
  }

  searchInvoices(event: Event) {
    const target = event?.target as HTMLIonSearchbarElement;
    this.searchInputText = target.value?.toLowerCase() || '';

    this.filteredInvoiceList = this.filterInvoices(this.searchInputText)
    this.resetPagination()
    
  }

  filterInvoices(query: string) {
    if (!query.trim()) {
    return this.invoiceList
    } else {
      return this.invoiceList.filter((invoice: any) => {
          return invoice.concept.toLowerCase().includes(query) ||
          invoice.recipient.toLowerCase().includes(query)
      })
    }
  }

  loadNextPage() {
    const start = this.page * this.pageSize;
    const end = start + this.pageSize;

    const nextPage = this.filteredInvoiceList.slice(start, end);

    if (nextPage.length === 0) return;

    this.results.push(...nextPage);
    this.page++;
  }

  resetPagination() {
    this.results = []
    this.page = 0
    this.loadNextPage()

    if(this.infiniteScroll){
      this.infiniteScroll.disabled = false
      this.infiniteScroll.complete()
      console.log('habilitando scroll')
    } 
  }

  onIonInfinite(event: any) {
    this.loadNextPage()

    setTimeout(() => {
      event.target.complete()

      if (this.results.length >= this.filteredInvoiceList.length) {
        event.target.disabled = true
      }
    }, 0)
  }


  // Add form (modal)
  async openInvoiceModal() {
    const modal = await this.modalCtrl.create({
      component: InvoiceFormPage,
    })

    await modal.present()

    const { data } = await modal.onDidDismiss()

    if (data?.created) {
      this.loadInvoices()
    }
  }
}
