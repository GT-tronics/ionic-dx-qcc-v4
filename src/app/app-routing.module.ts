import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/discover',
    pathMatch: 'full'
  },
  {
    path: 'discover',
    loadChildren: './pages/discover/discover.module#DiscoverPageModule'
  },
  {
    path: 'device-snk',
    loadChildren: './pages/device-snk/device-snk.module#DeviceSnkPageModule'
  },
  {
    path: 'settings-snk',
    loadChildren: './pages/settings-snk/settings-snk.module#SettingsSnkPageModule'
  },
  { 
    path: 'otad', 
    loadChildren: './pages/otad/otad.module#OtadPageModule' 
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
