import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { MbscModule } from '@mobiscroll/angular';

import { SettingsSnkPage } from './settings-snk.page';

@NgModule({
  declarations: [SettingsSnkPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MbscModule,
    RouterModule.forChild([
      { path: '', component: SettingsSnkPage }
    ])
  ],
})
export class SettingsSnkPageModule {}
