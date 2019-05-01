import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { DiscoverPage } from './discover.page';

@NgModule({
  declarations: [DiscoverPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      { path: '', component: DiscoverPage }
    ])
  ],
})
export class DiscoverPageModule {}
