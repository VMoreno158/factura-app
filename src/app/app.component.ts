import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet} from '@ionic/angular/standalone';
import { DatabaseService } from './services/database-service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonRouterOutlet, IonApp],
})
export class AppComponent {
  dbService = inject(DatabaseService)

  constructor() {
   this.initApp()
  }

  async initApp() {
    try {
      await this.dbService.initializeDatabase();
      await this.dbService.seedDatabase();
    } catch (error) {
      console.error('Error inicializando la base de datos:', error);
    }
  }
}
