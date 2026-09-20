package ru.tridevyatoe.skazki;

import com.getcapacitor.BridgeActivity;
import ru.tridevyatoe.skazki.licensing.TridevyatoeLicensePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(TridevyatoeLicensePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
