// Adds the app's own small native plugin (saving files to Downloads / Pictures and sharing them)
// to the generated Android project and registers it in MainActivity.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
const dir = 'android/app/src/main/java/app/portals/live';
mkdirSync(dir, { recursive: true });
copyFileSync('native/PortalFilesPlugin.java', `${dir}/PortalFilesPlugin.java`);
writeFileSync(`${dir}/MainActivity.java`, `package app.portals.live;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PortalFilesPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`);
console.log('Added PortalFilesPlugin');
