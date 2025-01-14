import { BskyAgent } from "@atproto/api";
import * as dotenv from "dotenv";
import { CronJob } from "cron";
import * as process from "process";
import http from "http";

dotenv.config();

const tempoAPI = "https://www.api-couleur-tempo.fr/api/jourTempo/today";
const tempoAPItomorrow =
  "https://www.api-couleur-tempo.fr/api/jourTempo/tomorrow";
const serverURL = "https://tempobsky.onrender.com";

// Create a Bluesky Agent
const agent = new BskyAgent({
  service: "https://bsky.social",
});

async function getTempoAndNotify() {
  try {
    // Appel à l'API pour récupérer le jour Tempo de demain
    const response = await fetch(tempoAPI, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des données Tempo");
    }

    // Récupérer la réponse JSON
    const tempoData = await response.json();
    console.log("Données Tempo reçues:", tempoData); // Ajout de log pour vérifier les données reçues
    let tempoDay = tempoData.codeJour; // Supposons que la réponse contient un champ 'codeJour'
    const today = new Date();

    let day: string | number = today.getDate();
    let month: string | number = today.getMonth() + 1;
    let year = today.getFullYear();

    day = day < 10 ? "0" + day : day.toString();
    month = month < 10 ? "0" + month : month.toString();

    // Format the date as dd/mm/yyyy
    const formattedDate = `${day}/${month}/${year}`;

    if (!tempoDay) {
      throw new Error("Erreur lors de la récupération du jour Tempo");
    }

    if (tempoDay == "2") {
      tempoDay =
        "⚪️ Blanc \nLe blanc, c'est la couleur de la paix… ou d'une tasse de café vide.";
    } else if (tempoDay == "1") {
      tempoDay =
        "🔵 Bleu \nBleu comme le fond d'écran par défaut sur les PC des années 2000.";
    } else if (tempoDay == "3") {
      tempoDay =
        "🔴 Rouge \nSi c'est rouge, c'est soit un feu de circulation, soit un dragon qui a mangé trop épicé.";
    }
    console.log(`Aujourd'hui (${formattedDate}) Tempo EDF: ${tempoDay}`);
    const text = `Aujourd'hui (${formattedDate}) Tempo EDF: ${tempoDay}`;
    return text;
  } catch (error) {
    console.error("Erreur lors de la récupération des données Tempo:", error);
  }
}

async function getTomorrow() {
  try {
    // Appel à l'API pour récupérer le jour Tempo de demain
    const response = await fetch(tempoAPItomorrow, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des données Tempo");
    }

    const tempoData = await response.json();
    console.log("Données Tempo reçues:", tempoData); // Ajout de log pour vérifier les données reçues
    let tempoDay = tempoData.codeJour; // Supposons que la réponse contient un champ 'codeJour'

    const today = new Date();

    // Calculer la date de demain
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let day: string | number = tomorrow.getDate();
    let month: string | number = tomorrow.getMonth() + 1; // Les mois sont indexés à partir de 0
    let year = tomorrow.getFullYear();

    day = day < 10 ? "0" + day : day.toString();
    month = month < 10 ? "0" + month : month.toString();

    // Format the date as dd/mm/yyyy
    const formattedDate = `${day}/${month}/${year}`;
    console.log(`Demain est le ${formattedDate}`);

    if (!tempoDay) {
      throw new Error("Erreur lors de la récupération du jour Tempo");
    }

    if (tempoDay == "2") {
      tempoDay =
        "⚪️ Blanc \nLe blanc, c'est la couleur de la paix… ou d'une tasse de café vide.";
    } else if (tempoDay == "1") {
      tempoDay =
        "🔵 Bleu \nBleu comme le fond d'écran par défaut sur les PC des années 2000.";
    } else if (tempoDay == "3") {
      tempoDay =
        "🔴 Rouge \nSi c'est rouge, c'est soit un feu de circulation, soit un dragon qui a mangé trop épicé.";
    }

    console.log(`Notification envoyée pour le ${formattedDate}: ${tempoDay}`);

    const text = `Demain (${formattedDate}) Tempo EDF: ${tempoDay}`;
    return text;
  } catch (error) {
    console.error("Erreur:", error);
    return "Erreur lors de la récupération des données Tempo pour demain.";
  }
}

async function mainToday() {
  await agent.login({
    identifier: process.env.BLUESKY_USERNAME!,
    password: process.env.BLUESKY_PASSWORD!,
  });
  const text = await getTempoAndNotify();

  await agent.post({
    text: text,
  });
  console.log("Just posted! Today");
}

async function mainTomorrow() {
  await agent.login({
    identifier: process.env.BLUESKY_USERNAME!,
    password: process.env.BLUESKY_PASSWORD!,
  });
  const text = await getTomorrow();

  await agent.post({
    text: text,
  });
  console.log("Just posted! Tomorrow");
}

console.log(new Date().toLocaleTimeString());

// Fonction pour garder le bot actif
async function keepAlive() {
  try {
    const response = await fetch(serverURL, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Erreur lors du ping du serveur");
    }

    console.log("Ping réussi:", new Date().toLocaleTimeString());
  } catch (error) {
    console.error("Erreur lors du ping du serveur:", error);
  }
}

// Créer un serveur HTTP pour écouter sur le port spécifié par Render
const port = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot is running\n");
  })
  .listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });

// Ping le serveur toutes les 10 minutes pour le garder actif
setInterval(keepAlive, 600000);

// Run this on a cron job
const scheduleExpression = "30 6 * * *"; // Run at 7:30 AM every day (UTC time)

const jobToday = new CronJob(scheduleExpression, mainToday); // change to scheduleExpressionMinute for testing
const jobTomorrow = new CronJob(scheduleExpression, mainTomorrow); // change to scheduleExpressionMinute for testing

jobToday.start();
jobTomorrow.start();
