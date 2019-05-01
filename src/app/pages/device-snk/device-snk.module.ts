import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { MbscModule } from '@mobiscroll/angular';

import { DeviceSnkPage } from './device-snk.page';

@NgModule({
  declarations: [DeviceSnkPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MbscModule,
    RouterModule.forChild([
      { path: '', component: DeviceSnkPage }
    ])
  ],
})
export class DeviceSnkPageModule {}
