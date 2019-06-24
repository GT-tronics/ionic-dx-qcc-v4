import { Component, NgZone, OnInit, OnDestroy  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Platform, Events, NavController, AlertController } from '@ionic/angular';
import { AtCmdDispatcherService, BtDeviceInfo } from '../../providers/atcmd-dispatcher/atcmd-dispatcher.service';
import { PageParamsPassingService } from 'src/app/providers/page-params-passing/page-params-passing.service';

@Component({
  selector: 'page-discover',
  templateUrl: 'discover.page.html',
  styleUrls: ['discover.page.scss'],
})
export class DiscoverPage
{
  protected unlinkDevInfos : BtDeviceInfo[];
  protected linkedDevInfos : BtDeviceInfo[];
  protected connectingDevInfos : { uuid : string, BtDeviceInfo };
  protected connectedPageRoutes : { uuid : string, string };
  protected pullToScanMsg : string = "Pull down to discover";
  protected isAppForeground : boolean = false;
  protected isViewEntered : boolean = false;
  
  private connectingPrompt : any = null;
  private bindedFunctions : {};

  constructor(
    public platform: Platform, 
    private zone: NgZone,
    public navCtrl : NavController,
    public route : ActivatedRoute,
    public events : Events,
    public alertCtrl : AlertController,
    public dispatcher : AtCmdDispatcherService,
    private ppp : PageParamsPassingService,
  ) 
  {
    this.dispatcher.init( sysEvtObj => {
      console.log("[DISCOVER] SysEvt: " + JSON.stringify(sysEvtObj));  
      
      // Add code here to handle BLE on/off events
      //
    }).then( successObj => {
      console.log("[DISCOVER] DX init OK " + JSON.stringify(successObj));
    }).catch( failureObj => {
      console.log("[DISCOVER] DX init failed " + JSON.stringify(failureObj));
    });

    this.connectingDevInfos = <{ uuid : string, BtDeviceInfo }>{};
    this.connectedPageRoutes = <{ uuid : string, string }>{};

    // Subscribe to app background event
    platform.pause.subscribe( () => {
      console.log("[HOME] enter background");
      this.isAppForeground = false;
      if( this.isViewEntered )
      {
        this.dispatcher.stopScan();
        for( var devInfo of this.unlinkDevInfos )
        {
          if( !devInfo.isIdle() )
          {
            this.dispatcher.disconnect(devInfo.uuid);
          }
        }
        for( var devInfo of this.linkedDevInfos )
        {
          if( !devInfo.isIdle() )
          {
            this.dispatcher.disconnect(devInfo.uuid);
          }
        }
      }
    });

    // Subscribe to app foreground event
    platform.resume.subscribe( () => {
      console.log("[HOME] enter foreground");
      this.isAppForeground = true;
    });
  }

  ngOnInit()
  {
    console.log('[HOME] ngOnInit');
  }

  ngOnDestroy()
  {
    console.log('[HOME] ngOnDestroy');
  }

  ionViewWillEnter()
  {
    console.log('[HOME] view entering');

    var fn : any;

    this.bindedFunctions = {};

    fn = this.handleBleDevChanged.bind(this);
    this.events.subscribe('BT_DEV_CHANGED', fn);
    this.bindedFunctions['BT_DEV_CHANGED'] = fn;

    this.unlinkDevInfos = [];
    this.linkedDevInfos = this.dispatcher.getLinkedDevices();
  }

  ionViewDidEnter()
  {
    console.log('[HOME] did enter');

    this.isViewEntered = true;

  }

  ionViewWillLeave()
  {
    console.log('[HOME] view leaving');
  }

  ionViewDidLeave()
  {
    console.log('[HOME] view left');

    this.isViewEntered = false;

    for( var key in this.bindedFunctions )
    {
      var fn = this.bindedFunctions[key];
      this.events.unsubscribe(key, fn);
    }

    this.bindedFunctions = null;
  }

  trackByUUID(index, item)
  {
    // to prevent ngFor refreshing the DOM which might cause flickering
    return !item ? null : item.uuid; 
  }

  handleBleDevChanged(params)
  {
    //console.log('[DISCOVER] ' + JSON.stringify(params));

    if( params.name != 'QCC_SNK' && 
        params.name != 'QCC_SRC' && 
        params.name != 'DXS' && 
        params.name != 'AtCmdHandler_NULL_CMD' &&
        params.name != 'AtCmdHandler_NULL_DATA' )
    {
      return;
    }

    // Update the device list UI
    this.zone.run(()=>{
      this.linkedDevInfos = this.dispatcher.getLinkedDevices();
      this.unlinkDevInfos = this.dispatcher.getUnlinkDevices();
    });

    if( this.connectingPrompt  )
    {
      this.connectingPrompt.dismiss();
      this.connectingPrompt = null;
    }

    var activateFailedPrompt : boolean = false;
    var failureReason : string = "internal error";

    if( params.action == "connect" )
    {
      var devInfo = this.connectingDevInfos[params.uuid];
  
      if( devInfo == null )
      {
        activateFailedPrompt = true;
      }
      else
      {
        if( params.name ==  "QCC_SNK" )
        {
          console.log("[DISCOVER] connect QCC-SNK");
          this.ppp.addOrReplace('/device-snk', {'devInfo' : devInfo, 'refresh' : true});
          this.zone.run(() => {
            this.navCtrl.navigateForward('/device-snk');
          });
          delete this.connectingDevInfos[params.uuid];
          this.connectedPageRoutes[params.uuid] = '/device-snk';
        }
        else if( params.name ==  "QCC_SRC" )
        {
          console.log("[DISCOVER] connect QCC-SRC");
          this.ppp.addOrReplace('/device-src', {'devInfo' : devInfo, 'refresh' : true});
          this.zone.run(() => {
            this.navCtrl.navigateForward('/device-src');
          });
          delete this.connectingDevInfos[params.uuid];
          this.connectedPageRoutes[params.uuid] = '/device-src';
        }
        else if( params.name ==  "DXS" )
        {
          console.log("[DISCOVER] connect DXS");
          this.ppp.addOrReplace('/firmware-8266', {'devInfo' : devInfo, 'refresh' : true, 'lastPageRoute' : '/discover'});
          this.zone.run(() => {
            this.navCtrl.navigateForward(['/firmware-8266', {'devInfo' : devInfo, 'refresh' : true, 'lastPageRoute' : '/discover'}]);
          });
          this.connectedPageRoutes[params.uuid] = '/firmware-8266';
        }  
      }      
    }

    if( params.action == "disconnect"  )
    {
      console.log("[DISCOVER] " + params.name + " disconnected");
      if( params.info.status && params.info.status < 0 )
      {
        activateFailedPrompt = true;
        failureReason = params.info.status;
      }
    }

    if( activateFailedPrompt )
    {
      this.alertCtrl.create({
        message: 'Connect Failed',
        subHeader: failureReason,
        buttons: [
            {
                text: 'Ok'
            }
        ]
      }).then(prompt => prompt.present());
    }
  }

  scanPull()
  {
  }

  scanRefresh(refresher)
  {
    // Empty the list
    this.linkedDevInfos = this.dispatcher.getLinkedDevices();
    this.unlinkDevInfos = [];

    setTimeout(() => {
      console.log("[DISCOVER] scan stopped");
      this.dispatcher.stopScan();
      refresher.target.complete();
      this.zone.run(() => {
        this.pullToScanMsg = "Pull down to discover";
      });    
    }, 3000);

    this.zone.run(() => {
      this.pullToScanMsg = "Scanning ...";
    });
      
    console.log("[DISCOVER] scan started");

    this.dispatcher.startScan(
      successObj => {
        //console.log("[HOME] scan success " + JSON.stringify(successObj));

        // Add code here to process the scan result. 
        // - for example, update the device list UI
        // - check for successObj.active for the device availability. If false,
        //   it means the device is no longer available (i.e. not advertising 
        //   any more), therefore it cannot be connected 

        this.zone.run(() => {
          this.linkedDevInfos = this.dispatcher.getLinkedDevices();
          this.unlinkDevInfos = this.dispatcher.getUnlinkDevices();
          console.log( "[DISCOVER] " + JSON.stringify(this.linkedDevInfos));
          console.log( "[DISCOVER] " + JSON.stringify(this.unlinkDevInfos));
        });
      },
      failureObj => {
        console.log("[DISCOVER] scan failure " + failureObj.status);
      }
    );
  }

  connectDevice(item, devInfo)
  {
    item.close();

    if( devInfo.isConnected() )
    {
      var pageRoute = this.connectedPageRoutes[devInfo.uuid];
      console.log("[DISCOVER] nav to " + pageRoute);
      this.ppp.addOrReplace(pageRoute, {'devInfo' : devInfo, 'refresh' : false, 'lastPageRoute' : '/discover'});
      this.zone.run(() => {
        this.navCtrl.navigateForward(pageRoute);
      });
      return;
    }

    this.alertCtrl.create({
      message: 'Connecting'
    }).then(prompt => {
      prompt.present();
      this.connectingPrompt = prompt;
      this.connectingDevInfos[devInfo.uuid] = devInfo;
      console.log("[DISCOVER] Connecting [" + devInfo.uuid + "][" + devInfo.name + "]");
      this.dispatcher.connect(devInfo.uuid, 10000).then( ret => {
        console.log("[DISCOVER] Connected [" + ret.status + "]");
      }).catch( ret => {
        this.connectingPrompt.dismiss();
        this.connectingPrompt = null;
        console.log("[DISCOVER] Connect fail [" + ret.status + "]");
        this.alertCtrl.create({
          message: 'Connect Failed',
          subHeader: ret.status,
          buttons: [
              {
                  text: 'Ok'
              }
          ]
        }).then( prompt => prompt.present());
      });
    });    
  }

  disconnectDevice(item, devInfo)
  {
    item.close();

    if( !devInfo.isConnected() )
    {
      return;
    }

    console.log("[DISCOVER] Disconnecting [" + devInfo.uuid + "][" + devInfo.name + "]");
    this.dispatcher.disconnect(devInfo.uuid).catch( ret => {
      console.log("[DISCOVER] Disconnect fail " + JSON.stringify(ret));
    });

    this.zone.run(() => {
      this.linkedDevInfos = this.dispatcher.getLinkedDevices();
      this.unlinkDevInfos = this.dispatcher.getUnlinkDevices();
    });
  }

  removeDevice(item, devInfo)
  {
    item.close();

    console.log("[DISCOVER] removing device [" + devInfo.uuid + "][" + devInfo.name + "]");
    this.dispatcher.removeLinkedDevice(devInfo.uuid);

    this.zone.run(() => {
      this.linkedDevInfos = this.dispatcher.getLinkedDevices();
      this.unlinkDevInfos = this.dispatcher.getUnlinkDevices();
    });
  }

}
