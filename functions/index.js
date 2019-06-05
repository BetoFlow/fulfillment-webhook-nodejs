// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const {google} = require('googleapis');
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Text, Card, Image, Suggestion, Payload} = require('dialogflow-fulfillment');
const {dialogflow, BasicCard, SimpleResponse} = require('actions-on-google');
const admin = require('firebase-admin');
const request = require('request');

const app = dialogflow({
  debug: true
});

// Do common tasks for each intent invocation
app.middleware((conv, framework) => {
  console.log(`Intent=${conv.intent}`);
  console.log(`Type=${conv.input.type}`);
  // Determine if the user input is by voice
  conv.voice = conv.input.type === 'VOICE';
  if (!(conv.intent === 'Default Fallback Intent' || conv.intent === 'No-input')) {
    // Reset the fallback counter for error handling
    conv.data.fallbackCount = 0;
  }
});
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const timeZone = 'America/Argentina/Buenos_Aires';  // Change it to your time zone
const timeZoneOffset = '-03:00';         // Change it to your time zone offset

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
	const agent = new WebhookClient({ request, response });
	console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
	console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

	function welcome(agent) {
		agent.add(`Welcome to my agent!`);
		}

	function fallback(agent) {
		agent.add(`I didn't understand`);
		agent.add(`I'm sorry, can you try again?`);
		}

	

	let intentMap = new Map();
	intentMap.set('Default Welcome Intent', welcome);
	intentMap.set('Default Fallback Intent', fallback);
	intentMap.set('Game', Game2);
  intentMap.set('productComposition', readFromDbEs);
	intentMap.set('preparation', preparation);
	intentMap.set('doses', doses);
	agent.handleRequest(intentMap);
});
