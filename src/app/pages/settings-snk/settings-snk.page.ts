import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Platform, Events, NavController, AlertController } from '@ionic/angular';
import { ATCMDHDLQCCSNK } from 'src/app/providers/atcmd-dispatcher/atcmd-handler-qcc-sink';
import { PageParamsPassingService } from 'src/app/providers/page-params-passing/page-params-passing.service';
import { BtDeviceInfo } from 'src/app/providers/atcmd-dispatcher/atcmd-dispatcher.service';
import { mobiscroll, MbscNumpadModule, MbscFormOptions } from '@mobiscroll/angular';

/**
 * Generated class for the SettingsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-settings-snk',
  templateUrl: 'settings-snk.page.html',
  styleUrls: ['settings-snk.page.scss'],
})
export class SettingsSnkPage implements OnInit, OnDestroy
{
  protected atCmdHandler : ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK = null;
  private bindedFunctions : {};
  protected lastPageRoute : string;
  protected devInfo : BtDeviceInfo;


  public pwrOnConnect : boolean = true;
  public pwrOnPairing : boolean = true;
  public remainOnPairing : boolean = true;
  public reconnectLastAttempt : number = 0;
  public connectAttemptRepeat : number = 0;
  public pairingTimeoutToIdle : boolean = false;
  public connectPolicyLast : boolean = false;
  public pairingTimeout : number = 0;
  public connectableTimeout : number = 0;

  public origBtName : string;
  public customBtName : string;
  public pinCode : number;
  public pinCodeMsg : string = "Not setup";
  public pinCodePadSettings: any = {
    theme: 'ios',
    buttons: ['set', 'clear', 'cancel'],
    template: 'dddd',
    allowLeadingZero: true,
    placeholder: '-',
    mask: '*',
    headerText: 'Enter PIN',
    validate: function (event, inst) {
        return {
            invalid: event.values.length != 4
        };
    },
    onClear: (event, inst) => {
      this.pinCodeOnClear(event, inst);
    },
    onSet: (event, inst) => {
      this.pinCodeOnSet(event, inst);
    },
  };

  public codecAptX : boolean = false;
  public codecAptXLL : boolean = false;
  public codecAptXHD : boolean = false;
  public codecAac : boolean = false;

  constructor
  (
    public platform: Platform,
    public navCtrl: NavController,
    public alertCtrl : AlertController,
    public route : ActivatedRoute, 
    private zone: NgZone,
    public events: Events,
    public ppp : PageParamsPassingService
  ) 
  {
    console.log("[SETTINGS-SNK] page start ...");
  }

  ngOnInit() {}
  ngOnDestroy() {}

  ionViewWillEnter() 
  {
    console.log("[SETTINGS-SNK] enter");

    var fn : any;

    this.bindedFunctions = {};

    fn = this.handleBleDevChanged.bind(this);
    this.events.subscribe('BT_DEV_CHANGED', fn);
    this.bindedFunctions['BT_DEV_CHANGED'] = fn;

    let data : any = this.ppp.find('/settings-snk');
    this.lastPageRoute = data.lastPageRoute;
    this.atCmdHandler = <ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK>data.atCmdHandler;
    this.devInfo = data.devInfo;

    // Get all the settings parameters
    //

    this.atCmdHandler.getLocalBluetoothName().then( ret => {
      console.log("[SETTINGS-SNK] local names: " + JSON.stringify(ret));
      this.zone.run(() => {
        this.origBtName = ret.origName;
        this.customBtName = ret.customName;
        this.devInfo.btClassicName = (ret.customName == "" ?ret.origName :ret.customName);
      });
    }).catch( ret => {
      console.log("[SETTING-SNK] get local BT name fail");
    });

    this.atCmdHandler.getCurrentCodec().then((ret) => {
      // console.log("[SETTINGS-SNK] get current codec success " + JSON.stringify(ret));
      this.zone.run(() => {
        this.codecAptX = ( ret.mask & 0x1 ) ?true :false;
        this.codecAptXLL = ( ret.mask & 0x2 ) ?true :false;
        this.codecAptXHD = ( ret.mask & 0x4 ) ?true :false;
        this.codecAac = ( ret.mask & 0x8 ) ?true :false;
      });
    });
  }
  
  ionViewDidLeave()
  {
    console.log("[SETTINGS-SNK] leave");

    for( var key in this.bindedFunctions )
    {
      var fn = this.bindedFunctions[key];
      this.events.unsubscribe(key, fn);
    }

    this.bindedFunctions = null;
  }


  private handleBleDevChanged(params)
  {
    if( params.action == 'disconnect' )
    {
      console.log("[SETTINGS] disconnect page close");
      this.zone.run(() => {
        this.navCtrl.navigateBack('/discover');
      });
    }
  }

  updateBluetoothName()
  {
    console.log("[SETTINGS-SNK] update BT name");

    if( this.devInfo.btClassicName == (this.customBtName == "" ?this.origBtName :this.customBtName) )
    {
      console.log("[SETTINGS-SNK] BT name no change [" + this.devInfo.btClassicName + "] [" + this.customBtName + "]");
      return;
    }

    if( this.customBtName == "" )
    {
      console.log("[SETTINGS-SNK] reset BT name to [" + this.origBtName + "]");
      this.atCmdHandler.resetLocalBluetoothName().then( ret => {
        console.log("[SETTINGS-SNK] reset BT name success");
        this.devInfo.btClassicName = this.origBtName;
      }).catch( ret => {
        console.log("[SETTINGS-SNK] reset BT name fail");
      });
    }
    else
    {
      console.log("[SETTINGS-SNK] update BT name to [" + this.customBtName + "]");
      this.atCmdHandler.setLocalBluetoothName(this.customBtName).then( ret => {
        console.log("[SETTINGS-SNK] update BT name success");
        this.devInfo.btClassicName = this.customBtName;
      }).catch( ret => {
        console.log("[SETTINGS-SNK] update BT name fail");
      });
    }
  }

  pinCodeOnClear(event : any, inst : any) 
  {
    if( this.devInfo.pinCode == 0xFFFF )
    {
      // Do nothing
      return;
    }

    this.devInfo.pinCode = parseInt(event.valueText);
  }

  pinCodeOnSet(event : any, inst : any)
  {
    this.devInfo.pinCode = parseInt(event.valueText);
  }

  updateCodec()
  {
    let mask = 0;
    mask |= this.codecAptX ?(1 << 0) :0;
    mask |= this.codecAptXLL ?(1 << 1) :0;
    mask |= this.codecAptXHD ?(1 << 2) :0;
    mask |= this.codecAac ?(1 << 3) :0;
    this.atCmdHandler.setCodecMask(mask);
  }

}
