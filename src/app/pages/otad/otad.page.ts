import { Component, NgZone, ViewChild, OnInit, OnDestroy  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http'
import { Platform, Events, NavController, AlertController } from '@ionic/angular';
import { AtCmdDispatcherService } from '../../providers/atcmd-dispatcher/atcmd-dispatcher.service';
import { BtDeviceInfo } from '../../providers/bt-device-info'
import { PageParamsPassingService } from 'src/app/providers/page-params-passing/page-params-passing.service';
import { ATCMDHDLQCCSNK } from 'src/app/providers/atcmd-dispatcher/atcmd-handler-qcc-sink';

import {Md5} from 'ts-md5/dist/md5';

@Component({
  selector: 'app-otad',
  templateUrl: './otad.page.html',
  styleUrls: ['./otad.page.scss'],
})
export class OtadPage implements OnInit 
{

  protected bindedFunctions : any = {};
  protected isViewEntered : boolean = false;

  protected status : string = "Checking for new firmware ...";
  protected progress : number = 0.0;
  protected upgradeInProgress : boolean = false;
  protected lastPageRoute : string;
  protected atCmdHandler : ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK;
  protected devInfo : BtDeviceInfo;

  protected firmBin : Uint8Array; 
  protected firmName : string;

  protected enableSwitchButton : boolean = false;

  constructor
  (
    public platform: Platform,
    public navCtrl: NavController,
    public route: ActivatedRoute,
    private zone: NgZone,
    public alertCtrl : AlertController,
    public dispatcher : AtCmdDispatcherService,
    public events: Events,
    private ppp : PageParamsPassingService,
    private http : HttpClient,
  ) 
  { 
  }

  ngOnInit()
  {
    console.log('[OTAD] ngOnInit');
  }

  ngOnDestroy()
  {
    console.log('[OTAD] ngOnDestroy');
  }

  ionViewWillEnter()
  {
    console.log('[OTAD] view entering');

    var fn : any;

    this.bindedFunctions = {};

    fn = this.handleBleDevChanged.bind(this);
    this.events.subscribe('BT_DEV_CHANGED', fn);
    this.bindedFunctions['BT_DEV_CHANGED'] = fn;

    let data : any = this.ppp.find('/otad');
    this.lastPageRoute = data.lastPageRoute;
    this.atCmdHandler = <ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK>data.atCmdHandler;
    this.devInfo = data.devInfo;
  }

  ionViewDidEnter()
  {
    console.log('[OTAD] did enter');

    this.isViewEntered = true;

  }

  ionViewWillLeave()
  {
    console.log('[OTAD] view leaving');
  }

  ionViewDidLeave()
  {
    console.log('[OTAD] view left');

    this.isViewEntered = false;

    for( var key in this.bindedFunctions )
    {
      var fn = this.bindedFunctions[key];
      this.events.unsubscribe(key, fn);
    }

    this.bindedFunctions = null;
  }

  private handleBleDevChanged(params)
  {
    //console.log('[OTAD]', JSON.stringify(params));
    if( params.name == 'QCC_SNK' && params.action == 'disconnect' )
    {
      console.log("[OTAD] disconnect page close");


      this.zone.run(() => {
        this.navCtrl.navigateBack('/discover');
      });
    }
  }

  downloadBinaryA()
  {
    this.downloadBinary("assets/sink_image_upgrade_a.bin")
  }

  downloadBinaryB()
  {
    this.downloadBinary("assets/sink_image_upgrade_b.bin")
  }

  downloadBinary(binName : string)
  {
    this.upgradeInProgress = true;

    this.http.get(binName, {responseType: 'blob'}).subscribe(async blob => {
      var arrayBuf = await new Response(blob).arrayBuffer();
      
      var md5 = new Md5();
      md5.appendByteArray(new Uint8Array(arrayBuf));
      console.log("[OTAD] FirmBinDigest: " + md5.end());

      this.dispatcher.upgradeFirmware
      (
        this.devInfo.uuid,
        "QCC",
        arrayBuf,
        this.firmName, 
        (obj) => {
          // On success
          console.log("[OTAD] upgrade success");
        }, 
        (obj) => {
          // On failure
          console.log("[OTAD] upgrade failed");
        },
        (obj) => {
          // On progress
          this.zone.run(() => {
            this.progress = obj.progress;
            if( obj.stage == 1 )
            {
              this.enableSwitchButton = true;
            }
            console.log("[OTAD] upgrading @stage" + obj.stage + " " + (obj.progress * 100) + "%");
          });
        },
      );
    });
  }

  abort()
  {
    this.dispatcher.abortFirmware(this.devInfo.uuid, "QCC").then( ret => {
      console.log("[OTAD] abort successful");
    }).catch( ret => {
      console.log("[OTAD] abort failed");
    });
  }

  commit()
  {
    this.dispatcher.switchFirmware(this.devInfo.uuid, "QCC", 0, false).then( ret => {
      console.log("[OTAD] switch successful");
    }).catch( ret => {
      console.log("[OTAD] switch failed");
    });
  }

}
