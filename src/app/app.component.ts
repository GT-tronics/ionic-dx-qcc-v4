import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AtCmdDispatcherService } from './providers/atcmd-dispatcher/atcmd-dispatcher.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private dispatcher: AtCmdDispatcherService,
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      var opt = 
      {
        useSpp      : true,    // this app uses android SPP
        useDataCh   : false,   // this app doesn't use Data Channel
        uuids       :
        [
             // Insert your own BLE Service UUID
             "231fc15a-0d6f-4e66-94c7-eb0d30ace6b0",
        ],
      }

      this.dispatcher.init( sysEvtObj => {
        console.log("[APP] SysEvt: " + JSON.stringify(sysEvtObj));  
        
        // Add code here to handle BLE on/off events
        //
      }, opt).then( successObj => {
        console.log("[APP] DX init OK " + JSON.stringify(successObj));
      }).catch( failureObj => {
        console.log("[APP] DX init failed " + JSON.stringify(failureObj));
      });    

    });
  }
}
