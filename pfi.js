/**
 * Programme de serveur Web bla bla bla
 * par Alain Pilon
 * 23 mai 2023
 */
const http = require('http');
const path = require('path');
const fs = require('fs');
const url= require('url');
const liste_usagers = require('./liste_usagers');
const PORT = process.env.PORT || 8000;

http.createServer((requete, reponse)=>{
    // afficher la page Web demandée???
    if (requete.url.substring(0, 17) === '/traite_form.html') {
        traiterFormulaire(requete, reponse);
    } else {
        if (requete.url === '/') {
            let nomFichier = path.join(__dirname, 'pagesWeb', 'index.html');
            fournirPagesWeb(nomFichier, reponse, null);
        } else if (requete.url === '/login.html' || requete.url === '/login_get.html') {
            let nomFichier = path.join(__dirname, 'pagesWeb', requete.url);
            fournirPagesWeb(nomFichier, reponse, null);
        } else {
            envoyerErreur(reponse, "");
        }
        console.log(requete.url);
    }
}).listen(PORT, ()=>console.log('Le service Web pour pfi est démarré sur le port=', PORT));

/**
 * Fonction pour traiter les formulaires afin de récupérer les paramètres reçus de la
 * page Web (pour les GET et les POST) ensuite on appelle la même fonction de traitement
 * 
 * @param {*} requete : paramètres reçus du navigateur
 * @param {*} reponse : paramètres pour construire la réponse à envoyer au navigateur
 */
function traiterFormulaire(requete, reponse) {
    let params;
    if (requete.method === 'GET' ) {
        params = new url.URLSearchParams(requete.url.substring(18));
        traiteRequete(requete, reponse, params);
    } else {
        let postDATA = "";
        requete.on('data', (donnee)=>{ postDATA += donnee});
        requete.on('end', ()=>{
            params = new url.URLSearchParams(postDATA);
            traiteRequete(requete, reponse, params);
        });
    }
}

/**
 * Cette fonction valide l'utilisateur et son mot de passe
 * et fournit une page Web en fonction de l'accès autoriser pour cet utilisateur
 * @param {*} requete : paramètres reçus du navigateur
 * @param {*} reponse : paramètres pour construire la réponse à envoyer au navigateur
 * @param {*} params : les valeurs reçues de la page d'authentification (du formulaire)
 */
function traiteRequete(requete, reponse, params) {
    const login_form = params.get('login');
    const pwd_form = params.get('pwd');
    // reponse.write('ton login est:'+login+ ' pwd='+pwd);
    // console.log(liste_usagers);
    let trouve = liste_usagers.find(usager=>usager.login===login_form);
    if (trouve) {
        // console.log(trouve);
        let nomFichier;
        if (trouve.pwd === pwd_form) {
            if (trouve.acces === 'normal') {
                nomFichier = path.join(__dirname, 'pagesWeb', 'pageUsager.html');
            } else if (trouve.acces === 'admin') {
                nomFichier = path.join(__dirname, 'pagesWeb', 'pageAdmin.html');
            } else {
                nomFichier = path.join(__dirname, 'pagesWeb', 'pageRestreinte.html');
            }
            fournirPagesWeb(nomFichier, reponse, trouve);
        } else {
            envoyerErreur(reponse, "Mot de passe invalide"); 
        }
    } else {
        envoyerErreur(reponse, "Login invalide");
    }
}

/**
 * Cette fonction est appelée pour afficher une page d'erreur de type 401
 * @param {*} reponse : paramètres pour construire la réponse à envoyer au navigateur
 * @param {*} message : message à afficher dans la page Web résultante
 */
function envoyerErreur( reponse, message ) {
    reponse.writeHead(401, { 'Content-Type': 'text/html'});
    reponse.write('<h1>Page non autoris&eacute;e</h1>\n');
    reponse.write(`<h2>${message}</h2>`);
    reponse.end(); 
}

/**
 * Affiche une page Web dans le navigateur...
 * 
 * @param {*} fileName : nom de la page Web à afficher
 * @param {*} reponse : paramètres pour construire la réponse à envoyer au navigateur
 * @param {*} usagerTrouve : soit null ou encore l'objet correspondant à l'usager trouvé
 */
function fournirPagesWeb(fileName, reponse, usagerTrouve) {
    console.log('La page Web a afficher est:', fileName);
    let typeFichier = path.extname(fileName);
    let typeContenu = 'text/html';
    switch(typeFichier) {
        case '.js': 
            typeContenu = 'text/javascript';
            break;
        case '.css':
            typeContenu = 'text/css';
            break;
        case '.png':
            typeContenu = 'image/png';
            break;
        case '.jpg':
            typeContenu = 'image/jpg';
            break;
        case '.gif':
            typeContenu = 'image/gif';
            break;
        case '.json':
            typeContenu = 'application/json';
            break;
    }
    fs.readFile( fileName, 'utf-8', (err, contenu)=>{
        if (err) {
            if (err.code === 'ENOENT') { // fichier inexistant
                reponse.writeHead(404, { 'Content-Type': 'text/html'});
                reponse.write('<h1>Page demand&eacute;e introuvable</h1>\n');
                reponse.write(`<h2>${fileName}</h2>`);
                reponse.end();        
            } else {
                reponse.writeHead(500, { 'Content-Type': 'text/html'});
                reponse.write('<h1>Erreur interne du serveur</h1>\n');
                reponse.write(`<h2>Code: ${err.code}</h2>`);
                reponse.end();                  
            }
        } else {
            reponse.writeHead(200, {'Content-Type': typeContenu});
            if (usagerTrouve) {
                contenu = contenu.replace('_nom_nom', usagerTrouve.nom);
                contenu = contenu.replace('_login_login', usagerTrouve.login);
            }
            reponse.write(contenu);
            reponse.end();
        }
    });
}