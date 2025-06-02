This is a new React Native project, bootstrapped using [@react-native-community/cli](https://github.com/react-native-community/cli).
 
 # hahai-project

⚠️ **Note:** Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run Metro, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```bash
# Using npm
npm start

# OR using Yarn
yarn start
````

## Step 2: Build and run your app
With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android
```bash
# Using npm
npm run android

# OR using Yarn
yarn android
````
### iOS
For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```bash
bundle install
````

Then, and every time you update your native dependencies, run:

```bash
bundle exec pod install
````

For more information, please visit CocoaPods [Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).
```bash
# Using npm
npm run ios

# OR using Yarn
yarn ios
````

## Step 3: Modify your app
Your app is now running — let’s make some changes!

Open the `App.tsx` file in your favorite code editor and update some text or layout. When you save the file, the app will update automatically on your device or simulator. This feature is called Fast Refresh — it lets you see changes instantly without restarting the app.

Need to reload the whole app (for example, to reset the state)? Here’s how:

- **Android:**
  - Press `R` twice quickly, or
  - Open the developer menu with `Ctrl + M` (Windows/Linux) or `Cmd + M` (macOS), then tap **Reload**.

- **iOS:**
  - Press `R` in the iOS Simulator.

