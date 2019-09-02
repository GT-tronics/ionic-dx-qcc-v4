import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Platform, Events, NavController, AlertController, ToastController } from '@ionic/angular';
import { AtCmdDispatcherService } from '../../providers/atcmd-dispatcher/atcmd-dispatcher.service';
import { BtDeviceInfo } from '../../providers/bt-device-info'
import { ATCMDHDLQCCSNK } from '../../providers/atcmd-dispatcher/atcmd-handler-qcc-sink';
import { PageParamsPassingService } from 'src/app/providers/page-params-passing/page-params-passing.service';

@Component({
  selector: 'page-device',
  templateUrl: 'device-snk.page.html',
  styleUrls: ['device-snk.page.scss'],
})
export class DeviceSnkPage implements OnInit, OnDestroy
{
  protected devInfo : BtDeviceInfo;
  protected pdlRecs : ATCMDHDLQCCSNK.PdlRec[] = [];
  protected deviceState : string = "IDLE";
  protected streamCodecStr : string = "STOP";
  protected shouldRefresh : boolean = true;

  public pairingButtonColor : string = "dark";
  public logButtonColor : string = "secondary";
  public playPauseButtonColor : string = "primary";
  public logButtonTitle : string = "Start Logging";
  public playPauseButtonTitle : string = "Play";

  public isStreaming : boolean = false;
  public streamingIdx : number = null;
  public nextStreamingIdx : number = null;
  public volumeLevel : number = 0.0;
  public volumeGuardTimeout : any = null;
  public isVolumeSliderTouchDown : boolean = false;

  protected atCmdHandler : ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK = null;
  private bindedFunctions : {};
  protected lastPageRoute : string;
  private pullToScanMsg : string = "Pull down to refresh";

  private rssiTimer : any = null;
  private refresher : any = null;


  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public route: ActivatedRoute,
    private zone: NgZone,
    public alertCtrl : AlertController,
    public toastCtrl : ToastController,
    public dispatcher : AtCmdDispatcherService,
    public events: Events,
    private ppp : PageParamsPassingService
  ) {
  }

  ngOnInit() {}
  ngOnDestroy() {}

  ionViewWillEnter()
  {
    console.log('[DEVICE-SNK] enter');

    var fn : any;

    this.bindedFunctions = {};

    fn = this.handleBleDevChanged.bind(this);
    this.events.subscribe('BT_DEV_CHANGED', fn);
    this.bindedFunctions['BT_DEV_CHANGED'] = fn;

    fn = this.handlePdlChanged.bind(this);
    this.events.subscribe('QCC_SNK_PDL_CHANGED', fn);
    this.bindedFunctions['QCC_SNK_PDL_CHANGED'] = fn;

    fn = this.handleDeviceStateChanged.bind(this);
    this.events.subscribe('QCC_SNK_DEVICE_STATE_CHANGED', fn);
    this.bindedFunctions['QCC_SNK_DEVICE_STATE_CHANGED'] = fn;

    fn = this.handleStreamStateChanged.bind(this);
    this.events.subscribe('QCC_SNK_STREAM_STATE_CHANGED', fn);
    this.bindedFunctions['QCC_SNK_STREAM_STATE_CHANGED'] = fn;

    fn = this.handleVolumeChanged.bind(this);
    this.events.subscribe('QCC_SNK_VOLUME_CHANGED', fn);
    this.bindedFunctions['QCC_SNK_VOLUME_CHANGED'] = fn;

    let data : any = this.ppp.find('/device-snk');
    this.lastPageRoute = data.lastPageRoute;
    this.devInfo = data.devInfo;
    this.shouldRefresh = data.refresh;

    this.refresh(this.shouldRefresh);
    this.shouldRefresh = false;
  }

  ionViewDidLeave()
  {
    console.log('[DEVICE-SNK] leave');

    for( var key in this.bindedFunctions )
    {
      var fn = this.bindedFunctions[key];
      this.events.unsubscribe(key, fn);
    }

    this.bindedFunctions = null;

    clearInterval(this.rssiTimer);
    this.rssiTimer = null;
  }

  private refresh( shouldRefresh : boolean)
  {
    if( this.getHandler() )
    {
      // Request Device Name
      this.atCmdHandler.getLocalBluetoothName(true).then( ret => {
        this.devInfo.btClassicName = ret.customName == "" ?ret.origName :ret.customName;
        // Request PDL
        this.atCmdHandler.refreshPdl().then( ret => {
          console.log("[DEVICE-SNK] refresh PDL (1st) success " + JSON.stringify(ret));
          this.zone.run(() => {
            this.pdlRecs = ret.pdl;
            this.streamingIdx = null;
            this.isStreaming = false;
            for(var idx = 0; idx < this.pdlRecs.length; idx++ )
            {
                if( this.pdlRecs[idx].isStreaming  )
                {
                  this.isStreaming = true;
                  this.streamingIdx = idx;
                  this.volumeLevel = this.pdlRecs[idx].vol;
                  break;
                }
            }
          });

          if( !ret.isComplete )
          {
            this.toastCtrl.create({
              message: 'Warning: PDL incomplete',
              duration: 2000
            }).then((toastData)=>{
              console.log(toastData);
              toastData.present();
            });            
          }

          // Use AT+CC? to find out the current streaming codec.
          // - don't worry about streaming state as above block will take care of that
          this.atCmdHandler.getCurrentCodec().then( ret => {
            this.zone.run(() => {
              this.streamCodecStr = ret.codecStr;
            });
            this.atCmdHandler.getDeviceState().then( ret => {
              this.zone.run(() => {
                var state = this.atCmdHandler.atCmdDS.deviceState
                this.deviceState = this.atCmdHandler.atCmdDS.deviceStateStrs[state];
                this.pairingButtonColor = (this.deviceState == 'DISCOVERABLE' ?"danger" :"dark");
              });  
            }).catch( ret => {
              console.log("[DEVICE-SNK] device state (1st) fail " + JSON.stringify(ret));
            });
          }).catch( ret => {
            console.log("[DEVICE-SNK] current codec (1st) fail " + JSON.stringify(ret));
          });
        }).catch( ret => {
          console.log("[DEVICE-SNK] refresh PDL (1st) fail " + JSON.stringify(ret));
        });
      }).catch( ret => {
        console.log("[DEVICE-SNK] get local device name fail");
      });
    }
  }

  private handleBleDevChanged(params)
  {
    //console.log('[DEVICE-SNK]', JSON.stringify(params));
    if( params.name == 'QCC_SNK' && params.action == 'disconnect' )
    {
      console.log("[DEVICE-SNK] disconnect page close");
      this.zone.run(() => {
        this.navCtrl.navigateBack('/discover');
      });
    }
  }

  private handlePdlChanged(params)
  {
    console.log('[DEVICE-SNK] PDL changed: ' + JSON.stringify(params));
  }

  private handleDeviceStateChanged(params)
  {
    console.log('[DEVICE-SNK] device state changed: ' + JSON.stringify(params));

      this.zone.run( () => {
        this.deviceState = params.state;
        if( this.deviceState == 'DISCOVERABLE' )
        {
          this.pairingButtonColor = "danger";
          this.toastCtrl.create({
            message: 'Bluetooth pairing started',
            duration: 2000
          }).then((toastData)=>{
            console.log(toastData);
            toastData.present();
          });            
      }
        else if( this.pairingButtonColor == "danger" )
        {
          this.pairingButtonColor = "dark";
          this.toastCtrl.create({
            message: 'Bluetooth pairing ended',
            duration: 2000
          }).then((toastData)=>{
            console.log(toastData);
            toastData.present();
          });            
        }

      // setTimeout(() => {
      //   this.atCmdHandler.refreshPdl();        
      // },0);
      // var ary = this.atCmdHandler.getPdlImmediate();
      // if( ary == null )
      // {
      //   this.pdlRecs = [];
      // }
      // else
      // {
      //   this.pdlRecs = ary;
      // }
    });

    // // Update PDL since device state has changed
    // this.atCmdHandler.refreshPdl();        
  }

  private handleStreamStateChanged(params)
  {
    console.log('[DEVICE-SNK] stream state changed: ' + JSON.stringify(params));
    
    var found : boolean = false;
    for(var idx = 0; idx < this.pdlRecs.length; idx++ )
    {
        if( this.pdlRecs[idx].addr == params.addr )
        {
          found = true;
          break;
        }
    }

    if( !found )
    {
      // Do a complete refresh
      this.refreshPdl();
      return;
    }

    this.zone.run( () => {
      if( params.action == 'connect' )
      {
        this.streamCodecStr = params.codecStr;
        this.isStreaming = true;
        this.streamingIdx = idx;
        this.pdlRecs[idx].isStreaming = true;
      }
      else
      {
        this.streamCodecStr = 'STOP';
        this.isStreaming = false;
        this.streamingIdx = null;
        this.pdlRecs[idx].isStreaming = false;
      }
    });

    // Take care of the derferred audio play after switching active connection
    if( params.action == 'disconnect' && this.nextStreamingIdx != null)
    {
      // Switch play now takes action
      this.atCmdHandler.switchActiveConnection(this.nextStreamingIdx).then( ret => {
        this.atCmdHandler.setPlayState(1).then( ret => {
          console.log("[DEVICE-SNK] audio play after switching connection success");
        }).catch( ret => {
          console.log("[DEVICE-SNK] audio play after switching connection fail");
        });
      }).catch( ret => {
        console.log("[DEVICE-SNK] switch active connection fail");
      });
      this.nextStreamingIdx = null;
    }
  }

  private handleVolumeChanged(params)
  {
    if( this.isVolumeSliderTouchDown )
    {
      return;
    }

    console.log('[DEVICE-SNK] volume changed: ' + params.volume);

    this.zone.run( () => {
      this.volumeLevel = params.volume;
    });
    
    if( this.streamingIdx != null )
    {
      this.pdlRecs[this.streamingIdx].vol = params.volume;
    }
  }

  private getHandler() : boolean
  {
    if( this.atCmdHandler == null )
    {
      // this.atCmdHandler = <ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK>this.dispatcher.getCmdChHandler(linkedList[foundIdx].uuid);
      this.atCmdHandler = <ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK>this.dispatcher.getCmdChHandler(this.devInfo.uuid);
    }
    else
    {
      return true;
    }

    if( this.atCmdHandler == null )
    {
      // Handler is not any more
      // - likely the device is disconnected
      // - pop this page and let th parent to handle it
      console.log("[DEVICE-SNK] error page close");
      this.zone.run(() => {
        this.navCtrl.navigateBack('/discover');
      });
      return false;
    }    

    return true;
  }

  refreshPdl()
  {
    //console.log("[DEVICE-SNK] refresh PDL [" + linkedList[foundIdx].uuid + "][" + linkedList[foundIdx].name + "]");
    console.log("[DEVICE-SNK] refresh PDL");
    // {
    //   "pdl" : 
    //     [
    //       {
    //         "idx" : 0,
    //         "addr" : "00:02:5B:00:A5:A5",
    //         "addrType" : 0,
    //         "isPhoneProvisioned" : false,
    //         "isMusicProvisioned" : true,
    //         "isPhoneConnected" : 0,
    //         "isMusicConnected" : 0,
    //         "provisionProfile" : 2,
    //         "connectedProfile" : 0,
    //         "remoteDevName":null
    //       },
    //       {
    //         "idx" : 1,
    //         "addr" : "D4:A3:3D:B2:4F:23",
    //         "addrType" : 0,
    //         "isPhoneProvisioned" : false,
    //         "isMusicProvisioned" : true,
    //         "isPhoneConnected" : 0,
    //         "isMusicConnected" : 0,
    //         "provisionProfile" : 2,
    //         "connectedProfile" : 0,
    //         "remoteDevName" : null
    //       }
    //     ],
    //   "seqid" : 12,
    //   "uuid" : "0490D0BC-BA9C-9002-AFF8-AC0D053FC4B2",
    //   "cmdRsp" : "+PDL:",
    //   "retCode" : 0
    // }

    this.zone.run( () => {
      this.pdlRecs = [];
    })

    this.atCmdHandler.refreshPdl().then( ret => {
      console.log("[DEVICE-SNK] refresh PDL success " + JSON.stringify(ret));
      this.zone.run(() => {
        this.pdlRecs = ret.pdl;
        this.pullToScanMsg = "Pull down to refresh";
        this.streamingIdx = null;
        this.isStreaming = false;
        for(var idx = 0; idx < this.pdlRecs.length; idx++ )
        {
            if( this.pdlRecs[idx].isStreaming  )
            {
              this.isStreaming = true;
              this.streamingIdx = idx;
              this.volumeLevel = this.pdlRecs[idx].vol;
              break;
            }
        }
      });
      this.refresher.target.complete();

      if( !ret.isComplete )
      {
        this.toastCtrl.create({
          message: 'Warning PDL incomplete',
          duration: 2000
        }).then((toastData)=>{
          console.log(toastData);
          toastData.present();
        });            
    }
    }).catch( ret => {
      console.log("[DEVICE-SNK] refresh PDL fail " + JSON.stringify(ret));
      this.zone.run(() => {
        this.pullToScanMsg = "Pull down to refresh";
      });
      this.refresher.target.complete();
    });
  }

  pairButtonPressed(event)
  {
    console.log("[DEVICE-SNK] change pairing");

    var onOff = true;
    if( this.pairingButtonColor != 'dark' )
    {
      onOff = false;
    }
    this.atCmdHandler .setPairingOnOff(onOff).then( ret => {
      console.log("[DEVICE-SNK] change pairing success " + JSON.stringify(ret));
      this.zone.run( () => {
        if( this.pairingButtonColor == 'dark' )
        {
          this.pairingButtonColor = 'danger';
        }
        else
        {
          this.pairingButtonColor = 'dark';
          // this.deviceState = 'CONNECTABLE';
        }
      });
    }).catch( ret => {
      console.log("[DEVICE-SNK] change pairing fail " + JSON.stringify(ret));
    });;
  }

  connectPdl(item, pdlRec)
  {
    item.close();

    if( pdlRec.isMusicConnected )
    {
      // THe selected device is alreay connected
      // - just return
      return;
    }

    // Create a "conneting" prompt
    this.alertCtrl.create({
      message: 'Connecting'
    }).then( prompt => {
      prompt.present();
      console.log("[DEVICE-SNK] Connenting PDL [" + pdlRec.addr + "]");
      this.atCmdHandler.connectDevice(pdlRec.addr).then( ret => {
        console.log("[DEVICE-SNK] connect PDL success " + JSON.stringify(ret));
        prompt.dismiss();
      }).catch( ret => {
        console.log("[DEVICE-SNK] connect PDL fail " + JSON.stringify(ret));
        prompt.dismiss();
        this.alertCtrl.create({
          message: 'Connect failed [' + ret.status + ']',
          buttons: [
              {
                  text: 'Ok'
              }
          ]
        }).then( prompt => prompt.present());
      });
    });
  }

  disconnectPdl(item, pdlRec)
  {
    item.close();

    if( !pdlRec.isMusicConnected )
    {
      return;
    }

    // Create a "disconneting" prompt
    this.alertCtrl.create({
      message: 'Disconnecting'
    }).then( prompt => {
      prompt.present();
      console.log("[DEVICE-SNK] Disconnecting device in PDL [" + pdlRec.addr + "]");
      this.atCmdHandler.disconnectDevice(pdlRec.addr).then( ret => {
        console.log("[DEVICE-SNK] disconnect device in PDL success " + JSON.stringify(ret));
        prompt.dismiss();
      }).catch( ret => {
        prompt.dismiss();
        console.log("[DEVICE-SNK] disconnect device in PDL fail " + JSON.stringify(ret));
        this.alertCtrl.create({
          message: 'Disconnect failed [' + ret.status + ']',
          buttons: [
              {
                  text: 'Ok'
              }
          ]
        }).then( prompt => prompt.present());
      });       
    });
  }

  removePdl(item, pdlRec)
  {
    item.close();

    // Create a "Removing" prompt
    this.alertCtrl.create({
      message: 'Removing'
    }).then( prompt => {
      prompt.present();
      console.log("[DEVICE-SNK] Removing device in PDL [" + pdlRec.addr + "]");
      this.atCmdHandler.removePDL(pdlRec.addr).then( ret => {
        console.log("[DEVICE-SNK] remove device in PDL success " + JSON.stringify(ret));
        prompt.dismiss();
        this.atCmdHandler.refreshPdl();
      }).catch( ret => {
        prompt.dismiss();
        console.log("[DEVICE-SNK] remove device in PDL fail " + JSON.stringify(ret));
        this.alertCtrl.create({
          message: 'Remove failed [' + ret.status + ']',
          buttons: [
              {
                  text: 'Ok'
              }
          ]
        }).then( prompt => prompt.present());
      });
    });
  }

  logButtonPressed(event)
  {
    console.log("[DEVICE_SNK] change logging");

    if( this.logButtonColor == 'secondary' )
    {
      this.zone.run(() => {
        this.logButtonColor = 'danger';
        this.logButtonTitle = 'End Logging';
      });

      this.atCmdHandler.startLogging();
    }
    else
    {
      this.zone.run(() => {
        this.logButtonColor = 'secondary';
        this.logButtonTitle = 'Start Logging';
      });

      this.atCmdHandler.stopLogging();
    }
  }

  playPauseButtonPressed(pdlRec : ATCMDHDLQCCSNK.PdlRec)
  {
    console.log("[DEVICE_SNK] change play pause state");
    if( !this.isStreaming )
    {
      // Not streaming before, just play
      this.atCmdHandler.switchActiveConnection(pdlRec.idx).then( ret => {
        this.atCmdHandler.setPlayState(1).then( ret => {
          console.log("[DEVICE-SNK] audio play after switching connection success");
        }).catch( ret => {
          console.log("[DEVICE-SNK] audio play after switching connection fail");
        });
      }).catch( ret => {
        console.log("[DEVICE-SNK] switch active connection fail");
      });
      return;  
    }

    this.atCmdHandler.setPlayState(0).then( ret => {
    }).catch( ret => {
      console.log("[DEVICE_SNK] audio pause failed");
    });

    this.nextStreamingIdx = null;
    if( pdlRec.idx != this.streamingIdx )
    {
      // Switch play
      // - defer the action until the stream state updated
      this.nextStreamingIdx = pdlRec.idx;
    }    
  }

  skipForwardButtonPressed(event)
  {
    console.log("[DEVICE_SNK] skip forward");

    if( !this.getHandler() )
    {
      return;
    }

    this.atCmdHandler.setAudioTrack(1);
  }

  skipBackwardButtonPressed(event)
  {
    console.log("[DEVICE_SNK] skip backward");

    this.atCmdHandler.setAudioTrack(0);
  }

  volumeSliderChanged(event)
  {
    console.log("[DEVICE_SNK] volume slider changed[" + this.devInfo.uuid + "][" + this.devInfo.name + "]");

    if( this.isVolumeSliderTouchDown )
    {
      this.atCmdHandler.setVolume(this.volumeLevel);

      for(var idx = 0; idx < this.pdlRecs.length; idx++ )
      {
          if( this.pdlRecs[idx].isStreaming )
          {
            this.pdlRecs[idx].vol = this.volumeLevel;
            break;
          }
      }
    }
  }

  volumeSliderTouchDown(event)
  {
    console.log("[DEVICE_SNK] volume slider touch down");
    this.isVolumeSliderTouchDown = true;
  }

  volumeSliderTouchUp(event)
  {
    console.log("[DEVICE_SNK] volume slider touch up");
    this.isVolumeSliderTouchDown = false;
    this.atCmdHandler.setVolume(this.volumeLevel);

    for(var idx = 0; idx < this.pdlRecs.length; idx++ )
    {
        if( this.pdlRecs[idx].isStreaming )
        {
          this.pdlRecs[idx].vol = this.volumeLevel;
          break;
        }
    }    
  }

  scanPull()
  {
  }

  scanRefresh(refresher)
  {
    if( this.refresher )
    {
      this.refresher.target.complete();
    }
    this.refresher = refresher;

    this.zone.run(() => {
      this.pullToScanMsg = "Refreshing ...";
    });
      
    this.refreshPdl();
  }

  navToSettingsPage()
  {
    this.ppp.addOrReplace('/settings-snk', {'devInfo' : this.devInfo, 'atCmdHandler' : this.atCmdHandler, 'lastPageRoute' : '/device-snk'});
    this.zone.run(() => {
      this.navCtrl.navigateForward('/settings-snk');
    });    
  }

  navToOverTheAirDownloadPage()
  {
    this.ppp.addOrReplace('/otad', {'devInfo' : this.devInfo, 'atCmdHandler' : this.atCmdHandler, 'lastPageRoute' : '/device-snk'});
    this.zone.run(() => {
      this.navCtrl.navigateForward('/otad');
    });    
  }

}
