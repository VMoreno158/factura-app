import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonInput, IonNote, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';

@Component({
  selector: 'app-invoice-form',
  templateUrl: './invoice-form.page.html',
  styleUrls: ['./invoice-form.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonInput, IonNote, IonGrid, IonRow, IonCol]
})
export class InvoiceFormPage implements OnInit {
  modalCtrl = inject(ModalController)
  fb = inject(FormBuilder)

  invoice: any = {}
  invoiceForm!: FormGroup

  errorMessages: Record<string, any> = {
    concept: {
      required: 'El concepto es obligatorio',
      minlength: 'Demasiado corto. Minimo 3 caracteres'
    },
    recipient: {
      required: 'El emisor/receptor es obligatorio'
    },
    amount: {
      required: 'El importe es obligatorio',
      min: 'Importe demasiado bajo. Minimo 0.1',
      pattern: 'Máximo 2 decimales'
    },
    date: {
      required: 'La fecha es obligatoria'
    }
  };


  ngOnInit() {
    this.invoiceForm = this.fb.group({
      concept: ['', [Validators.required, Validators.minLength(3)]],
      recipient: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      date: ['', Validators.required],
      status: ['pending'],
      direction: ['received'],
    })
  }

  save() {
    this.modalCtrl.dismiss({ created: true })
  }

  close() {
    this.modalCtrl.dismiss()
  }

  submit() {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched()
      return
    }

    console.log('Factura añadida:', this.invoiceForm.value)
  }

  getError(controlName: string): string | null {
    const control = this.invoiceForm.get(controlName)

    if (!control || control.untouched || !control.errors) return null

    const errors = this.errorMessages[controlName]
    const firstErrorKey = Object.keys(control.errors)[0]

    return errors?.[firstErrorKey] ?? null
  }

}
