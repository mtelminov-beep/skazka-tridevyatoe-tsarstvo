package ru.tridevyatoe.skazki.licensing;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;
import android.provider.Settings;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.cert.Certificate;
import java.security.cert.CertificateFactory;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

public final class LicenseManager {
    private static final String APP_ID = "ru.tridevyatoe.skazki";
    private static final int FORMAT_VERSION = 1;
    private static final String PREFS = "tridevyatoe_license_v1";
    private static final String KEY = "license_json";
    // Открытый сертификат. Приватный ключ хранится только в Windows-активаторе.
    private static final String CERTIFICATE = "MIIEGTCCAoGgAwIBAgIQU5BBcYW48LBOhiAJhi6pOTANBgkqhkiG9w0BAQsFADAvMS0wKwYDVQQDDCRUcmlkZXZ5YXRvZSBUc2Fyc3R2byBMaWNlbnNlIFNpZ25pbmcwHhcNMjYwOTIwMTEzODE0WhcNMjcwOTIwMTE1ODE0WjAvMS0wKwYDVQQDDCRUcmlkZXZ5YXRvZSBUc2Fyc3R2byBMaWNlbnNlIFNpZ25pbmcwggGiMA0GCSqGSIb3DQEBAQUAA4IBjwAwggGKAoIBgQDGqcFu9cu6rs8OXH8qx/F0XtXGOxq+4cLWGuLH3HV1eT7M8LeqBLZIM1ODGxQc7YuEIgi5f+NnI0bk8k8nh3C5ksxYqQn7xI4Tt7y+olqCqqT9w/DfyXVK3YpE075RbbVT+h4Ncpc9stb8vNmiLrNBzQPnJTFQYlvfVxGDR5G1RVZfmUgxCrdrTqnyZSe0hQtI8fd9pVYcytTTFlAoPRWvWVNoCBG6afQ6vfx9Q2PcfSB9Tsw5Ia23vDIQelchT3rbwV6EhTNVLAp/OWbz9/9089lQn90dWvf4FKx81yZZ6bvi85HISEvakaW5Sv4YllJiQEWtUhWEkrtPKCaYSP/Aldia5he2WtwFp0iJhG7NlIDjEKUjUhoYB8vXOHpPocnbY1JoS+y+5bGwSFajUxSlQ1AWXhPlI3gVgjQXYagxocGpRUWETFyCUcnNlIHaJM8gzF2R+DYGRivu8uMNxzctEK/CBNynO4GMR2x2/Yr5uXhCxu66Wi+ShmRyL3RzQJkCAwEAAaMxMC8wDgYDVR0PAQH/BAQDAgeAMB0GA1UdDgQWBBTJB9jyYQCMk0FKzoo3sG5FANWADzANBgkqhkiG9w0BAQsFAAOCAYEAWpkGd/U+DLmJIsAQoh9lHXNSEfGOrbejsey8unweDbBya4Fb66Mh/dLNYJXNou/te6t+y1AnI1+x9b7d3wgIptDYBhbKIeC6QvwD0hd69knlb+eccbY4Lekjg10AjUr4mFxW9s/ap1pg82sgIj72+V7OO0A0dQpixvWOmFy1I/uoJzLpc55bCiVFfsPSxelZFg6rb28bUR4hcksqfW/5NfYKQzGtglnGGDrl62p94w7OcYh7u363EoTvro1q87SeSh0/dIDjFpokwO+XRWAWujDxVlvl75AL7YGiBs3DsI8IVWg67A1+QIIU0GjE3thmQwMlzKqV/ULXNttPRls3Y+NbnmvQwJ7U3rriFgdPovoxBncNCDSnu1TlUDg2/ywdMQ+93m7pshJfC6y7weJKDlhqi51d7PmAVAEW6FO0Ca5W9FTkxHCijC1iz4dWmDReqFzRYTbcSi6BqvGMlKdMk1XyP0KQpEUN6HbIqyxdZUMNI5ZyjG0zDe72Iycf42Y+";

    private LicenseManager() { }

    public static JSObject getStatus(Context context) {
        String stored = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null);
        try { return status(context, stored); }
        catch (LicenseException error) { return failure(context, error.reason, stored != null); }
    }

    public static JSObject activate(Context context, String raw) throws LicenseException {
        if (raw == null || raw.trim().isEmpty()) throw new LicenseException("empty_license", "Лицензия пуста.");
        status(context, raw.trim());
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, raw.trim()).apply();
        JSObject result = new JSObject();
        result.put("status", status(context, raw.trim()));
        return result;
    }

    private static JSObject status(Context context, String license) throws LicenseException {
        String device = deviceId(context);
        if (license == null || license.isEmpty()) throw new LicenseException("license_required", "Требуется активация.");
        JSONObject box;
        JSONObject payload;
        try {
            box = new JSONObject(license);
            byte[] payloadBytes = decode(box.getString("payload"));
            verify(payloadBytes, decode(box.getString("signature")));
            payload = new JSONObject(new String(payloadBytes, StandardCharsets.UTF_8));
        } catch (LicenseException error) { throw error; }
        catch (Exception error) { throw new LicenseException("invalid_license", "Не удалось прочитать лицензию."); }
        if (!APP_ID.equals(payload.optString("appId"))) throw new LicenseException("app_mismatch", "Лицензия выпущена для другого приложения.");
        if (!device.equalsIgnoreCase(payload.optString("deviceRequestId"))) throw new LicenseException("device_mismatch", "Лицензия выпущена для другого устройства.");
        if (payload.optInt("version", 0) != FORMAT_VERSION) throw new LicenseException("version_mismatch", "Неподдерживаемый формат лицензии.");
        String expires = payload.isNull("expiresAt") ? null : payload.optString("expiresAt", null);
        if (expires != null && !expires.isEmpty() && expired(expires)) throw new LicenseException("expired", "Срок действия лицензии истёк.");
        JSObject result = base(context, device);
        result.put("licensePresent", true); result.put("licenseValid", true); result.put("needsActivation", false); result.put("reason", "active");
        JSObject summary = new JSObject();
        summary.put("customer", payload.optString("customer", "Библиотека"));
        summary.put("issuedAt", payload.optString("issuedAt", ""));
        summary.put("expiresAt", expires == null ? JSONObject.NULL : expires);
        JSArray features = new JSArray(); JSONArray inputFeatures = payload.optJSONArray("features");
        if (inputFeatures != null) for (int index = 0; index < inputFeatures.length(); index++) features.put(inputFeatures.optString(index));
        summary.put("features", features); result.put("licenseSummary", summary); return result;
    }

    private static JSObject failure(Context context, String reason, boolean present) {
        JSObject result = base(context, deviceId(context));
        result.put("licensePresent", present); result.put("licenseValid", false); result.put("needsActivation", true); result.put("reason", reason); result.put("licenseSummary", JSONObject.NULL); return result;
    }

    private static JSObject base(Context context, String device) {
        JSObject result = new JSObject(); result.put("platform", "android"); result.put("appId", APP_ID); result.put("packageName", context.getPackageName());
        result.put("manufacturer", Build.MANUFACTURER == null ? "Android" : Build.MANUFACTURER); result.put("model", Build.MODEL == null ? "Устройство" : Build.MODEL);
        result.put("deviceRequestId", device); result.put("requestCode", device.replaceAll("(.{5})(?!$)", "$1-")); return result;
    }

    private static void verify(byte[] payload, byte[] signature) throws LicenseException {
        try {
            Certificate certificate = CertificateFactory.getInstance("X.509").generateCertificate(new ByteArrayInputStream(Base64.decode(CERTIFICATE, Base64.DEFAULT)));
            PublicKey key = certificate.getPublicKey(); java.security.Signature verifier = java.security.Signature.getInstance("SHA256withRSA");
            verifier.initVerify(key); verifier.update(payload);
            if (!verifier.verify(signature)) throw new LicenseException("invalid_signature", "Подпись лицензии не прошла проверку.");
        } catch (LicenseException error) { throw error; }
        catch (Exception error) { throw new LicenseException("verification_error", "Не удалось проверить подпись лицензии."); }
    }

    private static String deviceId(Context context) {
        String androidId = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID); if (androidId == null) androidId = "unknown";
        return sha256(androidId + "|" + context.getPackageName() + "|" + signingCertificate(context) + "|" + lower(Build.MANUFACTURER) + "|" + lower(Build.MODEL));
    }

    private static String signingCertificate(Context context) {
        try {
            PackageInfo info = context.getPackageManager().getPackageInfo(context.getPackageName(), PackageManager.GET_SIGNING_CERTIFICATES);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && info.signingInfo != null) { Signature[] signatures = info.signingInfo.getApkContentsSigners(); if (signatures.length > 0) return sha256(signatures[0].toByteArray()); }
        } catch (Exception ignored) { }
        return "UNKNOWN";
    }

    private static boolean expired(String date) throws LicenseException {
        try { SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSSSSSXXX", Locale.ROOT); format.setTimeZone(TimeZone.getTimeZone("UTC")); Date expires = format.parse(date); return expires != null && new Date().after(expires); }
        catch (Exception error) { throw new LicenseException("invalid_expiry", "Некорректная дата окончания лицензии."); }
    }
    private static byte[] decode(String value) { String normalized = value.replace('-', '+').replace('_', '/'); int remainder = normalized.length() % 4; if (remainder == 2) normalized += "=="; else if (remainder == 3) normalized += "="; return Base64.decode(normalized, Base64.DEFAULT); }
    private static String sha256(String source) { return sha256(source.getBytes(StandardCharsets.UTF_8)); }
    private static String sha256(byte[] source) { try { byte[] bytes = MessageDigest.getInstance("SHA-256").digest(source); StringBuilder output = new StringBuilder(); for (byte value : bytes) output.append(String.format(Locale.ROOT, "%02X", value)); return output.toString(); } catch (Exception error) { throw new IllegalStateException(error); } }
    private static String lower(String value) { return value == null ? "unknown" : value.trim().toLowerCase(Locale.ROOT); }

    public static final class LicenseException extends Exception { final String reason; LicenseException(String reason, String message) { super(message); this.reason = reason; } }
}
