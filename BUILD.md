# Install dx-qcc-audio-demo App Source Package
## Clone the ionic-dx-qcc-v4 respository
```
cd ~/projects/ionic/v4/
git clone https://github.com/GT-tronics/ionic-dx-qcc-v4.git qccdemo
cd ~/projects/ionic/v4/qccdemo/
git submodule init
git submodule update --remote
```
## Install iOS and android platforms
```
cd ~/projects/ionic/v4/qccdemo/
ionic cordova platform add ios
ionic cordova platform add android
```
## Make Some Patches
### CDVPLuginResult
This patch allows the the nested NSDictionary object which contains NSData be able to convert JSON string probably. 
```
cd ~/projects/ionic/v4/qccdemo/
cp ./patches/ios/CDVPluginResult/* ./platforms/ios/CordovaLib/Classes/Public
```
### Android Support V4
The DataExchanger cordova plugin requires this library. Use VSCode or your editor of choice to edit ~/projects/ionic/v4/qccdemo/platforms/android/app/build.gradle.
```
code ~/projects/ionic/v4/qccdemo/platforms/android/app/build.gradle
```
Add the line **implementation 'com.android.support:support-v4:+'** in the dependency section
```
...
dependencies {
    implementation fileTree(include: '*.jar', dir: 'libs')
    // SUB-PROJECT DEPENDENCIES START
    implementation project(path: ':CordovaLib')
    // SUB-PROJECT DEPENDENCIES END
    implementation 'com.android.support:support-v4:+'
}
...
```
## Install DataExchanger cordova plugin
```
cd ~/projects/cordova/plugins/
git clone https://github.com/GT-tronics/cordova-plugin-dataexchanger.git
cd ~/projects/ionic/v4/qccdemo
ionic cordova plugin add ../../../cordova/plugins/cordova-plugin-dataexchanger
```
If you receive a zip folder of cordova-plugin-dataexchanger, you can unzip the folder to ~/projects/cordova/plugins/ instead of git clone in the above instruction.
 
## Build And Run The Apps
### iOS
Configure Xcode command line tool and install ios-deploy package, if not already done so. 
```
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
npm install -g ios-deploy
```
Now build and run the ionic ios package.
```
open ~/projects/ionic/v4/qccdemo/platforms/ios/dx-qcc-audio-demo.xcworkspace
[Update the code signing team to GT-tronics HK Ltd and quit xcode]
cd ~/projects/ionic/v4/qccdemo
ionic cordova run ios
```
### Android
```
cd ~/projects/ionic/v4/qccdemo
ionic cordova run android
```
## Ionic Info
```
onic:

   ionic (Ionic CLI)             : 4.12.0 (/Users/ming/.nvm/versions/node/v11.10.0/lib/node_modules/ionic)
   Ionic Framework               : @ionic/angular 4.3.1
   @angular-devkit/build-angular : 0.13.8
   @angular-devkit/schematics    : 7.3.8
   @angular/cli                  : 7.3.8
   @ionic/angular-toolkit        : 1.5.1

Cordova:

   cordova (Cordova CLI) : 8.1.2 (cordova-lib@8.1.1)
   Cordova Platforms     : none
   Cordova Plugins       : no whitelisted plugins (1 plugins total)

System:

   Android SDK Tools : 26.1.1 (/Users/ming/Library/Android/sdk)
   ios-deploy        : 1.9.2
   ios-sim           : 5.0.8
   NodeJS            : v11.10.0 (/Users/ming/.nvm/versions/node/v11.10.0/bin/node)
   npm               : 6.7.0
   OS                : macOS High Sierra
   Xcode             : Xcode 10.1 Build version 10B61

```




