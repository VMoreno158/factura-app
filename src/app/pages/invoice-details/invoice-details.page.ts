import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-invoice-details',
  templateUrl: './invoice-details.page.html',
  styleUrls: ['./invoice-details.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent]
})
export class InvoiceDetailsPage implements OnInit {
  invoice = null

  constructor() { }

  ngOnInit() {
  }

}
