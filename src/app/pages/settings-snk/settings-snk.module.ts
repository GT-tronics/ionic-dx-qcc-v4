import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { SettingsSnkPage } from './settings-snk.page';

@NgModule({
  declarations: [SettingsSnkPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      { path: '', component: SettingsSnkPage }
    ])
  ],
})
export class SettingsSnkPageModule {}
