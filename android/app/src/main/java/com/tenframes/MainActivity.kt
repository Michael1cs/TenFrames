package com.tenframes

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

class MainActivity : ReactActivity() {

  /**
   * Required by react-native-screens, and missing since the Android port.
   *
   * Android saves the fragment back stack, then rebuilds each fragment by
   * reflection on an Activity relaunch. ScreenStackFragment has no no-arg
   * constructor, so restoration threw InstantiationException and the app died
   * before its first frame:
   *
   *   FragmentManager.restoreSaveStateInternal -> FragmentState.instantiate
   *   -> Fragment.instantiate -> InstantiationException: ScreenStackFragment
   *
   * Reproduced on an Android 16 emulator by changing the display density, which
   * is not in this Activity's configChanges list. The same relaunch path runs
   * when the user changes Display size or Font size in Settings, and when
   * Android restores the app after killing it for memory — the common case for
   * a child who leaves the app and comes back.
   *
   * The factory knows how to construct the fragment, so state is restored
   * rather than discarded.
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    super.onCreate(savedInstanceState)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "TenFrames"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
