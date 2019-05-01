import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

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
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
