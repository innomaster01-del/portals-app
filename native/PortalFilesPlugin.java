package app.portals.live;

import android.content.ClipData;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Saves a file where people can find it (Downloads/Portal X or Pictures/Portal X, through MediaStore,
 * no storage permission needed on Android 10+) and opens the Android share sheet for it.
 * The data arrives from the web side in base64 pieces, so big files never cross the bridge at once.
 */
@CapacitorPlugin(name = "PortalFiles")
public class PortalFilesPlugin extends Plugin {
    private final Map<String, OutputStream> open = new HashMap<>();

    @PluginMethod
    public void begin(PluginCall call) {
        if (Build.VERSION.SDK_INT < 29) { call.reject("Android 10 or newer is needed"); return; }
        try {
            String name = call.getString("name", "file");
            String mime = call.getString("mime", "application/octet-stream");
            boolean pictures = "pictures".equals(call.getString("where", "downloads"));
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
            v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
            v.put(MediaStore.MediaColumns.RELATIVE_PATH, (pictures ? Environment.DIRECTORY_PICTURES : Environment.DIRECTORY_DOWNLOADS) + "/Portal X");
            v.put(MediaStore.MediaColumns.IS_PENDING, 1);
            Uri collection = pictures
                ? MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                : MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
            Uri uri = getContext().getContentResolver().insert(collection, v);
            if (uri == null) { call.reject("Could not create the file"); return; }
            OutputStream os = getContext().getContentResolver().openOutputStream(uri, "w");
            if (os == null) { call.reject("Could not open the file"); return; }
            open.put(uri.toString(), os);
            JSObject r = new JSObject();
            r.put("uri", uri.toString());
            call.resolve(r);
        } catch (Exception e) {
            call.reject("begin: " + e.getMessage());
        }
    }

    @PluginMethod
    public void append(PluginCall call) {
        try {
            OutputStream os = open.get(call.getString("uri", ""));
            if (os == null) { call.reject("The file is not open"); return; }
            os.write(Base64.decode(call.getString("data", ""), Base64.DEFAULT));
            call.resolve();
        } catch (Exception e) {
            call.reject("append: " + e.getMessage());
        }
    }

    @PluginMethod
    public void finish(PluginCall call) {
        try {
            String key = call.getString("uri", "");
            OutputStream os = open.remove(key);
            if (os != null) os.close();
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.IS_PENDING, 0);
            getContext().getContentResolver().update(Uri.parse(key), v, null, null);
            call.resolve();
        } catch (Exception e) {
            call.reject("finish: " + e.getMessage());
        }
    }

    @PluginMethod
    public void share(PluginCall call) {
        try {
            Uri uri = Uri.parse(call.getString("uri", ""));
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType(call.getString("mime", "*/*"));
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.setClipData(ClipData.newRawUri("", uri));
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(send, call.getString("title", "Share"));
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(chooser);
            call.resolve();
        } catch (Exception e) {
            call.reject("share: " + e.getMessage());
        }
    }
}
