package com.grandcentralbakery

import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider
import okhttp3.ConnectionSpec
import okhttp3.OkHttpClient
import okhttp3.TlsVersion
import java.util.concurrent.TimeUnit

/**
 * Custom OkHttpClientFactory that explicitly enables TLS 1.2 and TLS 1.3.
 * Fixes "Network Error" on Android 12/13 caused by TLS negotiation failures
 * with certain server SSL configurations.
 */
class TLSOkHttpClientFactory : OkHttpClientFactory {
    override fun createNewNetworkModuleClient(): OkHttpClient {
        val tlsSpec = ConnectionSpec.Builder(ConnectionSpec.MODERN_TLS)
            .tlsVersions(TlsVersion.TLS_1_3, TlsVersion.TLS_1_2)
            .build()

        return OkHttpClientProvider.createClientBuilder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .connectionSpecs(listOf(tlsSpec, ConnectionSpec.CLEARTEXT))
            .build()
    }
}
