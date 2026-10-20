package com.qder.calendar;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.provider.AlarmClock;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * N-sys-alarm: open the system clock with ACTION_SET_ALARM prefilled.
 * Never uses EXTRA_SKIP_UI — user must confirm in the clock app.
 * Does not mute or replace LocalNotifications.
 */
@CapacitorPlugin(name = "SystemAlarm")
public class SystemAlarmPlugin extends Plugin {

    @PluginMethod
    public void setAlarm(PluginCall call) {
        Integer hour = call.getInt("hour");
        Integer minutes = call.getInt("minutes");
        String message = call.getString("message", "");

        if (hour == null || minutes == null) {
            call.reject("hour 与 minutes 必填");
            return;
        }
        if (hour < 0 || hour > 23 || minutes < 0 || minutes > 59) {
            call.reject("非法时刻: " + hour + ":" + minutes);
            return;
        }

        Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM)
            .putExtra(AlarmClock.EXTRA_HOUR, hour.intValue())
            .putExtra(AlarmClock.EXTRA_MINUTES, minutes.intValue())
            .putExtra(AlarmClock.EXTRA_MESSAGE, message == null ? "" : message)
            .putExtra(AlarmClock.EXTRA_SKIP_UI, false);

        PackageManager pm = getContext().getPackageManager();
        if (intent.resolveActivity(pm) == null) {
            call.reject("未找到系统时钟/闹钟应用");
            return;
        }

        getActivity().startActivity(intent);
        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }
}
