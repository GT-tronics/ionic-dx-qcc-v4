import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy, RouterModule } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { DataExchangerService } from './providers/data-exchanger/data-exchanger.service';
import { AtCmdDispatcherService } from './providers/atcmd-dispatcher/atcmd-dispatcher.service';
import { PageParamsPassingService } from './providers/page-params-passing/page-params-passing.service';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    DataExchangerService,
    AtCmdDispatcherService,
    PageParamsPassingService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
