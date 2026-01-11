import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonSearchbar, IonContent, IonList, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonGrid, IonRow, IonCol, IonAvatar, IonLabel, IonText, IonFab, IonFabButton, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { documentTextOutline, ellipse, addSharp, filter, search, arrowDownSharp, arrowUpSharp } from 'ionicons/icons';

import { InvoiceService } from '../../services/invoice-service';
import { InvoiceFormPage } from '../invoice-form/invoice-form.page';
import { environment } from 'src/environments/environment.prod';
import { ApiResponse } from 'src/app/models/api-response';
import { InvoicePrueba } from 'src/app/services/invoice-prueba';

@Component({
  selector: 'app-invoices-list',
  templateUrl: './invoices-list.page.html',
  styleUrls: ['./invoices-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonContent,
    IonList,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonAvatar,
    IonLabel,
    IonText,
    IonFab,
    IonFabButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent
  ]
})
export class InvoicesListPage implements OnInit {
  invoiceService = inject(InvoiceService)
  invoicePruebaService = inject(InvoicePrueba)
  modalCtrl = inject(ModalController)

  @ViewChild('infiniteScroll') infiniteScroll!: IonInfiniteScroll
  @ViewChild('searchBar') searchBar!: IonSearchbar

  invoiceList: any = []
  filteredInvoiceList: any = []
  component = InvoiceFormPage

  showSearchBar: boolean = false
  searchInputText: string = ''

  page = 0
  pageSize = 8
  results: any = []

  ngOnInit() {
    addIcons({
      'document-text-outline': documentTextOutline,
      ellipse,
      'add-sharp': addSharp,
      search,
      filter,
      'arrow-down-sharp': arrowDownSharp,
      'arrow-up-sharp': arrowUpSharp
    })
    this.loadInvoices()
  }

  toggleSearchBar() {
    this.showSearchBar = !this.showSearchBar

    if (!this.showSearchBar) {
      this.loadInvoices()
      if (!environment.production) console.log('Close SearchBar')
    } else {
      this.filteredInvoiceList = this.filterInvoices(this.searchInputText)
      this.resetPagination()
      if (!environment.production) console.log('Open SearchBar')
    }
  }

  loadInvoices() {
    if(environment.production) this.invoiceService.getInvoices().then(
      (response: ApiResponse) => {
        this.invoiceList = response.data
        this.filteredInvoiceList = [...this.invoiceList]

        this.resetPagination()
      }
    )
    else this.invoicePruebaService.getInvoices().subscribe( data => {
      this.invoiceList = data
      this.filteredInvoiceList = [...this.invoiceList]
      console.log(this.filteredInvoiceList)

      this.resetPagination()
    } )
  }

  searchInvoices() {
    if (this.searchBar && !environment.production) console.log('SearchBar target. Value: ' + this.searchBar.value)
    this.searchInputText = this.searchBar.value?.toLowerCase() || ''

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

    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = false
      this.infiniteScroll.complete()
      if (!environment.production) console.log('Scroll Enabled!')
    }
  }

  onIonInfinite() {
    this.loadNextPage()

    setTimeout(() => {
      this.infiniteScroll.complete()

      if (this.results.length >= this.filteredInvoiceList.length) {
        this.infiniteScroll.disabled = true
      }
    }, 0)
  }

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