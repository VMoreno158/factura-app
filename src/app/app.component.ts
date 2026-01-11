import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DatabaseService } from './services/database-service';
import { environment } from 'src/environments/environment.prod';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonRouterOutlet, IonApp],
})
export class AppComponent {
  dbService = inject(DatabaseService)

  // USAR ESTO EN EL GRADLE DE ANDROID PARA CARGAR LA VERSION 17 DE JAVA DE CAPACITOR DEBAJO DE: apply from: "variables.gradle"
  /* 
  subprojects { subproject ->
    afterEvaluate {
        if (subproject.hasProperty("android")) {
            android {
                compileOptions {
                    sourceCompatibility JavaVersion.VERSION_17
                    targetCompatibility JavaVersion.VERSION_17
                }
            }
        }
    }
}
  */

  constructor() {
    if (environment.production) this.initApp()
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
