import { ATCMDHDL } from './providers/atcmd-dispatcher/atcmd-handler';
import { ATCMDHDLQCCSNK } from './providers/atcmd-dispatcher/atcmd-handler-qcc-sink';
import { ATCMDHDLQCCSRC } from './providers/atcmd-dispatcher/atcmd-handler-qcc-src';
import { ATCMDHDLDXS } from './providers/atcmd-dispatcher/atcmd-handler-dxs';
import { ATCMDHDLWIFI8266 } from './providers/atcmd-dispatcher/atcmd-handler-wifi-8266';

export namespace ATCMDHDLGLOBAL 
{
    export class AtCmdHandler_GLOBAL  
    {
        static registerAllSubClasses() : void
        {
            ATCMDHDL.AtCmdHandler.registerSubClass('QCC_SNK', ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK.createInstance);
            ATCMDHDL.AtCmdHandler.registerSubClass('QCC_SRC', ATCMDHDLQCCSRC.AtCmdHandler_QCC_SRC.createInstance);
            // ATCMDHDL.AtCmdHandler.registerSubClass('BLE', ATCMDHDLDXS.AtCmdHandler_DXS.createInstance);
            // ATCMDHDL.AtCmdHandler.registerSubClass('WIFI', ATCMDHDLWIFI8266.AtCmdHandler_WIFI_8266.createInstance);
        }

        constructor() {}    
    }
}

