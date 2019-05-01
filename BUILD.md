# Install HomeSpot App Source Package
## Clone homespot-ionic-v4 respository
```
cd ~/projects/ionic/v4/
git clone https://github.com/GT-tronics/homespot-ionic-v4.git homespot
cd ~/projects/ionic/v4/homespot/
git submodule init
git submodule update --remote
```
## Install iOS and android platforms
```
cd ~/projects/ionic/v4/homespot/
ionic cordova platform add ios
ionic cordova platform add android
```
## Make Some Patches
### CDVPLuginResult
This patch allows the the nested NSDictionary object which contains NSData be able to convert JSON string probably. 
```
cd ~/projects/ionic/v4/homespot/
cp ./patches/ios/CDVPluginResult/* ./platforms/ios/CordovaLib/Classes/Public
```
### Android Support V4
The DataExchanger cordova plugin requires this library
```
code ~/projects/ionic/v4/homespot/platforms/android/app/build.gradle
```
Use VS Code or any other text editor to add the line **implementation 'com.android.support:support-v4:+'** in the dependency section
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
git clone https://github.com/GT-tronics/cordova-plugin-dataexchanger-fork.git
cd ~/projects/ionic/v4/homespot
ionic cordova plugin add ../../../cordova/plugins/cordova-plugin-dataexchanger-fork
```
## Build And Run The Apps
### iOS
Configure Xcode command line tool and install ios-deploy package, if not already done so. 
```
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
npm install -g ios-deploy
```
Now build and run the ionic ios package.
```
open ~/projects/ionic/v4/homespot/platforms/ios/homespot.xcworkspace
[Update the code signing team to GT-tronics HK Ltd and quit xcode]
cd ~/projects/ionic/v4/homespot
ionic cordova run ios
```
### Android
```
cd ~/projects/ionic/v4/homespot
ionic cordova run android
```
## Ionic Info
```
Ionic:

   ionic (Ionic CLI)             : 4.10.3 (/Users/ming/.nvm/versions/node/v11.10.0/lib/node_modules/ionic)
   Ionic Framework               : @ionic/angular 4.0.2
   @angular-devkit/build-angular : 0.12.4
   @angular-devkit/schematics    : 7.2.4
   @angular/cli                  : 7.2.4
   @ionic/angular-toolkit        : 1.4.0

Cordova:

   cordova (Cordova CLI) : 8.1.2 (cordova-lib@8.1.1)
   Cordova Platforms     : android 7.1.4, ios 4.5.5
   Cordova Plugins       : cordova-plugin-ionic-keyboard 2.1.3, cordova-plugin-ionic-webview 3.1.2, (and 6 other plugins)

System:

   Android SDK Tools : 26.1.1 (/Users/ming/Library/Android/sdk)
   ios-deploy        : 1.9.2
   ios-sim           : 5.0.8
   NodeJS            : v11.10.0 (/Users/ming/.nvm/versions/node/v11.10.0/bin/node)
   npm               : 6.7.0
   OS                : macOS High Sierra
   Xcode             : Xcode 10.1 Build version 10B61
```




