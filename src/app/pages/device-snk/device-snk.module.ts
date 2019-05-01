import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { DeviceSnkPage } from './device-snk.page';

@NgModule({
  declarations: [DeviceSnkPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      { path: '', component: DeviceSnkPage }
    ])
  ],
})
export class DeviceSnkPageModule {}
