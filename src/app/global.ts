import { ATCMDHDL } from './providers/atcmd-dispatcher/atcmd-handler';
import { ATCMDHDLQCCSNK } from './providers/atcmd-dispatcher/atcmd-handler-qcc-sink';
import { ATCMDHDLQCCSRC } from './providers/atcmd-dispatcher/atcmd-handler-qcc-src';
import { BtDeviceInfo } from "./providers/bt-device-info";

export namespace GLOBAL 
{
    export class DevInfo  
    {
        static createInstance() : BtDeviceInfo
        {
            return new BtDeviceInfo();
        }

        constructor() {}    
    }

    export class AtCmdHandler_GLOBAL  
    {
        static registerAllSubClasses() : void
        {
            ATCMDHDL.AtCmdHandler.registerSubClass('QCC_SNK', ATCMDHDLQCCSNK.AtCmdHandler_QCC_SNK.createInstance);
            ATCMDHDL.AtCmdHandler.registerSubClass('QCC_SRC', ATCMDHDLQCCSRC.AtCmdHandler_QCC_SRC.createInstance);
        }

        constructor() {}    
    }
}
