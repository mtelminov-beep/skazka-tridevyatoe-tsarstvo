package ru.tridevyatoe.skazki.licensing;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TridevyatoeLicense")
public class TridevyatoeLicensePlugin extends Plugin {
    @PluginMethod
    public void getStatus(PluginCall call) { call.resolve(LicenseManager.getStatus(getContext())); }

    @PluginMethod
    public void activate(PluginCall call) {
        try {
            call.resolve(LicenseManager.activate(getContext(), call.getString("license")));
        } catch (LicenseManager.LicenseException exception) {
            call.reject(exception.getMessage(), exception.reason);
        }
    }
}
