const crypto = require('crypto');

// Datos de pruebas (Sandbox) de Redsys. En producción usar las reales.
// Estos datos son del entorno de TEST estándar de Redsys.
const FUC = process.env.REDSYS_FUC || '999008881'; 
const TERMINAL = process.env.REDSYS_TERMINAL || '1';
const SECRET_KEY = process.env.REDSYS_SECRET_KEY || 'sq7HjrUOBfKmC576ILgskD5srU870gJ7';

// 1. Decodificar la clave secreta Base64
function getBase64DecodedSecret() {
    return Buffer.from(SECRET_KEY, 'base64');
}

// 2. Generar clave derivada específica para la transacción (3DES)
// El order (Número de pedido) debe tener 12 o menos caracteres alfanuméricos.
function encrypt3DES(str, key) {
    const cipher = crypto.createCipheriv('des-ede3-cbc', key, Buffer.alloc(8, 0));
    cipher.setAutoPadding(false);
    
    // Rellenar con ceros hasta múltiplo de 8
    let buffer = Buffer.from(str, 'utf8');
    const padding = 8 - (buffer.length % 8);
    if (padding !== 8) {
        const padBuffer = Buffer.alloc(padding, 0);
        buffer = Buffer.concat([buffer, padBuffer]);
    }

    let encrypted = cipher.update(buffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted;
}

function deriveKey(order) {
    const decodedSecret = getBase64DecodedSecret();
    return encrypt3DES(order, decodedSecret);
}

// 3. Crear firma HMAC SHA256
function signHmac256(data, key) {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(data);
    return hmac.digest('base64');
}

// Codificar parámetros en Base64
function encodeBase64(jsonObj) {
    return Buffer.from(JSON.stringify(jsonObj)).toString('base64');
}

// Crear los datos para enviar a Redsys (Formulario de pago)
function createPaymentRequest(amount, orderId, merchantUrl, urlOK, urlKO) {
    // Parámetros obligatorios de Redsys
    const params = {
        DS_MERCHANT_AMOUNT: amount.toString(), // en céntimos (999 para 9,99€)
        DS_MERCHANT_ORDER: orderId.toString(),
        DS_MERCHANT_MERCHANTCODE: FUC,
        DS_MERCHANT_CURRENCY: '978', // Euros
        DS_MERCHANT_TRANSACTIONTYPE: '0', // 0 = Autorización
        DS_MERCHANT_TERMINAL: TERMINAL,
        DS_MERCHANT_MERCHANTURL: merchantUrl, // Webhook de nuestro backend
        DS_MERCHANT_URLOK: urlOK, // A dónde redirige si va bien
        DS_MERCHANT_URLKO: urlKO, // A dónde redirige si falla
        // COF (Credential on File): Necesario para cobrar suscripciones recurrentes luego
        DS_MERCHANT_COF_INI: 'S', // S = Indica que es la primera transacción de una suscripción
        DS_MERCHANT_COF_TYPE: 'R', // R = Recurrente
    };

    const dsMerchantParameters = encodeBase64(params);
    const derivedKey = deriveKey(orderId.toString());
    const signature = signHmac256(dsMerchantParameters, derivedKey);

    return {
        Ds_SignatureVersion: 'HMAC_SHA256_V1',
        Ds_MerchantParameters: dsMerchantParameters,
        Ds_Signature: signature
    };
}

// Validar la firma que devuelve Redsys en el Webhook (Notificación Online)
function validateWebhookSignature(dsMerchantParameters, signatureReceived) {
    // 1. Decodificar Base64 de los parámetros recibidos para obtener el OrderId
    const decodedParams = Buffer.from(dsMerchantParameters, 'base64').toString('utf8');
    const paramsJson = JSON.parse(decodedParams);
    
    // Atención: Redsys devuelve algunos parámetros con mayúsculas y minúsculas diferentes a veces
    const orderId = paramsJson.Ds_Order || paramsJson.DS_ORDER;
    
    if (!orderId) return false;

    // 2. Derivar la clave
    const derivedKey = deriveKey(orderId.toString());
    
    // 3. Generar la firma esperada usando HMAC SHA256 sobre los parámetros originales recibidos en Base64
    const expectedSignature = signHmac256(dsMerchantParameters, derivedKey);
    
    // En el webhook, Redsys codifica la firma en Base64Url (cambia + por -, / por _ y quita =)
    const base64UrlSignature = expectedSignature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    return base64UrlSignature === signatureReceived;
}

module.exports = {
    createPaymentRequest,
    validateWebhookSignature,
    FUC,
    TERMINAL
};
