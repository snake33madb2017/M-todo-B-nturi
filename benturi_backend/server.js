require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./database');
const redsys = require('./redsys');
const webpush = require('web-push');
const fetch = require('node-fetch');
const bcrypt = require('bcrypt');

// Configuración de web-push (usar llaves de process.env en prod)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BEUPFhphS_YDpLxWb18rsXx7L4aRrS2uAmlz5enpF0rHHJamSWq3G9cRy1sLAN3w186Egtavgp85cmiIGFkFTYw';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'd8gCEsYMFjQrDrG4Ju4yCfLXMRiT6dQcKgZpusAT9iE';
webpush.setVapidDetails(
  'mailto:contacto@metodobenturi.com',
  vapidPublicKey,
  vapidPrivateKey
);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'benturi_super_secret_key_2026';

// El frontend PWA suele correr en el puerto 5173 o 5174 localmente
app.use(cors());

// Middleware para parsear JSON (para login/registro)
// PERO para el Webhook de Redsys necesitamos urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- AUTHENTICATION ENDPOINTS ---

app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'El email ya existe' });
                return res.status(500).json({ error: 'Error del servidor' });
            }
            
            const token = jwt.sign({ id: this.lastID, email, isPremium: false, role: 'user' }, JWT_SECRET);
            res.json({ token, user: { id: this.lastID, email, isPremium: false, role: 'user' } });
        });
    } catch (err) {
        return res.status(500).json({ error: 'Error encriptando contraseña' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
        
        const isBcrypt = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
        let isValid = false;

        if (isBcrypt) {
            isValid = await bcrypt.compare(password, user.password);
        } else {
            isValid = (password === user.password);
            if (isValid) {
                const newHash = await bcrypt.hash(password, 10);
                db.run('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
            }
        }
        
        if (!isValid) return res.status(401).json({ error: 'Credenciales inválidas' });
        
        const token = jwt.sign({ id: user.id, email: user.email, isPremium: user.isPremium, role: user.role }, JWT_SECRET);
        res.json({ token, user: { id: user.id, email: user.email, isPremium: user.isPremium, role: user.role } });
    });
});

// Middleware para proteger rutas
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.get('/api/me', authenticateToken, (req, res) => {
    db.get('SELECT id, email, isPremium, role FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err || !user) return res.sendStatus(404);
        res.json(user);
    });
});

// --- ADMIN ENDPOINTS ---

function requireAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    }
}

app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    db.all('SELECT id, email, isPremium, role, createdAt FROM users ORDER BY createdAt DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error obteniendo usuarios' });
        res.json(rows);
    });
});

app.post('/api/admin/users/:id/toggle-premium', authenticateToken, requireAdmin, (req, res) => {
    const userId = req.params.id;
    const { isPremium } = req.body;
    db.run('UPDATE users SET isPremium = ? WHERE id = ?', [isPremium ? 1 : 0, userId], function(err) {
        if (err) return res.status(500).json({ error: 'Error actualizando usuario' });
        res.json({ success: true });
    });
});

// --- AI AND PUSH ENDPOINTS ---

app.post('/api/generate-vision', authenticateToken, async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Texto requerido' });

    const textPrompt = `Eres la IA Cuántica del Método Bénturi. Dirígete al usuario en un tono muy motivador y profundo. Analiza esta visión de futuro y dime que está cerca de manifestarse: ${text.trim()}`;
    const textUrl = `https://text.pollinations.ai/prompt/${encodeURIComponent(textPrompt)}`;
    
    // Generar prompt de imagen
    const imagePrompt = `Una imagen realista y cinematográfica del siguiente escenario: ${text.trim()}`;
    const rawImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=1024&nologo=true&model=flux`;
    const imageUrl = `https://wsrv.nl/?url=${encodeURIComponent(rawImageUrl)}`;

    try {
        const response = await fetch(textUrl);
        const report = await response.text();
        res.json({ report, imageUrl });
    } catch (err) {
        console.error('Error llamando a IA:', err);
        res.status(500).json({ error: 'Error procesando la visión cuántica' });
    }
});

app.post('/api/push/subscribe', authenticateToken, (req, res) => {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) return res.status(400).json({ error: 'Suscripción inválida' });

    const keysStr = JSON.stringify(subscription.keys || {});
    db.run('INSERT INTO push_subscriptions (userId, endpoint, keys) VALUES (?, ?, ?)', 
        [req.user.id, subscription.endpoint, keysStr], 
        (err) => {
            if (err) {
                console.error("Error guardando suscripción:", err);
                return res.status(500).json({ error: 'Error del servidor' });
            }
            res.status(201).json({ success: true });
        }
    );
});

app.post('/api/push/send', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const payload = JSON.stringify({
        title: 'Método Bénturi',
        body: 'Conecta con tu imagen cuántica. Es tu momento.',
        url: '/'
    });

    db.all('SELECT * FROM push_subscriptions WHERE userId = ?', [userId], (err, rows) => {
        if (err || rows.length === 0) return res.status(404).json({ error: 'Suscripción no encontrada' });
        
        let sent = 0;
        rows.forEach(row => {
            const sub = {
                endpoint: row.endpoint,
                keys: JSON.parse(row.keys)
            };
            webpush.sendNotification(sub, payload).catch(e => console.error("Error enviando push", e));
            sent++;
        });
        res.json({ success: true, count: sent });
    });
});

// --- REDSYS ENDPOINTS ---

app.post('/api/create-payment', authenticateToken, (req, res) => {
    // 1. Generar un OrderID único (Redsys requiere que los primeros 4 dígitos sean números y en total máx 12)
    // Para simplificar: Fecha compactada + ID usuario
    const dateStr = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(2, 10); // formato YYMMDDHH
    const orderId = `${dateStr}${req.user.id}`.padEnd(10, '0').slice(0, 12);
    
    const amount = 999; // 9,99 €
    
    // IMPORTANTE: En desarrollo local (localhost), Redsys NO puede alcanzar tu Webhook.
    // Usarías ngrok para exponer tu localhost.
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

    const merchantUrl = `${baseUrl}/api/redsys-webhook`;
    const urlOK = `${frontendUrl}/?pago=ok`;
    const urlKO = `${frontendUrl}/?pago=ko`;

    const paymentData = redsys.createPaymentRequest(amount, orderId, merchantUrl, urlOK, urlKO);
    
    // Guardar el orderId en BD temporalmente si queremos trazarlo (simplificado aquí)
    
    res.json({
        url: 'https://sis-t.redsys.es:25443/sis/realizarPago', // URL de PRUEBAS
        params: paymentData
    });
});

// WEBHOOK DE REDSYS (Notificación Online)
app.post('/api/redsys-webhook', (req, res) => {
    console.log("=== NOTIFICACION WEBHOOK REDSYS ===");
    const dsSignatureVersion = req.body.Ds_SignatureVersion;
    const dsMerchantParameters = req.body.Ds_MerchantParameters;
    const dsSignature = req.body.Ds_Signature;

    if (!dsMerchantParameters || !dsSignature) {
        console.error("Faltan parámetros de Redsys");
        return res.status(400).send("Bad Request");
    }

    const isValid = redsys.validateWebhookSignature(dsMerchantParameters, dsSignature);
    
    if (isValid) {
        // Decodificar Base64 para leer si fue un éxito
        const decodedParams = Buffer.from(dsMerchantParameters, 'base64').toString('utf8');
        const paramsJson = JSON.parse(decodedParams);
        
        console.log("Pago válido recibido:", paramsJson);
        
        const responseCode = parseInt(paramsJson.Ds_Response || paramsJson.DS_RESPONSE);
        
        // Response 0000 a 0099 es éxito
        if (responseCode >= 0 && responseCode <= 99) {
            const orderId = paramsJson.Ds_Order || paramsJson.DS_ORDER;
            const cofIdentifier = paramsJson.Ds_Merchant_Cof_Txnid || paramsJson.DS_MERCHANT_COF_TXNID; // Para próximos cobros
            
            // Extraer el ID de usuario del Order ID (como lo generamos antes: primeros 8 chars son fecha, resto ID)
            const userIdStr = orderId.substring(8);
            const userId = parseInt(userIdStr);
            
            if (userId) {
                // Actualizar usuario a Premium
                db.run('UPDATE users SET isPremium = 1, redsysReference = ? WHERE id = ?', [cofIdentifier, userId], (err) => {
                    if (err) console.error("Error actualizando DB", err);
                    else console.log(`Usuario ${userId} es ahora PREMIUM. Referencia: ${cofIdentifier}`);
                });
            }
        } else {
            console.error(`Pago denegado. Código de respuesta: ${responseCode}`);
        }
        
        res.status(200).send("OK");
    } else {
        console.error("Firma de Webhook INVÁLIDA. Posible fraude.");
        res.status(400).send("Firma Invalida");
    }
});

const { GoogleGenerativeAI } = require("@google/generative-ai");
const PDFDocument = require("pdfkit");
const fs = require('fs');
const path = require('path');

app.post('/api/generate-report', async (req, res) => {
    try {
        const { question, result } = req.body;
        
        const apiKey = process.env.GEMINI_API_KEY || "PEGA_AQUI_TU_API_KEY_DE_GEMINI";
        if (apiKey === "PEGA_AQUI_TU_API_KEY_DE_GEMINI") {
            console.warn("Falta GEMINI_API_KEY en .env");
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const promptFile = path.join(__dirname, 'prompt_generacion.txt');
        const systemPrompt = fs.readFileSync(promptFile, 'utf8');
        
        // Leer base de conocimientos
        const kbPath = path.join(__dirname, 'base_conocimiento_cartas.json');
        let kb = { significado_cartas: [], combinaciones: [] };
        try {
            kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
        } catch (e) {
            console.error("No se pudo leer base_conocimiento_cartas.json", e);
        }

        let contextText = "";
        let combinacionesEncontradas = [];
        
        const normalizeCard = (name) => name ? name.toLowerCase().replace(/ de /g, ' ').trim() : '';
        
        const getCardInfo = (cardName) => {
            const norm = normalizeCard(cardName);
            const found = kb.significado_cartas?.find(c => normalizeCard(c.carta) === norm);
            return found ? `${found.acepcion_principal} | Matices: ${found.acepciones_secundarias}` : "Sin información extra";
        };

        const checkCombo = (c1, c2) => {
            if (!c1 || !c2) return;
            const match = kb.combinaciones?.find(c => {
                const parts = c.combinacion.toLowerCase().split('+').map(p => p.trim().replace('.', ''));
                if (parts.length >= 2) {
                   const p1 = normalizeCard(parts[0]);
                   const p2 = normalizeCard(parts[1]);
                   const n1 = normalizeCard(c1);
                   const n2 = normalizeCard(c2);
                   return (p1 === n1 && p2 === n2) || (p1 === n2 && p2 === n1);
                }
                return false;
            });
            if (match) {
                combinacionesEncontradas.push(`- **Combinación ${c1} + ${c2}:** ${match.significado}`);
            }
        };

        let vectoresArray = [];
        if (result.q1) {
            // Matriz 24
            vectoresArray = [
                { posicion: "Cuadrante 1: Origen y Causa Subyacente", significado: result.q1 },
                { posicion: "Cuadrante 2: Fricción y Resistencia", significado: result.q2 },
                { posicion: "Cuadrante 3: Puntos de Inflexión y Acción", significado: result.q3 },
                { posicion: "Cuadrante 4: Proyección y Desenlace", significado: result.q4 }
            ];
            contextText = `TIPO DE MATRIZ: Matriz Express de 24 Vectores\nPREGUNTA DEL USUARIO: ${question}\n\nDATOS EXTRAÍDOS (Resumen por Cuadrantes):\n${JSON.stringify(vectoresArray, null, 2)}`;
        } else {
            // Matriz 6
            vectoresArray = [
                { posicion: "Situación Inicial", cartas: `${result.c1}, ${result.c2}`, info_c1: getCardInfo(result.c1), info_c2: getCardInfo(result.c2) },
                { posicion: "Desarrollo", cartas: `${result.c3}, ${result.c4}`, info_c3: getCardInfo(result.c3), info_c4: getCardInfo(result.c4) },
                { posicion: "Desenlace", cartas: `${result.c5}, ${result.c6}`, info_c5: getCardInfo(result.c5), info_c6: getCardInfo(result.c6) }
            ];
            checkCombo(result.c1, result.c2);
            checkCombo(result.c3, result.c4);
            checkCombo(result.c5, result.c6);
            
            contextText = `TIPO DE MATRIZ: Matriz de 6 Vectores\nPREGUNTA DEL USUARIO: ${question}\n\nVECTORES BASE:\n${JSON.stringify(vectoresArray, null, 2)}\n\n`;
            if (combinacionesEncontradas.length > 0) {
                contextText += `MATRIZ DE COMBINACIONES DETECTADAS:\n${combinacionesEncontradas.join('\n')}\n\n`;
            } else {
                contextText += `MATRIZ DE COMBINACIONES DETECTADAS: Ninguna combinación exacta registrada.\n\n`;
            }
        }

        let text = "";
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", systemInstruction: systemPrompt });
        let retries = 3;
        while (retries > 0) {
            try {
                const aiResponse = await model.generateContent(contextText);
                text = aiResponse.response.text();
                break;
            } catch (e) {
                console.error(`Error contactando con Gemini API. Reintentos restantes: ${retries - 1}`, e);
                retries--;
                if (retries === 0) {
                    text = "# INFORME DE PROYECCIÓN DE FUTURO Y MATRIZ VECTORIAL\n\nHubo un error de conexión persistente con la IA cuántica. Por favor, inténtalo de nuevo más tarde.";
                } else {
                    await new Promise(resolve => setTimeout(resolve, 2000 * (4 - retries)));
                }
            }
        }
        
        res.json({ report: text });

    } catch (error) {
        console.error("Error generando reporte:", error);
        res.status(500).json({ error: "Error generando informe cuántico" });
    }
});

// Servir la aplicación React (PWA) estática
app.use(express.static(path.join(__dirname, '../benturi_pwa/dist')));

// Ruta comodín para que el enrutamiento de React funcione correctamente
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../benturi_pwa/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Backend de Bénturi ejecutándose en el puerto ${PORT}`);
});
