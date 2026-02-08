const fs = require('fs');
const https = require('https');
const path = require('path');

const date = new Date().toISOString().split('T')[0];
const dir = path.join(__dirname, 'archives');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

// 1. Capture Image Sytadin
const sytadinUrl = 'https://www.sytadin.fr/courbes/indiceCumulBouchon/cumulBouchon_1.png';
const sytadinFile = fs.createWriteStream(path.join(dir, `sytadin-${date}.png`));

// 2. Capture JSON Bison Futé (Temps Réel + Courbe Complète)
const bisonTpsReelUrl = 'https://www.bison-fute.gouv.fr/api-bouchons/bouchons-tpsreel';
const bisonCourbeUrl = 'https://www.bison-fute.gouv.fr/api-bouchons/courbe_reference_par_zone?zoneAdm=1';

const fileTpsReel = path.join(dir, `bison-fute-now-${date}.json`);
const fileCourbe = path.join(dir, `bison-fute-daily-${date}.json`);

function download(url, dest, callback) {
    https.get(url, (response) => {
        if (response.statusCode !== 200) {
            console.error(`❌ Erreur ${url} : ${response.statusCode}`);
            callback(new Error(`Status ${response.statusCode}`));
            return;
        }
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
            fs.writeFileSync(dest, data);
            callback();
        });
    }).on('error', (err) => {
        console.error(`❌ Erreur réseau : ${err.message}`);
        callback(err);
    });
}

console.log(`🚀 Archivage Trafic du ${date}...`);

// Téléchargement en série
download(sytadinUrl, path.join(dir, `sytadin-${date}.png`), (err) => {
    if (!err) console.log(`✅ Image Sytadin sauvegardée.`);
    download(bisonTpsReelUrl, fileTpsReel, (err) => {
        if (!err) console.log(`✅ JSON Bison Futé (Instant T) sauvegardé.`);
        download(bisonCourbeUrl, fileCourbe, (err) => {
            if (!err) console.log(`✅ JSON Bison Futé (Courbe Journée) sauvegardé.`);
            process.exit(0);
        });
    });
});
